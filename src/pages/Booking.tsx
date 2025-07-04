import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Snowflake, Flame, User, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Booking = () => {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    sessionDate: "",
    sessionTime: "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBooking = async (serviceId: string) => {
    if (!formData.customerName || !formData.customerEmail || !formData.sessionDate || !formData.sessionTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before booking.",
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
          serviceType: serviceId,
          sessionDate: formData.sessionDate,
          sessionTime: formData.sessionTime,
          specialRequests: formData.specialRequests,
        }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-24 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
                Book Your Session
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                Choose from our range of thermal therapy services designed to enhance your wellbeing.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Booking Form */}
              <div>
                <h3 className="text-2xl font-semibold mb-6">Booking Details</h3>
                <Card className="wellness-card">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
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
                            required
                          />
                        </div>
                        <div>
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
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
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

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sessionDate">Session Date *</Label>
                          <Input
                            id="sessionDate"
                            name="sessionDate"
                            type="date"
                            value={formData.sessionDate}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="sessionTime">Session Time *</Label>
                          <Input
                            id="sessionTime"
                            name="sessionTime"
                            type="time"
                            value={formData.sessionTime}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div>
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

              {/* Service Selection */}
              <div>
                <h3 className="text-2xl font-semibold mb-6">Select Your Service</h3>
                <div className="space-y-4">
                  {services.map((service) => (
                    <Card 
                      key={service.id} 
                      className={`wellness-card cursor-pointer transition-all ${
                        selectedService === service.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <service.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-semibold">{service.name}</h4>
                              <span className="text-xl font-semibold text-primary">{service.price}</span>
                            </div>
                            <p className="text-muted-foreground text-sm mb-2">{service.description}</p>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{service.duration}</span>
                            </div>
                          </div>
                        </div>
                        {selectedService === service.id && (
                          <Button 
                            size="lg" 
                            className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                            onClick={() => handleBooking(service.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? "Processing..." : `Book ${service.name}`}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center bg-muted/30 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Need Help Booking?</h3>
              <p className="text-muted-foreground mb-6">
                Contact us directly for assistance with your booking or for group sessions.
              </p>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.open('https://revitalisehub.co.uk/contact', '_blank')}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Booking;