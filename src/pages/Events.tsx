import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const Events = () => {
  const upcomingEvents = [
    {
      id: 1,
      title: "Morning Ice Bath Workshop",
      description: "Learn the fundamentals of cold exposure therapy with our expert instructors. Perfect for beginners looking to start their cold therapy journey.",
      date: "Coming Soon",
      time: "8:00 AM - 10:00 AM",
      location: "Revitalise Hub",
      spots: 12,
      category: "Workshop",
    },
    {
      id: 2,
      title: "Breathwork & Recovery Session",
      description: "Combine breathwork techniques with our recovery facilities for an immersive wellness experience.",
      date: "Coming Soon",
      time: "6:00 PM - 8:00 PM",
      location: "Revitalise Hub",
      spots: 8,
      category: "Session",
    },
    {
      id: 3,
      title: "Member Social Evening",
      description: "Connect with fellow wellness enthusiasts at our monthly member social. Light refreshments provided.",
      date: "Coming Soon",
      time: "7:00 PM - 9:00 PM",
      location: "Revitalise Hub",
      spots: 20,
      category: "Social",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-wide">
              Events & Workshops
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our community events, workshops, and gatherings designed to enhance your wellness journey.
            </p>
          </div>
        </section>

        {/* Events List */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{event.category}</Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        {event.spots} spots
                      </div>
                    </div>
                    <CardTitle className="text-xl font-medium">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm">{event.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event.date}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                    </div>

                    <Button className="w-full" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Newsletter CTA */}
            <div className="mt-16 text-center">
              <Card className="max-w-2xl mx-auto p-8">
                <h3 className="text-2xl font-light mb-4">Stay Updated</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to know about upcoming events and workshops. Follow us on social media or check back regularly for updates.
                </p>
                <Button variant="default">Contact Us</Button>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Events;
