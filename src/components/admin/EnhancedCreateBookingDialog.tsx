import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Phone, Mail, Calendar, PoundSterling, Plus, Coins } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminTimeSlotPicker } from "./AdminTimeSlotPicker";

interface TokenRecord {
  id: string;
  customer_email: string;
  tokens_remaining: number;
  expires_at: string | null;
  notes: string | null;
}

interface EnhancedCreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

export function EnhancedCreateBookingDialog({ 
  open, 
  onOpenChange, 
  selectedDate, 
  selectedTime 
}: EnhancedCreateBookingDialogProps) {
  const [step, setStep] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<TokenRecord[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [useToken, setUseToken] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    booking_type: "communal",
    service_type: "",
    session_date: "",
    session_time: "",
    time_slot_id: "",
    duration_minutes: 60,
    guest_count: 1,
    price_amount: 0,
    special_requests: "",
    booking_status: "confirmed",
    payment_status: "pending"
  });

  const queryClient = useQueryClient();

  const { data: existingCustomers } = useQuery({
    queryKey: ["customer-search", customerSearch],
    queryFn: async () => {
      if (!customerSearch.trim()) return [];
      
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, email, phone, tags")
        .or(`full_name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: customerSearch.length > 2,
  });

  const { data: pricingConfig } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("*");

      if (error) throw error;
      return data;
    },
  });

  // Fetch tokens when email changes
  useEffect(() => {
    const fetchTokens = async () => {
      const email = bookingForm.customer_email?.toLowerCase().trim();
      if (!email || !email.includes('@')) {
        setAvailableTokens([]);
        setTotalTokens(0);
        setUseToken(false);
        return;
      }

      const { data, error } = await supabase
        .from('customer_tokens')
        .select('*')
        .eq('customer_email', email)
        .gt('tokens_remaining', 0);

      if (!error && data) {
        // Filter: tokens that never expire OR haven't expired yet
        const validTokens = data.filter(token => 
          !token.expires_at || new Date(token.expires_at) > new Date()
        );
        setAvailableTokens(validTokens);
        const total = validTokens.reduce((sum, t) => sum + t.tokens_remaining, 0);
        setTotalTokens(total);
      } else {
        setAvailableTokens([]);
        setTotalTokens(0);
      }
    };

    fetchTokens();
  }, [bookingForm.customer_email]);

  // Reset useToken when guest count exceeds available tokens OR when switching to private session
  useEffect(() => {
    if (useToken && (bookingForm.guest_count > totalTokens || bookingForm.service_type === 'Private Session')) {
      setUseToken(false);
    }
  }, [bookingForm.guest_count, totalTokens, useToken, bookingForm.service_type]);

  const createBookingMutation = useMutation({
    mutationFn: async (booking: any) => {
      // If creating a new customer or if no customer is selected, upsert the customer record first.
      if (!selectedCustomer?.id || isNewCustomer) {
        const { error: customerErr } = await supabase
          .from("customers")
          .upsert(
            {
              full_name: booking.customer_name,
              email: booking.customer_email,
              phone: booking.customer_phone || null,
            },
            { onConflict: "email" }
          );
        if (customerErr) throw customerErr;
      }

      // Adjust payment if using tokens
      const finalBooking = {
        ...booking,
        payment_status: useToken ? 'paid' : booking.payment_status,
        final_amount: useToken ? 0 : booking.price_amount,
        special_requests: useToken 
          ? `${booking.special_requests || ''} [Paid with ${booking.guest_count} token(s)]`.trim()
          : booking.special_requests,
      };

      const { data, error } = await supabase
        .from("bookings")
        .insert(finalBooking)
        .select()
        .single();

      if (error) throw error;

      // Update time slot availability if we have a time_slot_id
      if (booking.time_slot_id) {
        // Fetch current bookings for this slot (both paid and pending)
        const { data: existingBookings } = await supabase
          .from("bookings")
          .select("booking_type, guest_count")
          .eq("time_slot_id", booking.time_slot_id)
          .in("payment_status", ["paid", "pending"]);

        const totalGuests = (existingBookings || [])
          .filter(b => b.booking_type === 'communal')
          .reduce((sum, b) => sum + (b.guest_count || 1), 0);

        const hasPrivate = (existingBookings || []).some(b => b.booking_type === 'private');

        await supabase
          .from("time_slots")
          .update({
            booked_count: hasPrivate ? 5 : totalGuests,
            is_available: hasPrivate ? false : totalGuests < 5,
            updated_at: new Date().toISOString()
          })
          .eq("id", booking.time_slot_id);
      }

      // Deduct tokens if using token payment
      if (useToken) {
        let tokensToDeduct = booking.guest_count;
        
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
              updated_at: new Date().toISOString()
            })
            .eq('id', token.id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["daily-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["customer-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["time-slots"] });
      toast.success(useToken 
        ? `Booking created using ${bookingForm.guest_count} token(s)`
        : "Booking created successfully"
      );
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create booking");
      console.error("Create booking error:", error);
    },
  });

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setBookingForm(prev => ({
        ...prev,
        session_date: dateStr,
        session_time: selectedTime
      }));
    }
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    if (bookingForm.service_type && pricingConfig) {
      const pricing = pricingConfig.find(p => p.service_type.toLowerCase() === bookingForm.service_type.toLowerCase());
      if (pricing) {
        setBookingForm(prev => ({
          ...prev,
          price_amount: pricing.price_amount,
          duration_minutes: pricing.duration_minutes
        }));
      }
    }
  }, [bookingForm.service_type, pricingConfig]);

  const resetForm = () => {
    setStep(1);
    setCustomerSearch("");
    setSelectedCustomer(null);
    setIsNewCustomer(false);
    setAvailableTokens([]);
    setTotalTokens(0);
    setUseToken(false);
    setBookingForm({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      booking_type: "communal",
      service_type: "",
      session_date: "",
      session_time: "",
      time_slot_id: "",
      duration_minutes: 60,
      guest_count: 1,
      price_amount: 0,
      special_requests: "",
      booking_status: "confirmed",
      payment_status: "pending"
    });
    onOpenChange(false);
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setBookingForm(prev => ({
      ...prev,
      customer_name: customer.full_name || "",
      customer_email: customer.email || "",
      customer_phone: customer.phone || ""
    }));
    setStep(2);
  };

  const handleNewCustomer = () => {
    setIsNewCustomer(true);
    setSelectedCustomer(null);
    setStep(2);
  };

  const handleCreateBooking = () => {
    if (!bookingForm.customer_name || !bookingForm.customer_email || !bookingForm.service_type || !bookingForm.session_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    createBookingMutation.mutate(bookingForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Booking
            <Badge variant="outline">Step {step} of 3</Badge>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search for existing customer</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {existingCustomers && existingCustomers.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Customers</Label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {existingCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{customer.full_name || "No name"}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                            {customer.phone && (
                              <>
                                <Phone className="h-3 w-3 ml-2" />
                                {customer.phone}
                              </>
                            )}
                          </div>
                        </div>
                        <Button size="sm">Select</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button onClick={handleNewCustomer} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create New Customer
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Customer Information</h3>
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Full Name *</Label>
                <Input
                  id="customer_name"
                  value={bookingForm.customer_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, customer_name: e.target.value })}
                  disabled={!isNewCustomer && selectedCustomer}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={bookingForm.customer_email}
                  onChange={(e) => setBookingForm({ ...bookingForm, customer_email: e.target.value })}
                  disabled={!isNewCustomer && selectedCustomer}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                value={bookingForm.customer_phone}
                onChange={(e) => setBookingForm({ ...bookingForm, customer_phone: e.target.value })}
                disabled={!isNewCustomer && selectedCustomer}
              />
            </div>

            {/* Show token balance if customer has tokens */}
            {totalTokens > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary text-primary-foreground">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Customer has {totalTokens} session token(s)</p>
                      <p className="text-sm text-muted-foreground">Can be used for payment in the next step</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={() => setStep(3)} className="w-full">
              Continue to Booking Details
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Booking Details</h3>
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
            </div>

            {/* Token Payment Option - Only for communal sessions */}
            {totalTokens > 0 && bookingForm.service_type === 'Communal Session' && (
              <Card className={cn(
                "border-2 transition-colors",
                useToken ? "border-primary bg-primary/5" : "border-dashed"
              )}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        useToken ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <Coins className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Pay with Session Tokens</p>
                        <p className="text-sm text-muted-foreground">
                          {totalTokens} token(s) available • Uses {bookingForm.guest_count} token(s)
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useToken}
                      onCheckedChange={setUseToken}
                      disabled={bookingForm.guest_count > totalTokens}
                    />
                  </div>
                  {bookingForm.guest_count > totalTokens && (
                    <p className="text-sm text-destructive mt-2">
                      Not enough tokens. Customer has {totalTokens} but needs {bookingForm.guest_count}.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Show message when tokens available but private selected */}
            {totalTokens > 0 && bookingForm.service_type === 'Private Session' && (
              <Card className="border-dashed border-muted-foreground/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <Coins className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Session Tokens ({totalTokens} available)</p>
                      <p className="text-sm text-muted-foreground">Tokens can only be used for communal sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type *</Label>
                <Select value={bookingForm.service_type} onValueChange={(value) => setBookingForm({ ...bookingForm, service_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Communal Session">Communal Session</SelectItem>
                    <SelectItem value="Private Session">Private Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_status">Booking Status</Label>
                <Select value={bookingForm.booking_status} onValueChange={(value) => setBookingForm({ ...bookingForm, booking_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select value={bookingForm.payment_status} onValueChange={(value) => setBookingForm({ ...bookingForm, payment_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Unpaid (Pay on arrival)</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time Slot Picker */}
            {bookingForm.service_type && (
              <AdminTimeSlotPicker
                serviceType={bookingForm.service_type}
                selectedDate={bookingForm.session_date}
                selectedTime={bookingForm.session_time}
                onDateChange={(date) => setBookingForm({ ...bookingForm, session_date: date, time_slot_id: "" })}
                onTimeChange={(time, timeSlotId) => setBookingForm({ ...bookingForm, session_time: time, time_slot_id: timeSlotId || "" })}
              />
            )}

            {!bookingForm.service_type && (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a service type to see available dates and times</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="booking_type">Booking Type</Label>
                <Select value={bookingForm.booking_type} onValueChange={(value) => setBookingForm({ ...bookingForm, booking_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="communal">Communal</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_count">Guest Count</Label>
                <Input
                  id="guest_count"
                  type="number"
                  min="1"
                  value={bookingForm.guest_count}
                  onChange={(e) => setBookingForm({ ...bookingForm, guest_count: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={bookingForm.duration_minutes}
                  onChange={(e) => setBookingForm({ ...bookingForm, duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_amount">
                  Price (pence) {useToken && <Badge variant="secondary" className="ml-2">Using Tokens</Badge>}
                </Label>
                <div className="relative">
                  <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="price_amount"
                    type="number"
                    value={bookingForm.price_amount}
                    onChange={(e) => setBookingForm({ ...bookingForm, price_amount: parseFloat(e.target.value) || 0 })}
                    className={cn("pl-10", useToken && "opacity-50")}
                    disabled={useToken}
                  />
                </div>
                {useToken && (
                  <p className="text-xs text-muted-foreground">Price will be £0.00 (paid with tokens)</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_requests">Special Requests</Label>
              <Textarea
                id="special_requests"
                placeholder="Any special requirements or notes..."
                value={bookingForm.special_requests}
                onChange={(e) => setBookingForm({ ...bookingForm, special_requests: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateBooking}
                disabled={createBookingMutation.isPending}
              >
                {useToken ? `Create Booking (${bookingForm.guest_count} Token${bookingForm.guest_count > 1 ? 's' : ''})` : 'Create Booking'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
