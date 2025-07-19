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
      content: "Unit 7, Ensign yard\n670 Ampress Ln\nLymington SO41 8QY",
      link: "https://www.google.co.uk/maps/search/Unit+7,+Ensign+yard,+670+Ampress+Ln,+Lymington+SO41+8QY"
    },
    {
      icon: Phone,
      title: "Phone",
      content: "01590 698 691\n07546965111",
      link: "tel:01590698691"
    },
    {
      icon: Mail,
      title: "Email",
      content: "info@revitalisehub.co.uk",
      link: "mailto:info@revitalisehub.co.uk"
    },
    {
      icon: Clock,
      title: "Opening Hours",
      content: "Tue-Sat: 8am to 8pm\nSun: 8am to 5pm\nMon: Closed",
      link: null
    }
  ];

  return (
    <section className="py-24 bg-gallery">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
            Contact Us
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            If you have any questions or would like to learn more about our services, 
            feel free to reach out to us.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {contactInfo.map((info, index) => (
            <Card key={info.title} className="wellness-card">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <info.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{info.title}</h3>
                {info.link ? (
                  <a 
                    href={info.link}
                    className="text-muted-foreground hover:text-primary transition-colors whitespace-pre-line leading-relaxed"
                  >
                    {info.content}
                  </a>
                ) : (
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {info.content}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="space-y-6">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 text-lg font-medium rounded-full"
              onClick={() => window.open('https://revitalisehub.co.uk/contact', '_blank')}
            >
              Book A Session
            </Button>
            
            <div className="pt-6">
              <p className="text-muted-foreground mb-4">Follow Us</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Instagram className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};