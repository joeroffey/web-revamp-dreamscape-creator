import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, Phone, Mail, Calendar, Clock, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

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
  const [bookingForm, setBookingForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    booking_type: "communal",
    service_type: "",
    session_date: "",
    session_time: "",
    duration_minutes: 60,
    guest_count: 1,
    price_amount: 0,
    special_requests: "",
    booking_status: "confirmed"
  });

  const queryClient = useQueryClient();

  const { data: existingCustomers } = useQuery({
    queryKey: ["customer-search", customerSearch],
    queryFn: async () => {
      if (!customerSearch.trim()) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
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

  const createBookingMutation = useMutation({
    mutationFn: async (booking: any) => {
      const { data, error } = await supabase
        .from("bookings")
        .insert(booking)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["daily-bookings"] });
      toast.success("Booking created successfully");
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
    setBookingForm({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      booking_type: "communal",
      service_type: "",
      session_date: "",
      session_time: "",
      duration_minutes: 60,
      guest_count: 1,
      price_amount: 0,
      special_requests: "",
      booking_status: "confirmed"
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{customer.full_name || "No name"}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {customer.id}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type *</Label>
                <Select value={bookingForm.service_type} onValueChange={(value) => setBookingForm({ ...bookingForm, service_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ice_bath">Ice Bath</SelectItem>
                    <SelectItem value="sauna">Sauna</SelectItem>
                    <SelectItem value="combined">Combined Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_status">Status</Label>
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
                <Label htmlFor="session_date">Date *</Label>
                <Input
                  id="session_date"
                  type="date"
                  value={bookingForm.session_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, session_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session_time">Time *</Label>
                <Input
                  id="session_time"
                  type="time"
                  value={bookingForm.session_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, session_time: e.target.value })}
                />
              </div>
            </div>

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
                <Label htmlFor="price_amount">Price (£)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="price_amount"
                    type="number"
                    step="0.01"
                    value={bookingForm.price_amount}
                    onChange={(e) => setBookingForm({ ...bookingForm, price_amount: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                  />
                </div>
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
                Create Booking
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
