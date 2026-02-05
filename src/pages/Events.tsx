import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  subtitle: string | null;
  instructor: string | null;
  short_description: string | null;
  full_description: string | null;
  image_url: string | null;
  secondary_image_url: string | null;
  event_dates: string[] | null;
  event_time: string | null;
  display_order: number;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Parse markdown-like bold text
  const parseDescription = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="block text-lg font-light mt-6 mb-2 text-foreground">{part}</strong>;
      }
      return part.split('\n\n').map((paragraph, pIndex) => (
        <p key={`${index}-${pIndex}`} className="text-muted-foreground leading-relaxed mb-4">
          {paragraph}
        </p>
      ));
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-wide">
              Events at Revitalise Hub | Lymington
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Guided experiences combining movement, breath, recovery, and contrast therapy.
            </p>
          </div>
        </section>

        {/* About Our Events */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-light mb-8 tracking-wide">
                About Our Events
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Our events at Revitalise Hub in Lymington bring together expert-led practices and contrast therapy in a calm, supportive environment.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Each event is thoughtfully structured and may include guided movement, breathwork, or education, followed by sauna and ice bath contrast therapy. Events vary in focus but share the same intention: supporting recovery, nervous system regulation, and overall wellbeing.
              </p>
            </div>
          </div>
        </section>

        {/* Location Banner */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">Revitalise Hub, 7 Ensign Yard, 670 Ampress Ln, Lymington SO41 8QY</span>
            </div>
          </div>
        </section>

        {/* Upcoming Events Header */}
        <section className="pt-16 pb-8">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-light tracking-wide">
              Upcoming Events
            </h2>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <section className="py-16">
            <div className="container mx-auto px-4 text-center">
              <p className="text-muted-foreground text-lg">No upcoming events at the moment. Check back soon!</p>
            </div>
          </section>
        ) : (
          events.map((event, index) => (
            <section key={event.id} className="py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  {/* Main Event Info */}
                  <div className={`grid md:grid-cols-2 gap-12 items-center mb-12 ${index % 2 === 1 ? '' : ''}`}>
                    {index % 2 === 0 ? (
                      <>
                        <div className="space-y-6">
                          <h3 className="text-2xl md:text-3xl font-light tracking-wide">
                            {event.title}
                          </h3>
                          {event.instructor && (
                            <p className="text-lg text-muted-foreground italic">With {event.instructor}</p>
                          )}
                          {event.subtitle && (
                            <p className="text-xl font-light text-foreground">
                              {event.subtitle}
                            </p>
                          )}
                          {event.short_description && (
                            <p className="text-muted-foreground leading-relaxed">
                              {event.short_description}
                            </p>
                          )}
                        </div>
                        <div className="aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl">
                          {event.image_url && (
                            <img 
                              src={event.image_url} 
                              alt={event.title}
                              className="w-full h-full object-cover object-center"
                            />
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl">
                          {event.image_url && (
                            <img 
                              src={event.image_url} 
                              alt={event.title}
                              className="w-full h-full object-cover object-center"
                            />
                          )}
                        </div>
                        <div className="space-y-6">
                          <h3 className="text-2xl md:text-3xl font-light tracking-wide">
                            {event.title}
                          </h3>
                          {event.instructor && (
                            <p className="text-lg text-muted-foreground italic">With {event.instructor}</p>
                          )}
                          {event.subtitle && (
                            <p className="text-xl font-light text-foreground">
                              {event.subtitle}
                            </p>
                          )}
                          {event.short_description && (
                            <p className="text-muted-foreground leading-relaxed">
                              {event.short_description}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Dates */}
                  {event.event_dates && event.event_dates.length > 0 && (
                    <div className="bg-muted/30 rounded-2xl p-8 mb-12">
                      <h4 className="text-xl font-light mb-6 text-center">
                        {event.event_dates.length > 1 ? 'Upcoming Dates' : 'Upcoming Date'}
                      </h4>
                      {event.event_time && (
                        <p className="text-center text-muted-foreground mb-6 flex items-center justify-center gap-2">
                          <Clock className="h-4 w-4" />
                          All sessions begin at {event.event_time}
                        </p>
                      )}
                      <div className="flex flex-wrap justify-center gap-4">
                        {event.event_dates.map((date) => (
                          <div 
                            key={date}
                            className="flex items-center gap-2 bg-background rounded-full px-4 py-2 border border-border"
                          >
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-light">{date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Description with Secondary Image */}
                  {event.full_description && (
                    <div className={`grid md:grid-cols-2 gap-12 items-start ${event.secondary_image_url ? '' : 'md:grid-cols-1'}`}>
                      {event.secondary_image_url && (
                        <div className="aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl order-2 md:order-1">
                          <img 
                            src={event.secondary_image_url} 
                            alt={`${event.title} detail`}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      )}
                      <div className={`space-y-4 ${event.secondary_image_url ? 'order-1 md:order-2' : 'max-w-3xl mx-auto'}`}>
                        {parseDescription(event.full_description)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider between events */}
              {index < events.length - 1 && (
                <div className="container mx-auto px-4 mt-16">
                  <div className="max-w-4xl mx-auto border-t border-border" />
                </div>
              )}
            </section>
          ))
        )}

        {/* Booking CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl md:text-3xl font-light mb-6 tracking-wide">
              Ready to Join Us?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get in touch to book your place at one of our upcoming events. We'd love to welcome you to the Revitalise Hub community.
            </p>
            <Link to="/contact">
              <Button size="lg" className="rounded-full px-8">
                Book Your Place
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Events;
