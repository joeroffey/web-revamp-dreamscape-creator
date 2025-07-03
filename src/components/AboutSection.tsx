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
    <section id="about" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About Revitalise Hub
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                Our wellness centre offers a unique experience that combines the benefits of 
                cold-water immersion and heat therapies, creating an experience that promotes 
                health, recovery, and mental clarity.
              </p>
              <p>
                With two premium ice baths and a spacious eight-person sauna, we accommodate 
                up to five clients at a time, ensuring personalized attention and impactful 
                sessions tailored to your wellness goals.
              </p>
              <p>
                Our evidence-based approach to thermal therapy is designed by wellness experts 
                and supported by cutting-edge research, making us the premier destination for 
                serious wellness enthusiasts and athletes alike.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button variant="wellness" size="lg">
                Book Your First Session
              </Button>
              <Button variant="outline" size="lg">
                Download Our App
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card 
                  key={stat.label}
                  className="wellness-card text-center group"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:animate-float">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {stat.number}
                    </div>
                    <div className="font-semibold text-foreground mb-1">
                      {stat.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.description}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Info Card */}
            <Card className="wellness-card mt-6">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Why Choose Revitalise Hub?
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Expert-guided sessions with certified wellness professionals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>State-of-the-art facilities with premium equipment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Flexible scheduling and membership options</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>Comprehensive wellness programs and education</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};