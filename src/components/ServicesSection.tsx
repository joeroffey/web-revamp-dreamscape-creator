import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Snowflake, Flame, Users, Clock, Thermometer, Heart } from "lucide-react";

export const ServicesSection = () => {
  const services = [
    {
      icon: Snowflake,
      title: "Ice Bath Therapy",
      description: "Experience the invigorating power of cold-water immersion. Our premium ice baths are maintained at optimal temperatures for maximum benefits.",
      benefits: ["Reduces inflammation", "Boosts metabolism", "Enhances recovery", "Improves mental clarity"],
      duration: "10-15 minutes",
      capacity: "2 ice baths",
      variant: "ice" as const,
      gradient: "gradient-ice"
    },
    {
      icon: Flame,
      title: "Sauna Sessions",
      description: "Relax and detoxify in our spacious 8-person sauna. Traditional heat therapy for deep relaxation and wellness.",
      benefits: ["Deep detoxification", "Muscle relaxation", "Stress relief", "Improved circulation"],
      duration: "15-20 minutes",
      capacity: "Up to 8 people",
      variant: "heat" as const,
      gradient: "gradient-heat"
    },
    {
      icon: Users,
      title: "Contrast Therapy",
      description: "Combine the benefits of both hot and cold therapy in our signature contrast sessions for ultimate wellness.",
      benefits: ["Enhanced recovery", "Optimal circulation", "Balanced nervous system", "Peak performance"],
      duration: "30-45 minutes",
      capacity: "Up to 5 clients",
      variant: "wellness" as const,
      gradient: "gradient-primary"
    }
  ];

  return (
    <section id="services" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Our Wellness Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover our range of thermal therapy treatments designed to optimize your health, 
            enhance recovery, and promote mental clarity.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <Card 
              key={service.title} 
              className="wellness-card group overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-8">
                {/* Icon & Title */}
                <div className="mb-6">
                  <div className={`w-16 h-16 rounded-2xl ${service.gradient} flex items-center justify-center mb-4 group-hover:animate-float`}>
                    <service.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Session Info */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{service.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{service.capacity}</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    Key Benefits
                  </h4>
                  <ul className="space-y-2">
                    {service.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Button 
                  variant={service.variant}
                  className="w-full"
                >
                  Book {service.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-card wellness-card p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Experience Wellness?
            </h3>
            <p className="text-muted-foreground mb-6">
              Book your personalised session today and start your journey to better health, 
              faster recovery, and enhanced mental clarity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="wellness" size="lg">
                Book a Session Now
              </Button>
              <Button variant="outline" size="lg">
                Learn About Memberships
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};