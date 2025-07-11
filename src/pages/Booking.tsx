import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { Calendar, Clock, Snowflake, Flame, User, Mail, Phone, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Booking = () => {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    id: string;
    date: string;
    time: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    specialRequests: "",
  });

  const services = [
    {
      id: "ice_bath",
      icon: Snowflake,
      name: "Ice Bath Session",
      duration: "20 minutes",
      price: "£30",
      description: "Cold water immersion therapy for recovery and mental clarity"
    },
    {
      id: "sauna",
      icon: Flame,
      name: "Sauna Session",
      duration: "30 minutes",
      price: "£25",
      description: "Heat therapy session in our spacious 8-person sauna"
    },
    {
      id: "combined",
      icon: Calendar,
      name: "Combined Session",
      duration: "50 minutes",
      price: "£45",
      description: "Full thermal therapy experience with both ice bath and sauna"
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
    
    if (!selectedService) {
      errors.service = "Please select a service";
    }
    
    if (!selectedTimeSlot) {
      errors.timeSlot = "Please select a time slot";
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

  const handleTimeSlotSelect = (slotId: string, date: string, time: string) => {
    setSelectedTimeSlot({ id: slotId, date, time });
    
    // Clear time slot error
    if (formErrors.timeSlot) {
      setFormErrors({
        ...formErrors,
        timeSlot: ""
      });
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setSelectedTimeSlot(null); // Reset time slot when changing service
    
    // Clear service error
    if (formErrors.service) {
      setFormErrors({
        ...formErrors,
        service: ""
      });
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
        }
      });

      if (error) {
        throw new Error(error.message || "Failed to create booking");
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url; // Use location.href instead of window.open for better mobile support
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

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20 sm:pt-24 md:pt-28 lg:pt-32">
        <section className="py-12 sm:py-16 md:py-24 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-4 sm:mb-6 tracking-tight">
                Book Your Session
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light mb-8">
                Choose from our range of thermal therapy services designed to enhance your wellbeing.
              </p>
              
              {/* Hero Image */}
              <div className="mb-12 md:mb-16">
                <img 
                  src="/lovable-uploads/200afcba-40b0-4441-8d09-d864997a01e9.png" 
                  alt="Thermal therapy wellness center" 
                  className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Service Selection and Time Slots */}
            <div className="mb-8 lg:mb-12">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Select Your Service & Time</h3>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Service Selection */}
                <div>
                  <h4 className="text-lg font-medium mb-4">Choose Your Service</h4>
                  <div className="space-y-3 sm:space-y-4">
                    {formErrors.service && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {formErrors.service}
                      </p>
                    )}
                    {services.map((service) => (
                      <Card 
                        key={service.id} 
                        className={`wellness-card cursor-pointer transition-all ${
                          selectedService === service.id ? 'ring-2 ring-primary' : ''
                        } ${formErrors.service ? 'border-destructive/50' : ''}`}
                        onClick={() => handleServiceSelect(service.id)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <service.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-base sm:text-lg font-semibold truncate">{service.name}</h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-lg sm:text-xl font-semibold text-primary">{service.price}</span>
                                  {selectedService === service.id && (
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                  )}
                                </div>
                              </div>
                              <p className="text-muted-foreground text-xs sm:text-sm mb-2">{service.description}</p>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">{service.duration}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Time Slot Picker */}
                <div>
                  <h4 className="text-lg font-medium mb-4">Select Your Time</h4>
                  {selectedService ? (
                    <div>
                      {formErrors.timeSlot && (
                        <p className="text-sm text-destructive flex items-center gap-1 mb-3">
                          <AlertCircle className="h-3 w-3" />
                          {formErrors.timeSlot}
                        </p>
                      )}
                      <TimeSlotPicker
                        serviceType={selectedService}
                        onSlotSelect={handleTimeSlotSelect}
                        selectedSlotId={selectedTimeSlot?.id}
                      />
                    </div>
                  ) : (
                    <Card className="wellness-card">
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">Please select a service first to view available time slots</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="mb-8 lg:mb-12">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Booking Details</h3>
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

            {/* Booking Summary and Confirmation - Always Visible */}
            <div className="mb-8">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Booking Summary</h3>
              <Card className="wellness-card">
                <CardContent className="p-4 sm:p-6">
                  {selectedService && selectedTimeSlot ? (
                    <>
                      <div className="space-y-2 text-sm mb-6">
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span className="font-medium">
                            {services.find(s => s.id === selectedService)?.name}
                          </span>
                        </div>
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
                        <div className="flex justify-between font-semibold text-primary">
                          <span>Total:</span>
                          <span>{services.find(s => s.id === selectedService)?.price}</span>
                        </div>
                      </div>
                      <Button 
                        size="lg" 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                        onClick={handleBooking}
                        disabled={isLoading}
                      >
                        {isLoading ? "Processing..." : "Confirm Booking & Pay"}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h4 className="text-lg font-medium mb-2">Ready to Book?</h4>
                        <p className="text-muted-foreground text-sm">
                          {!selectedService 
                            ? "Select a service and time slot to see your booking summary"
                            : "Choose a time slot to complete your booking"
                          }
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <span>{selectedService ? services.find(s => s.id === selectedService)?.name : "Not selected"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date & Time:</span>
                          <span>Not selected</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{selectedService ? services.find(s => s.id === selectedService)?.price : "—"}</span>
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