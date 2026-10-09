import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { JsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ADDRESS, BUSINESS_ID, SITE_URL, absoluteUrl } from "@/lib/site";
import { splitEventDates, toSchemaDate } from "@/lib/events";
import { optimisedImage } from "@/lib/images";

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
  created_at?: string | null;
  updated_at?: string | null;
}

const Events = () => {
  // Published events (managed in the admin area). Uses react-query so the
  // build-time pre-render can include the events in the page HTML.
  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ["events-published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }
      return (data || []) as Event[];
    },
  });

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

  // Every published event is shown exactly as entered in the admin area. The
  // dates are only parsed (behind the scenes) so that search engines get Event
  // structured data for sessions that are still in the future.
  const now = new Date();
  const scheduled = events.map((event) => ({ event, ...splitEventDates(event, now) }));

  // Event structured data: one entry per future dated session.
  const eventSchema = scheduled.flatMap(({ event, upcoming }) =>
    upcoming
      .filter((d) => d.date)
      .map((d) => ({
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        description: event.short_description || event.subtitle || undefined,
        startDate: toSchemaDate(d.date as Date, event.event_time),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        image: event.image_url ? [absoluteUrl(event.image_url)] : undefined,
        url: `${SITE_URL}/events`,
        location: {
          "@type": "Place",
          name: "Revitalise Hub",
          address: {
            "@type": "PostalAddress",
            streetAddress: `${ADDRESS.line1}, ${ADDRESS.line2}`,
            addressLocality: ADDRESS.town,
            addressRegion: ADDRESS.county,
            postalCode: ADDRESS.postcode,
            addressCountry: "GB",
          },
        },
        organizer: { "@type": "Organization", "@id": BUSINESS_ID, name: "Revitalise Hub", url: SITE_URL },
        performer: event.instructor ? { "@type": "Person", name: event.instructor } : undefined,
      }))
  );

  return (
    <div className="rh-site min-h-screen bg-background">
      <SEOHead
        title="Wellness Events & Workshops in Lymington"
        description="Discover upcoming wellness events at Revitalise Hub, Lymington. Breathwork, yoga, workshops and community gatherings."
        path="/events"
      />
      {eventSchema.length > 0 && <JsonLd data={eventSchema} />}
      <Navigation />

      <main className="rh-main">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <span className="rh-rule mb-8" aria-hidden="true" />
            <h1 className="rh-display text-foreground mb-6">
              Events at Revitalise Hub, Lymington
            </h1>
            <p className="rh-lede max-w-3xl mx-auto">
              Guided experiences combining movement, breath, recovery, and contrast therapy.
            </p>
          </div>
        </section>

        {/* About Our Events */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-light mb-8 tracking-tight">
                About Our Events
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6">
                Our events at Revitalise Hub in Lymington bring together expert-led practices and contrast therapy in a calm, supportive environment.
              </p>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                Each event is thoughtfully structured and may include guided movement, breathwork, or education, followed by sauna and ice bath contrast therapy. Events vary in focus but share the same intention: supporting recovery, nervous system regulation, and overall wellbeing.
              </p>
            </div>
          </div>
        </section>

        {/* Location Banner */}
        <section className="py-6 border-y border-border/60">
          <div className="container mx-auto px-4 text-center">
            <address className="not-italic flex items-start sm:items-center justify-center gap-2 text-muted-foreground text-sm md:text-base">
              <MapPin className="h-4 w-4 mt-1 sm:mt-0 flex-shrink-0" aria-hidden="true" />
              <span>
                Revitalise Hub, {ADDRESS.line1}, {ADDRESS.line2}, {ADDRESS.town} {ADDRESS.postcode}
              </span>
            </address>
          </div>
        </section>

        {/* Upcoming Events Header */}
        <section className="pt-16 md:pt-20 pb-4">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight">
              Upcoming Events
            </h2>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <section className="py-12">
            <div className="container mx-auto px-4 text-center">
              <p className="text-muted-foreground text-lg">No upcoming events at the moment. Check back soon!</p>
            </div>
          </section>
        ) : (
          events.map((event, index) => (
            <section key={event.id} className="py-12 md:py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  {/* Main Event Info (image alternates sides on larger screens) */}
                  <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center mb-12">
                    <div className="space-y-5">
                      <h3 className="text-2xl md:text-3xl font-light tracking-tight">
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
                    <div
                      className={`aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl ${
                        index % 2 === 1 ? "md:order-first" : ""
                      }`}
                    >
                      {event.image_url && (
                        <img
                          src={optimisedImage(event.image_url, 900)}
                          alt={event.title}
                          width={800}
                          height={800}
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                          className="w-full h-full object-cover object-center"
                        />
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  {event.event_dates && event.event_dates.length > 0 && (
                    <div className="bg-muted/30 border border-border/60 rounded-2xl p-6 md:p-8 mb-12">
                      <h4 className="text-xl font-light mb-6 text-center">
                        {event.event_dates.length > 1 ? 'Upcoming Dates' : 'Upcoming Date'}
                      </h4>
                      {event.event_time && (
                        <p className="text-center text-muted-foreground mb-6 flex items-center justify-center gap-2">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          All sessions begin at {event.event_time}
                        </p>
                      )}
                      <ul className="flex flex-wrap justify-center gap-3">
                        {event.event_dates.map((date) => (
                          <li
                            key={date}
                            className="flex items-center gap-2 bg-background rounded-full px-4 py-2 border border-border"
                          >
                            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            <span className="text-sm">{date}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Full Description with Secondary Image */}
                  {event.full_description && (
                    <div className={`grid md:grid-cols-2 gap-12 items-start ${event.secondary_image_url ? '' : 'md:grid-cols-1'}`}>
                      {event.secondary_image_url && (
                        <div className="aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl order-2 md:order-1">
                          <img
                            src={optimisedImage(event.secondary_image_url, 900)}
                            alt={`${event.title} detail`}
                            width={800}
                            height={800}
                            loading="lazy"
                            decoding="async"
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
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl md:text-3xl font-light mb-6 tracking-tight">
              Ready to Join Us?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get in touch to book your place at one of our upcoming events. We'd love to welcome you to the Revitalise Hub community.
            </p>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link to="/contact">Book Your Place</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Events;
