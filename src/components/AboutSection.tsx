import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Users, MapPin, Clock } from "lucide-react";

export const AboutSection = () => {
  const stats = [
    {
      icon: Users,
      number: "5",
      label: "Clients per Session",
      description: "Personalized attention"
    },
    {
      icon: Clock,
      number: "2",
      label: "Ice Bath Stations",
      description: "Premium facilities"
    },
    {
      icon: Award,
      number: "8",
      label: "Person Sauna",
      description: "Spacious comfort"
    },
    {
      icon: MapPin,
      number: "1",
      label: "Premium Location",
      description: "Easy accessibility"
    }
  ];

  return (
    <section className="py-24 bg-gallery">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-light text-foreground mb-8 tracking-tight">
            About us
          </h2>
          
          <div className="space-y-8 text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
            <p>
              The wellness centre offers a unique experience that combines the benefits of 
              cold-water immersion and heat therapies, creating an experience that promotes 
              health, recovery, and mental clarity.
            </p>
            
            <p>
              Our facility features two ice baths and an eight-person sauna, allowing us to 
              accommodate up to five clients at a time for personalised and impactful sessions.
            </p>
          </div>
          
          <div className="mt-12">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 text-lg font-medium rounded-full"
              onClick={() => window.open('https://revitalisehub.co.uk/contact', '_blank')}
            >
              Book A Session
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};