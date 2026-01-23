
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().optional(),
  session_date: z.date({
    required_error: 'Session date is required',
  }),
  session_time: z.string().min(1, 'Session time is required'),
  booking_type: z.enum(['communal', 'private']),
  guest_count: z.number().min(1).max(5),
  service_type: z.enum(['combined']),
  price_amount: z.number().min(0),
  payment_status: z.enum(['paid', 'pending', 'comp', 'token']),
  special_requests: z.string().optional(),
  use_token: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TokenRecord {
  id: string;
  customer_email: string;
  tokens_remaining: number;
  expires_at: string | null;
  notes: string | null;
}

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingCreated: () => void;
  preselectedDate?: Date;
}

export const CreateBookingDialog = ({
  open,
  onOpenChange,
  onBookingCreated,
  preselectedDate
}: CreateBookingDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<TokenRecord[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [useToken, setUseToken] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      session_date: preselectedDate || new Date(),
      session_time: '',
      booking_type: 'communal',
      guest_count: 1,
      service_type: 'combined',
      price_amount: 3500, // £35.00 in pence
      payment_status: 'paid',
      special_requests: '',
      use_token: false,
    },
  });

  const watchedEmail = form.watch('customer_email');
  const watchedGuestCount = form.watch('guest_count');

  // Fetch available tokens when email changes
  useEffect(() => {
    const fetchTokens = async () => {
      if (!watchedEmail || !watchedEmail.includes('@')) {
        setAvailableTokens([]);
        setTotalTokens(0);
        return;
      }

      const { data, error } = await supabase
        .from('customer_tokens')
        .select('*')
        .eq('customer_email', watchedEmail)
        .gt('tokens_remaining', 0)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (!error && data) {
        setAvailableTokens(data);
        const total = data.reduce((sum, t) => sum + t.tokens_remaining, 0);
        setTotalTokens(total);
      } else {
        setAvailableTokens([]);
        setTotalTokens(0);
      }
    };

    fetchTokens();
  }, [watchedEmail]);

  // Reset useToken when guest count exceeds available tokens
  useEffect(() => {
    if (useToken && watchedGuestCount > totalTokens) {
      setUseToken(false);
    }
  }, [watchedGuestCount, totalTokens, useToken]);

  // Generate time slots
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 9 + i;
    return {
      value: `${hour.toString().padStart(2, '0')}:00:00`,
      label: `${hour.toString().padStart(2, '0')}:00`
    };
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      // Create or find time slot
      const sessionDateStr = format(data.session_date, 'yyyy-MM-dd');
      
      let { data: timeSlot, error: timeSlotError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('slot_date', sessionDateStr)
        .eq('slot_time', data.session_time)
        .eq('service_type', data.service_type)
        .single();

      if (timeSlotError && timeSlotError.code === 'PGRST116') {
        // Create new time slot
        const { data: newTimeSlot, error: createError } = await supabase
          .from('time_slots')
          .insert({
            slot_date: sessionDateStr,
            slot_time: data.session_time,
            service_type: data.service_type,
            capacity: 5,
            booked_count: 0,
            is_available: true
          })
          .select()
          .single();

        if (createError) throw createError;
        timeSlot = newTimeSlot;
      } else if (timeSlotError) {
        throw timeSlotError;
      }

      if (!timeSlot) {
        throw new Error('Failed to get time slot');
      }

      // Create the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: null, // Admin created booking
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          session_date: sessionDateStr,
          session_time: data.session_time,
          service_type: data.service_type,
          booking_type: data.booking_type,
          guest_count: data.guest_count,
          duration_minutes: 60,
          price_amount: data.price_amount,
          final_amount: useToken ? 0 : data.price_amount,
          payment_status: useToken ? 'paid' : data.payment_status,
          booking_status: 'confirmed',
          special_requests: useToken 
            ? `${data.special_requests || ''} [Paid with ${data.guest_count} token(s)]`.trim()
            : data.special_requests,
          time_slot_id: timeSlot.id,
        });

      if (bookingError) throw bookingError;

      // Deduct tokens if using token payment
      if (useToken) {
        let tokensToDeduct = data.guest_count;
        
        // Sort tokens by expiry (soonest first, never-expire last)
        const sortedTokens = [...availableTokens].sort((a, b) => {
          if (!a.expires_at) return 1;
          if (!b.expires_at) return -1;
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        });

        for (const token of sortedTokens) {
          if (tokensToDeduct <= 0) break;
          
          const deductFromThis = Math.min(tokensToDeduct, token.tokens_remaining);
          tokensToDeduct -= deductFromThis;
          
          await supabase
            .from('customer_tokens')
            .update({ 
              tokens_remaining: token.tokens_remaining - deductFromThis,
            })
            .eq('id', token.id);
        }
      }

      // Update time slot availability
      const newBookedCount = timeSlot.booked_count + data.guest_count;
      const isAvailable = data.booking_type === 'private' ? false : newBookedCount < 5;

      await supabase
        .from('time_slots')
        .update({
          booked_count: newBookedCount,
          is_available: isAvailable
        })
        .eq('id', timeSlot.id);

      toast({
        title: "Booking created",
        description: useToken 
          ? `Booking created using ${data.guest_count} token(s)`
          : "Booking created successfully",
      });

      onBookingCreated();
      form.reset();
      setUseToken(false);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="customer@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="session_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Session Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="session_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {slot.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="booking_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="communal">Communal</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="guest_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="comp">Complimentary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (£)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value) * 100) || 0)}
                      value={field.value / 100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="special_requests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special requests or notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Token Payment Option */}
            {totalTokens > 0 && (
              <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="use_token" className="font-medium">Use Session Tokens</Label>
                      <p className="text-sm text-muted-foreground">
                        Customer has {totalTokens} token(s) available
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="use_token"
                    checked={useToken}
                    onCheckedChange={(checked) => {
                      setUseToken(checked);
                      if (checked) {
                        form.setValue('payment_status', 'paid');
                      }
                    }}
                    disabled={watchedGuestCount > totalTokens}
                  />
                </div>
                {watchedGuestCount > totalTokens && (
                  <p className="text-sm text-destructive">
                    Not enough tokens. Need {watchedGuestCount}, have {totalTokens}.
                  </p>
                )}
                {useToken && (
                  <Badge variant="default" className="mt-2">
                    Will deduct {watchedGuestCount} token(s)
                  </Badge>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setUseToken(false);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : useToken ? `Create (Use ${watchedGuestCount} Token${watchedGuestCount > 1 ? 's' : ''})` : 'Create Booking'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
