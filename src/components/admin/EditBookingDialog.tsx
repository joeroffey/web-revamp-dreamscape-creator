import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parse } from 'date-fns';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2, Ban, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Valid email is required'),
  customer_phone: z.string().optional(),
  guest_count: z.number().min(1, 'At least 1 guest required').max(10, 'Maximum 10 guests'),
  session_date: z.date({ required_error: 'Session date is required' }),
  session_time: z.string().min(1, 'Session time is required'),
  payment_status: z.enum(['paid', 'pending', 'cancelled', 'refunded', 'partial_refund']),
  special_requests: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BookingData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  guest_count: number;
  session_date: string;
  session_time: string;
  payment_status: string;
  special_requests?: string;
  stripe_session_id?: string;
  price_amount?: number;
  final_amount?: number;
  time_slot_id?: string;
  booking_type?: string;
}

interface EditBookingDialogProps {
  booking: BookingData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingUpdated: () => void;
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export const EditBookingDialog = ({
  booking,
  open,
  onOpenChange,
  onBookingUpdated
}: EditBookingDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone || '',
      guest_count: booking.guest_count || 1,
      session_date: parse(booking.session_date, 'yyyy-MM-dd', new Date()),
      session_time: booking.session_time?.substring(0, 5) || '09:00',
      payment_status: booking.payment_status as any,
      special_requests: booking.special_requests || '',
    },
  });

  useEffect(() => {
    form.reset({
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone || '',
      guest_count: booking.guest_count || 1,
      session_date: parse(booking.session_date, 'yyyy-MM-dd', new Date()),
      session_time: booking.session_time?.substring(0, 5) || '09:00',
      payment_status: booking.payment_status as any,
      special_requests: booking.special_requests || '',
    });
  }, [booking, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      const newDate = format(data.session_date, 'yyyy-MM-dd');
      const newTime = data.session_time + ':00';
      const oldDate = booking.session_date;
      const oldTime = booking.session_time;
      const oldGuestCount = booking.guest_count || 1;
      const newGuestCount = data.guest_count;

      // Check if date, time, or guest count changed
      const dateTimeChanged = newDate !== oldDate || newTime !== oldTime;
      const guestCountChanged = newGuestCount !== oldGuestCount;

      // If date/time changed or guest count changed, update time slots
      if ((dateTimeChanged || guestCountChanged) && booking.payment_status === 'paid') {
        // First, release capacity from the old time slot
        if (booking.time_slot_id) {
          const { data: oldSlot } = await supabase
            .from('time_slots')
            .select('booked_count')
            .eq('id', booking.time_slot_id)
            .single();

          if (oldSlot) {
            const newBookedCount = Math.max(0, (oldSlot.booked_count || 0) - oldGuestCount);
            await supabase
              .from('time_slots')
              .update({
                booked_count: newBookedCount,
                is_available: newBookedCount < 5,
                updated_at: new Date().toISOString(),
              })
              .eq('id', booking.time_slot_id);
          }
        }

        // Find or create the new time slot
        let newTimeSlotId = booking.time_slot_id;
        
        if (dateTimeChanged) {
          // Look for existing time slot
          const { data: existingSlot } = await supabase
            .from('time_slots')
            .select('id, booked_count, is_available')
            .eq('slot_date', newDate)
            .eq('slot_time', newTime)
            .eq('service_type', 'combined')
            .maybeSingle();

          if (existingSlot) {
            newTimeSlotId = existingSlot.id;
            
            // Update the new slot's booked count
            const updatedBookedCount = (existingSlot.booked_count || 0) + newGuestCount;
            await supabase
              .from('time_slots')
              .update({
                booked_count: updatedBookedCount,
                is_available: updatedBookedCount < 5,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingSlot.id);
          } else {
            // Create new time slot
            const { data: newSlot, error: slotError } = await supabase
              .from('time_slots')
              .insert({
                slot_date: newDate,
                slot_time: newTime,
                service_type: 'combined',
                booked_count: newGuestCount,
                is_available: newGuestCount < 5,
              })
              .select('id')
              .single();

            if (slotError) throw slotError;
            newTimeSlotId = newSlot.id;
          }
        } else if (guestCountChanged && booking.time_slot_id) {
          // Only guest count changed, update the same slot
          const { data: currentSlot } = await supabase
            .from('time_slots')
            .select('booked_count')
            .eq('id', booking.time_slot_id)
            .single();

          if (currentSlot) {
            // We already decremented above, now add new guest count
            const updatedBookedCount = (currentSlot.booked_count || 0) + newGuestCount;
            await supabase
              .from('time_slots')
              .update({
                booked_count: updatedBookedCount,
                is_available: updatedBookedCount < 5,
                updated_at: new Date().toISOString(),
              })
              .eq('id', booking.time_slot_id);
          }
        }

        // Update booking with new time slot id
        const { error } = await supabase
          .from('bookings')
          .update({
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone || null,
            guest_count: data.guest_count,
            session_date: newDate,
            session_time: newTime,
            time_slot_id: newTimeSlotId,
            payment_status: data.payment_status,
            special_requests: data.special_requests || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (error) throw error;
      } else {
        // No time slot changes needed
        const { error } = await supabase
          .from('bookings')
          .update({
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone || null,
            guest_count: data.guest_count,
            session_date: newDate,
            session_time: newTime,
            payment_status: data.payment_status,
            special_requests: data.special_requests || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      onBookingUpdated();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      setLoading(true);

      // Use edge function to handle cancellation properly (updates time slots, refunds tokens)
      const { data, error } = await supabase.functions.invoke('cancel-booking', {
        body: { bookingId: booking.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      let description = "The booking has been cancelled successfully.";
      if (data?.tokenRefunded) {
        description += " Session token has been refunded.";
      }
      if (data?.slotsFreed) {
        description += ` ${data.slotsFreed} slot(s) are now available.`;
      }

      toast({
        title: "Booking Cancelled",
        description,
      });

      setShowCancelDialog(false);
      onBookingUpdated();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (refundType: 'full' | 'partial') => {
    try {
      setRefundLoading(true);

      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: { bookingId: booking.id, refundType },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const refundAmount = data.refundAmount ? `£${(data.refundAmount / 100).toFixed(2)}` : '';

      toast({
        title: "Refund Processed",
        description: `${refundType === 'full' ? 'Full' : 'Partial'} refund of ${refundAmount} has been processed successfully.`,
      });

      setShowRefundDialog(false);
      onBookingUpdated();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Refund Failed",
        description: error instanceof Error ? error.message : "Failed to process refund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefundLoading(false);
    }
  };

  const canRefund = booking.payment_status === 'paid' && booking.stripe_session_id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Customer Details */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Customer Details</h3>
                
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
                
                <div className="grid grid-cols-2 gap-4">
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

                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Session Details */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Session Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="session_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
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
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
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
                        <FormLabel>Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="guest_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Guests</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select guest count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'Guest' : 'Guests'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Payment Status</h3>
                
                <FormField
                  control={form.control}
                  name="payment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                          <SelectItem value="partial_refund">Partial Refund</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="special_requests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requests</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any special requests or notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t">
                <div className="flex justify-between gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={loading || booking.booking_status === 'cancelled'}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Cancel Booking
                    </Button>
                    
                    {canRefund && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRefundDialog(true)}
                        disabled={loading || refundLoading}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Process Refund
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Booking'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the booking for {booking.customer_name}. 
              The customer will not be automatically notified.
              {canRefund && " You may want to process a refund after cancelling."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Dialog */}
      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the refund type for this booking. The refund will be processed through Stripe.
              {booking.final_amount && (
                <span className="block mt-2 font-medium">
                  Original payment: £{((booking.final_amount || booking.price_amount || 0) / 100).toFixed(2)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={refundLoading}>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleRefund('partial')}
              disabled={refundLoading}
            >
              {refundLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              50% Refund
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRefund('full')}
              disabled={refundLoading}
            >
              {refundLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Full Refund
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
