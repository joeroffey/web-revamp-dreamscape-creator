import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Thermometer, Snowflake, Waves, Users } from "lucide-react";

const OurHub = () => {
  const facilities = [
    {
      title: "Ice Bath Chambers",
      description: "State-of-the-art cold immersion tanks maintained at optimal temperatures for maximum therapeutic benefit.",
      icon: Snowflake,
      image: "/lovable-uploads/029c3081-4504-4d35-b1af-8c8ec751d983.png"
    },
    {
      title: "Infrared Saunas",
      description: "Premium infrared sauna pods designed for deep heat therapy and complete relaxation.",
      icon: Thermometer,
      image: "/lovable-uploads/0c9e8b9e-c7cf-48f4-b85b-860370fe6702.png"
    },
    {
      title: "Recovery Lounge",
      description: "Comfortable relaxation area for post-session recovery with refreshments and amenities.",
      icon: Users,
      image: "/lovable-uploads/103c68d2-52d4-4bb6-b77a-2938942d6c71.png"
    },
    {
      title: "Changing Facilities",
      description: "Clean, modern changing rooms with lockers, towels, and all necessary amenities.",
      icon: Users,
      image: "/lovable-uploads/25076f47-c2aa-4331-9cda-ba7cb683f9d4.png"
    }
  ];

  const features = [
    "Professional-grade equipment",
    "Hygienic and sanitized environment",
    "Climate-controlled facility",
    "Expert staff supervision",
    "Premium amenities included",
    "Convenient location"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Waves className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
                Our Wellness Hub
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light">
                Step into our state-of-the-art facility designed for optimal contrast therapy experiences. 
                Every detail has been carefully crafted to enhance your wellness journey.
              </p>
            </div>

            {/* Location & Hours */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card className="wellness-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Location</h3>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    Unit 4, Everton Nurseries<br />
                    Hordle Lane, Hordle<br />
                    Lymington, SO41 0FL
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Easy Parking Available
                  </Badge>
                </CardContent>
              </Card>

              <Card className="wellness-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Opening Hours</h3>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Facilities Gallery */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-light text-center mb-12">
              Our Premium Facilities
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {facilities.map((facility, index) => (
                <Card key={index} className="wellness-card overflow-hidden">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img 
                      src={facility.image} 
                      alt={facility.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <facility.icon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{facility.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{facility.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-light text-center mb-12">
              What Makes Us Special
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-light mb-6">
              Ready to Experience Our Hub?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Book your first session today and discover the transformative power of contrast therapy in our premium facility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/booking"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-full font-medium transition-colors"
              >
                Book a Session
              </a>
              <a 
                href="/contact"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium transition-colors"
              >
                Get in Touch
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OurHub;