import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook } from "lucide-react";

export const ContactSection = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Location",
      content: "123 Wellness Street\nCity, County, Postcode",
      link: "https://maps.google.com"
    },
    {
      icon: Phone,
      title: "Phone",
      content: "+44 (0) 123 456 7890",
      link: "tel:+441234567890"
    },
    {
      icon: Mail,
      title: "Email",
      content: "hello@revitalisehub.co.uk",
      link: "mailto:hello@revitalisehub.co.uk"
    },
    {
      icon: Clock,
      title: "Opening Hours",
      content: "Mon-Fri: 6:00 AM - 10:00 PM\nSat-Sun: 8:00 AM - 8:00 PM",
      link: null
    }
  ];

  return (
    <section id="contact" className="py-24 bg-wellness-calm/20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Get In Touch
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ready to start your wellness journey? Contact us to book your session 
            or learn more about our services and membership options.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <div className="animate-fade-in">
            <h3 className="text-2xl font-bold text-foreground mb-8">
              Visit Our Wellness Centre
            </h3>
            
            <div className="grid gap-6 mb-8">
              {contactInfo.map((info, index) => (
                <Card key={info.title} className="wellness-card group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                        <info.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">
                          {info.title}
                        </h4>
                        {info.link ? (
                          <a 
                            href={info.link}
                            className="text-muted-foreground hover:text-primary transition-colors whitespace-pre-line"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <p className="text-muted-foreground whitespace-pre-line">
                            {info.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <Button variant="outline" size="icon">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Facebook className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="animate-fade-in">
            <Card className="wellness-card">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Send Us a Message
                </h3>
                
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        First Name
                      </label>
                      <Input 
                        placeholder="Your first name"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Last Name
                      </label>
                      <Input 
                        placeholder="Your last name"
                        className="h-12"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <Input 
                      type="email"
                      placeholder="your.email@example.com"
                      className="h-12"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone (Optional)
                    </label>
                    <Input 
                      type="tel"
                      placeholder="+44 (0) 123 456 7890"
                      className="h-12"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <Textarea 
                      placeholder="Tell us about your wellness goals or any questions you have..."
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    variant="wellness" 
                    size="lg"
                    className="w-full"
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};