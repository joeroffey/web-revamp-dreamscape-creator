import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Snowflake, Flame } from "lucide-react";

const Booking = () => {
  const services = [
    {
      icon: Snowflake,
      name: "Ice Bath Session",
      duration: "20 minutes",
      price: "£30",
      description: "Cold water immersion therapy for recovery and mental clarity"
    },
    {
      icon: Flame,
      name: "Sauna Session",
      duration: "30 minutes",
      price: "£25",
      description: "Heat therapy session in our spacious 8-person sauna"
    },
    {
      icon: Calendar,
      name: "Combined Session",
      duration: "50 minutes",
      price: "£45",
      description: "Full thermal therapy experience with both ice bath and sauna"
    }
  ];

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

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {services.map((service, index) => (
                <Card key={service.name} className="wellness-card">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <service.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-semibold">{service.name}</CardTitle>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{service.duration}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">{service.description}</p>
                    <p className="text-2xl font-semibold text-primary">{service.price}</p>
                    <Button 
                      size="lg" 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                      onClick={() => alert("Booking system requires Supabase integration")}
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
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