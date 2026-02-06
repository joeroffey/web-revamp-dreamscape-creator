
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you as soon as possible.",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light">
            Ready to start your wellness journey? Have questions about our services? 
            We're here to help you every step of the way.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-light mb-8">Contact Information</h2>
              
              <div className="space-y-6">
                <Card className="wellness-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-2">Location</h3>
                        <p className="text-muted-foreground">
                          Unit 7, Ensign yard<br />
                          670 Ampress Ln<br />
                          Lymington SO41 8QY
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          Free Parking Available
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="wellness-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-2">Phone</h3>
                        <p className="text-muted-foreground">
                          01590 698 691<br />
                          0754 696 5111
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="wellness-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-2">Email</h3>
                        <p className="text-muted-foreground">
                          info@revitalisehub.co.uk
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="wellness-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Clock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-2">Opening Hours</h3>
                        <div className="space-y-2 text-muted-foreground text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                            <span className="font-medium">Tuesday - Saturday</span>
                            <span>8:30 AM - 8:00 PM</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                            <span className="font-medium">Sunday</span>
                            <span>8:30 AM - 5:30 PM</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                            <span className="font-medium">Monday</span>
                            <span>Closed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="wellness-card">
              <CardHeader>
                <CardTitle className="text-2xl font-light">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your wellness goals or ask any questions..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-muted/30 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-4">Ready to Book Your Session?</h3>
          <p className="text-muted-foreground mb-6">
            Skip the contact form and book your thermal therapy session directly.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/booking'}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
          >
            Book Now
          </Button>
        </div>
      </div>
    </section>
  );
};
