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
      image: "/lovable-uploads/e66be255-48c0-42a2-92bb-1f189a14976d.png"
    },
    {
      title: "Infrared Saunas",
      description: "Premium infrared sauna pods designed for deep heat therapy and complete relaxation.",
      icon: Thermometer,
      image: "/lovable-uploads/8e9e8578-24af-421e-9d1c-3b71d4e13523.png"
    },
    {
      title: "Recovery Lounge",
      description: "Comfortable relaxation area for post-session recovery with refreshments and amenities.",
      icon: Users,
      image: "/lovable-uploads/0f10c721-e834-4cf4-9182-2bd24811ad45.png"
    },
    {
      title: "FIRA Therapy Equipment",
      description: "Professional-grade therapy equipment including our signature ice baths for optimal recovery.",
      icon: Waves,
      image: "/lovable-uploads/8dd0056c-d9d2-4732-b060-1c55cf4c241d.png"
    }
  ];

  const hubPhotos = [
    {
      image: "/lovable-uploads/a1951f84-7cc0-4290-9dac-77ef88835423.png",
      title: "Exterior Seating Area",
      description: "Relaxing outdoor space with comfortable seating for pre and post-session relaxation."
    },
    {
      image: "/lovable-uploads/a0772681-f82b-42df-9102-6fb502dc820a.png",
      title: "Facility Entrance",
      description: "Our welcoming entrance with clear signage for contrast therapy services."
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
        <section className="py-24 bg-white">
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
        <section className="py-16 bg-gallery">
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

        {/* Hub Photo Gallery */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-light text-center mb-12">
              Inside Our Wellness Hub
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {hubPhotos.map((photo, index) => (
                <Card key={index} className="wellness-card overflow-hidden">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img 
                      src={photo.image} 
                      alt={photo.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{photo.title}</h3>
                    <p className="text-muted-foreground">{photo.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gallery">
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