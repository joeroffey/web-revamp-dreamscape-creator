
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { Calendar, Clock, User, Mail, Phone, Check, AlertCircle, Users, CreditCard, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthContext";

interface MembershipStatus {
  hasMembership: boolean;
  canBook: boolean;
  hasBookingForDate?: boolean;
  bookingForDate?: {
    id: string;
    session_date: string;
    session_time: string;
    booking_type: string;
  } | null;
  membership: {
    id: string;
    type: string;
    sessionsPerWeek: number;
    sessionsRemaining: number;
    isUnlimited: boolean;
    startDate: string;
    endDate: string;
    customerEmail: string;
    customerName: string;
  } | null;
}

const Booking = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    id: string;
    date: string;
    time: string;
  } | null>(null);
  const [availableSpaces, setAvailableSpaces] = useState<number>(4);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [pricing, setPricing] = useState({ combined: 1800, private: 7000 }); // pence
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    specialRequests: "",
    bookingType: "communal" as "communal" | "private",
    guestCount: 1,
    payingGuestCount: 0, // Guests that will pay separately
  });

  // Fetch pricing from database
  useEffect(() => {
    const fetchPricing = async () => {
      const { data } = await supabase
        .from('pricing_config')
        .select('service_type, price_amount')
        .eq('is_active', true)
        .in('service_type', ['combined', 'private']);
      
      if (data) {
        const newPricing = { ...pricing };
        data.forEach(p => {
          if (p.service_type === 'combined') newPricing.combined = p.price_amount;
          if (p.service_type === 'private') newPricing.private = p.price_amount;
        });
        setPricing(newPricing);
      }
    };
    fetchPricing();
  }, []);

  // Check membership status when user is logged in or when selected date changes
  const checkMembershipForDate = async (dateToCheck?: string) => {
    if (!user?.id) {
      setMembershipStatus(null);
      return;
    }

    setCheckingMembership(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-membership-status', {
        body: { 
          userId: user.id,
          checkDate: dateToCheck || selectedTimeSlot?.date
        }
      });

      if (error) {
        console.error('Error checking membership:', error);
        setMembershipStatus(null);
      } else {
        setMembershipStatus(data);
        // Pre-fill form data from membership if available
        if (data?.membership?.customerName) {
          setFormData(prev => ({
            ...prev,
            customerName: data.membership.customerName || prev.customerName,
            customerEmail: data.membership.customerEmail || prev.customerEmail,
            guestCount: 1, // Members always book for 1 (themselves)
          }));
        }
      }
    } catch (err) {
      console.error('Error checking membership:', err);
      setMembershipStatus(null);
    } finally {
      setCheckingMembership(false);
    }
  };

  useEffect(() => {
    checkMembershipForDate();
  }, [user?.id]);

  // Pre-fill user data from auth and profile if no membership
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && !membershipStatus?.membership) {
        // First set what we have from auth metadata
        setFormData(prev => ({
          ...prev,
          customerEmail: user.email || prev.customerEmail,
          customerName: user.user_metadata?.full_name || user.user_metadata?.name || prev.customerName
        }));

        // Then fetch additional profile data (like phone)
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            customerName: profile.full_name || prev.customerName,
            customerPhone: profile.phone || prev.customerPhone
          }));
        }
      }
    };

    fetchUserProfile();
  }, [user, membershipStatus]);

  const services = [
    {
      id: "combined",
      icon: Calendar,
      name: "Communal Session",
      duration: "1 hour",
      price: "£18",
      description: "Complete thermal therapy experience with both ice bath and sauna for optimal recovery and wellness"
    }
  ];

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.customerName.trim()) {
      errors.customerName = "Name is required";
    }
    
    if (!formData.customerEmail.trim()) {
      errors.customerEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      errors.customerEmail = "Please enter a valid email address";
    }
    
    if (!selectedTimeSlot) {
      errors.timeSlot = "Please select a time slot";
    }
    
    if (formData.guestCount < 1) {
      errors.guestCount = "Guest count must be at least 1";
    }
    
    if (formData.bookingType === "communal" && formData.guestCount > availableSpaces) {
      errors.guestCount = `Only ${availableSpaces} spaces available for this slot`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ""
      });
    }
  };

  const handleGuestCountChange = (value: string) => {
    const newGuestCount = parseInt(value) || 1;
    
    // Auto-convert to private if booking 4 people in communal
    if (formData.bookingType === "communal" && newGuestCount === 4) {
      setFormData(prev => ({ 
        ...prev, 
        guestCount: newGuestCount, 
        bookingType: "private" 
      }));
      toast({
        title: "Booking Type Changed",
        description: "Automatically switched to private booking for 4+ guests.",
      });
    } else {
      setFormData(prev => ({ ...prev, guestCount: newGuestCount }));
    }
    
    // Clear error for this field
    if (formErrors.guestCount) {
      setFormErrors(prev => ({ ...prev, guestCount: "" }));
    }
  };

  const handleBookingTypeChange = (value: "communal" | "private") => {
    // Prevent switching to private if slot doesn't have full availability
    if (value === "private" && availableSpaces < 5) {
      toast({
        title: "Private Session Unavailable",
        description: "Private sessions require an empty time slot. Please select a slot with 5/5 spaces available.",
        variant: "destructive",
      });
      return;
    }
    
    setFormData(prev => ({ ...prev, bookingType: value }));
    
    // Adjust guest count if switching to communal and current count exceeds available spaces
    if (value === "communal" && formData.guestCount > availableSpaces) {
      setFormData(prev => ({ ...prev, guestCount: availableSpaces }));
    }
  };

  const handleTimeSlotSelect = (slotId: string, date: string, time: string, spaces?: number) => {
    setSelectedTimeSlot({ id: slotId, date, time });
    const newAvailableSpaces = spaces ?? 5;
    setAvailableSpaces(newAvailableSpaces);
    
    // Re-check membership status for the selected date
    if (user?.id && membershipStatus?.hasMembership) {
      checkMembershipForDate(date);
    }
    
    // If currently set to private but new slot doesn't have full availability, switch to communal
    if (formData.bookingType === "private" && newAvailableSpaces < 5) {
      setFormData(prev => ({ ...prev, bookingType: "communal", guestCount: Math.min(prev.guestCount, newAvailableSpaces) }));
      toast({
        title: "Switched to Communal",
        description: "Private sessions require an empty time slot. Switched to communal booking.",
      });
    }
    
    // Auto-adjust guest count if it exceeds available spaces for communal bookings
    if (formData.bookingType === "communal" && formData.guestCount > newAvailableSpaces) {
      setFormData(prev => ({ ...prev, guestCount: newAvailableSpaces }));
    }
    
    // Clear time slot error
    if (formErrors.timeSlot) {
      setFormErrors({
        ...formErrors,
        timeSlot: ""
      });
    }
  };

  const calculateTotalPrice = () => {
    if (formData.bookingType === 'private') {
      return pricing.private / 100;
    }
    // For members with paying guests, only guests pay
    if (canUseMembership) {
      return (pricing.combined / 100) * formData.payingGuestCount;
    }
    return (pricing.combined / 100) * formData.guestCount;
  };

  const canUseMembership = membershipStatus?.hasMembership && membershipStatus?.canBook && !membershipStatus?.hasBookingForDate;
  const hasBookingForSelectedDate = membershipStatus?.hasBookingForDate;

  const handleMemberBooking = async () => {
    if (!validateForm() || !user?.id) {
      toast({
        title: "Please Complete All Required Fields",
        description: "Check the form for any missing information.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // If member has paying guests, we need to handle payment for them
      if (formData.payingGuestCount > 0) {
        // Create a paid booking for the guests via Stripe
        const { data, error } = await supabase.functions.invoke('create-member-booking-with-guests', {
          body: {
            userId: user.id,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone,
            timeSlotId: selectedTimeSlot!.id,
            specialRequests: formData.specialRequests,
            payingGuestCount: formData.payingGuestCount,
          }
        });

        if (error) {
          throw new Error(error.message || "Failed to create booking");
        }

        // Redirect to Stripe for guest payment
        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No payment URL received");
        }
      } else {
        // No paying guests, just book the member's spot
        const { data, error } = await supabase.functions.invoke('create-member-booking', {
          body: {
            userId: user.id,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone,
            timeSlotId: selectedTimeSlot!.id,
            specialRequests: formData.specialRequests,
          }
        });

        if (error) {
          throw new Error(error.message || "Failed to create booking");
        }

        if (data?.success) {
          window.location.href = `/booking-success?membership=true&sessions=${data.sessionsRemaining}`;
        } else {
          throw new Error(data?.error || "Failed to create booking");
        }
      }
    } catch (error) {
      console.error('Member booking error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!validateForm()) {
      toast({
        title: "Please Complete All Required Fields",
        description: "Check the form for any missing information.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-booking-payment', {
        body: {
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          timeSlotId: selectedTimeSlot!.id,
          specialRequests: formData.specialRequests,
          bookingType: formData.bookingType,
          guestCount: formData.guestCount,
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to create booking");
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      toast({
        title: "Booking Failed",
        description: `There was an error processing your booking: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMembershipType = (type: string) => {
    switch (type) {
      case '1_session_week': return '1 Session/Week';
      case '2_sessions_week': return '2 Sessions/Week';
      case 'unlimited': return 'Unlimited';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 bg-gallery">
        <section className="py-12 sm:py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-4 sm:mb-6 tracking-tight">
                Book Your Session
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light mb-8">
                Our signature combined session includes both ice bath and sauna for the ultimate contrast therapy experience.
              </p>
            </div>

            {/* Membership Status Banner */}
            {checkingMembership ? (
              <Card className="mb-8 border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="animate-pulse h-4 w-4 rounded-full bg-primary/30"></div>
                  <span className="text-muted-foreground">Checking membership status...</span>
                </CardContent>
              </Card>
            ) : hasBookingForSelectedDate && membershipStatus?.membership ? (
              <Card className="mb-8 border-amber-500 bg-amber-500/5">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Already Booked This Day</h3>
                        <p className="text-sm text-muted-foreground">
                          You have a booking at {membershipStatus.bookingForDate?.session_time?.slice(0, 5)}. 
                          Members can only book one session per day.
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit border-amber-500 text-amber-600">
                      Select Different Date
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Want to bring guests? You can add paying guests to your existing booking, or they can book separately.
                  </p>
                </CardContent>
              </Card>
            ) : canUseMembership && membershipStatus?.membership ? (
              <Card className="mb-8 border-primary bg-primary/5">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Active Membership</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatMembershipType(membershipStatus.membership.type)} • 
                          {membershipStatus.membership.isUnlimited 
                            ? ' Unlimited sessions' 
                            : ` ${membershipStatus.membership.sessionsRemaining} sessions remaining this week`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="w-fit">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Book Free (1 Person Only)
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    <Users className="h-3 w-3 inline mr-1" />
                    Membership covers 1 person per session. Guests can be added as paying guests below.
                  </p>
                </CardContent>
              </Card>
            ) : user && membershipStatus && !membershipStatus.hasMembership ? (
              <Card className="mb-8 border-muted">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">No Active Membership</h3>
                      <p className="text-sm text-muted-foreground">
                        Get unlimited sessions or weekly credits with a membership plan.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/memberships'}
                    >
                      View Memberships
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Service Selection and Time Slots */}
            <div className="mb-8 lg:mb-12">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Select Your Time</h3>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Service Information */}
                <div>
                  <h4 className="text-lg font-medium mb-4">Your Session</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <Card className="wellness-card border-2 border-primary">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-base sm:text-lg font-semibold truncate">Combined Session</h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-lg sm:text-xl font-semibold text-primary">
                                  {canUseMembership ? 'Free' : `£${(pricing.combined / 100).toFixed(0)}`}
                                </span>
                                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                              </div>
                            </div>
                            <p className="text-muted-foreground text-xs sm:text-sm mb-2">Complete thermal therapy experience with both ice bath and sauna for optimal recovery and wellness</p>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm">1 hour</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Time Slot Picker */}
                <div>
                  <h4 className="text-lg font-medium mb-4">Select Your Time</h4>
                  <div>
                    {formErrors.timeSlot && (
                      <p className="text-sm text-destructive flex items-center gap-1 mb-3">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.timeSlot}
                      </p>
                    )}
                    <TimeSlotPicker
                      serviceType="combined"
                      onSlotSelect={handleTimeSlotSelect}
                      selectedSlotId={selectedTimeSlot?.id}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Type Selection */}
            <div className="mb-8 lg:mb-12">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Booking Type</h3>
              <Card className="wellness-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Member-specific notice */}
                    {canUseMembership && (
                      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <Sparkles className="h-4 w-4 inline mr-1 text-primary" />
                          <strong>Membership Booking:</strong> Your membership covers 1 communal session for yourself. 
                          Guests joining you will need to pay the standard rate of £{(pricing.combined / 100).toFixed(0)} per person.
                        </p>
                      </div>
                    )}

                    {/* Booking Type Cards - Only show for non-members */}
                    {!canUseMembership && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            formData.bookingType === "communal" 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:bg-muted/50"
                          }`}
                          onClick={() => handleBookingTypeChange("communal")}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Users className="h-5 w-5" />
                            <h3 className="font-semibold">Communal Session</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Share the hub with others (up to 4 people total)
                          </p>
                          <div className="mt-2">
                            <Badge variant="secondary">
                              £{(pricing.combined / 100).toFixed(0)} per person
                            </Badge>
                          </div>
                        </div>
                        
                        {(() => {
                          const privateDisabled = selectedTimeSlot && availableSpaces < 5;
                          return (
                            <div 
                              className={`p-4 border rounded-lg transition-colors ${
                                privateDisabled 
                                  ? "opacity-50 cursor-not-allowed bg-muted/30 border-border" 
                                  : formData.bookingType === "private" 
                                    ? "border-primary bg-primary/5 cursor-pointer" 
                                    : "border-border hover:bg-muted/50 cursor-pointer"
                              }`}
                              onClick={() => !privateDisabled && handleBookingTypeChange("private")}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <User className="h-5 w-5" />
                                <h3 className="font-semibold">Private Session</h3>
                                {privateDisabled && (
                                  <Badge variant="outline" className="ml-auto text-xs">
                                    Unavailable
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Exclusive use of the entire hub (maximum 7 people)
                              </p>
                              {privateDisabled ? (
                                <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  This slot already has bookings. Select an empty slot (5/5 spaces) for private sessions.
                                </p>
                              ) : (
                                <div className="mt-2">
                                  <Badge variant="secondary">
                                    £{(pricing.private / 100).toFixed(0)} flat rate
                                  </Badge>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Guest Count - Non-members only */}
                    {!canUseMembership && formData.bookingType === "communal" && (
                      <div className="space-y-2">
                        <Label htmlFor="guestCount">Number of People</Label>
                        <Select 
                          value={formData.guestCount.toString()} 
                          onValueChange={handleGuestCountChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: Math.min(availableSpaces, 4) }, (_, i) => i + 1).map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? "person" : "people"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formErrors.guestCount && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {formErrors.guestCount}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {availableSpaces} spaces available for communal bookings
                        </p>
                      </div>
                    )}

                    {/* Paying Guest Count - Members only */}
                    {canUseMembership && (
                      <div className="space-y-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span className="font-medium">Your spot (included with membership)</span>
                          </div>
                          <p className="text-sm text-muted-foreground">1 communal session for yourself</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payingGuestCount" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Add Paying Guests (Optional)
                          </Label>
                          <Select 
                            value={formData.payingGuestCount.toString()} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, payingGuestCount: parseInt(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: Math.min(availableSpaces, 4) }, (_, i) => i).map(num => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num === 0 ? "No additional guests" : `${num} paying guest${num > 1 ? 's' : ''} (£${(pricing.combined / 100) * num})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            {Math.max(0, availableSpaces - 1)} additional spaces available • £{(pricing.combined / 100).toFixed(0)} per guest
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="mb-8 lg:mb-12">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Personal Details</h3>
              <Card className="wellness-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2 sm:space-y-3">
                        <Label htmlFor="customerName" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name *
                        </Label>
                        <Input
                          id="customerName"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className={formErrors.customerName ? "border-destructive" : ""}
                          required
                        />
                        {formErrors.customerName && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {formErrors.customerName}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <Label htmlFor="customerEmail" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </Label>
                        <Input
                          id="customerEmail"
                          name="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          className={formErrors.customerEmail ? "border-destructive" : ""}
                          required
                        />
                        {formErrors.customerEmail && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {formErrors.customerEmail}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <Label htmlFor="customerPhone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="customerPhone"
                        name="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        placeholder="Your phone number"
                      />
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <Textarea
                        id="specialRequests"
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        placeholder="Any special requirements or requests..."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary and Confirmation */}
            <div className="mb-8">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Booking Summary</h3>
              <Card className="wellness-card">
                <CardContent className="p-4 sm:p-6">
                  {selectedTimeSlot ? (
                    <>
                      <div className="space-y-2 text-sm mb-6">
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span className="font-medium">Combined Session (1 hour)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Booking Type:</span>
                          <Badge variant={formData.bookingType === "private" ? "default" : "secondary"}>
                            {formData.bookingType === "private" ? "Private" : "Communal"}
                          </Badge>
                        </div>
                        {formData.bookingType === "communal" && (
                          <div className="flex justify-between">
                            <span>Guests:</span>
                            <span className="font-medium">{formData.guestCount} {formData.guestCount === 1 ? "person" : "people"}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium">
                            {new Date(selectedTimeSlot.date).toLocaleDateString('en-GB', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span className="font-medium">{selectedTimeSlot.time.slice(0, 5)}</span>
                        </div>
                        
                        {canUseMembership ? (
                          <>
                            <div className="flex justify-between text-primary font-medium pt-2 border-t">
                              <span>Payment:</span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-4 w-4" />
                                Membership
                              </span>
                            </div>
                            <div className="flex justify-between font-semibold text-primary">
                              <span>Total:</span>
                              <span>£0 (Free with membership)</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span>
                                {formData.bookingType === 'private' 
                                  ? `£${(pricing.private / 100).toFixed(0)} flat rate` 
                                  : `£${(pricing.combined / 100).toFixed(0)} × ${formData.guestCount} people`}
                              </span>
                            </div>
                            <div className="flex justify-between font-semibold text-primary">
                              <span>Total:</span>
                              <span>£{calculateTotalPrice()}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {canUseMembership ? (
                        <Button 
                          size="lg" 
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                          onClick={handleMemberBooking}
                          disabled={isLoading}
                        >
                          {isLoading ? "Processing..." : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Confirm Booking with Membership
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          size="lg" 
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                          onClick={handleBooking}
                          disabled={isLoading}
                        >
                          {isLoading ? "Processing..." : "Confirm Booking & Pay"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h4 className="text-lg font-medium mb-2">Ready to Book?</h4>
                        <p className="text-muted-foreground text-sm">
                          Choose a time slot to complete your booking
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span>Combined Session (1 hour)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date & Time:</span>
                          <span>Not selected</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price per person:</span>
                          <span>{canUseMembership ? 'Free with membership' : `£${(pricing.combined / 100).toFixed(0)}`}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center bg-muted/30 rounded-lg p-6 sm:p-8">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Need Help Booking?</h3>
              <p className="text-muted-foreground mb-6">
                Contact us directly for assistance with your booking or for group sessions.
              </p>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.location.href = '/contact'}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Booking;
