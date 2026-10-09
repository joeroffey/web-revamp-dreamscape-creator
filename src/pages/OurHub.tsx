import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Thermometer, Snowflake, Waves, Users, Sun, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LocalBusinessSchema } from "@/components/LocalBusinessSchema";

const OurHub = () => {
  const facilities = [
    {
      title: "Ice Baths",
      description: "Two state-of-the-art cold immersion tanks, kept between 3°C and 7°C, with timers alongside so you can track every dip.",
      icon: Snowflake,
      image: "/images/e66be255-48c0-42a2-92bb-1f189a14976d.webp"
    },
    {
      title: "Traditional Sauna", 
      description: "Our eight-person traditional sauna is heated to 85–90°C — designed for deep heat therapy and complete relaxation.",
      icon: Thermometer,
      image: "/images/8e9e8578-24af-421e-9d1c-3b71d4e13523.webp"
    },
    {
      title: "Recovery Lounge",
      description: "Comfortable relaxation area for post-session recovery with refreshments and amenities.",
      icon: Users,
      image: "/images/0f10c721-e834-4cf4-9182-2bd24811ad45.webp"
    },
    {
      title: "EIRA Therapy Equipment",
      description: "Professional-grade therapy equipment including our signature ice baths for optimal recovery.",
      icon: Waves,
      image: "/images/8dd0056c-d9d2-4732-b060-1c55cf4c241d.webp"
    },
    {
      title: "Red Light Therapy Room",
      description: "Our new red light therapy space — included with every session at no extra cost. Wind down and recover at a cellular level.",
      icon: Sun,
      image: "/images/red-light/room.webp"
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
      <SEOHead title="Our Hub – Ice Baths, Sauna & Red Light Room" description="Inside Revitalise Hub, Lymington: two ice baths (3–7°C), an eight-person sauna (85–90°C), a red light therapy room, private changing rooms and free parking." path="/our-hub" />
      <LocalBusinessSchema />
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
                Inside Our Contrast Therapy Hub in Lymington
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
                    Unit 7, Ensign yard<br />
                    670 Ampress Ln<br />
                    Lymington SO41 8QY
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Free Parking Available
                  </Badge>
                </CardContent>
              </Card>

              <Card className="wellness-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Opening Hours</h3>
                  </div>
                  <div className="space-y-2 text-muted-foreground text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Tue - Sat</span>
                      <span className="whitespace-nowrap">8:30 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Sunday</span>
                      <span className="whitespace-nowrap">8:30 AM - 5:30 PM</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Monday</span>
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
            
            {(() => {
              const renderFacility = (facility: typeof facilities[number], index: number) => (
                <Card key={index} className="wellness-card overflow-hidden">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={facility.image}
                      alt={facility.title}
                      loading="lazy"
                      decoding="async"
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
              );
              const top = facilities.slice(0, 4);
              const rest = facilities.slice(4);
              return (
                <>
                  <div className="grid md:grid-cols-2 gap-8">
                    {top.map(renderFacility)}
                  </div>
                  {rest.length > 0 && (
                    <div className="mt-8 md:w-[calc(50%-1rem)] md:mx-auto">
                      {rest.map((f, i) => renderFacility(f, i + top.length))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>


        {/* Inside the hub — detail for first-time visitors */}
        <section className="py-20 bg-white" aria-labelledby="inside-heading">
          <div className="max-w-5xl mx-auto px-6">
            <h2 id="inside-heading" className="text-2xl md:text-4xl font-light tracking-tight text-center mb-10">
              How a Session at the Hub Works
            </h2>
            <div className="grid gap-10 md:grid-cols-2 text-muted-foreground text-lg font-light leading-relaxed">
              <div className="space-y-5">
                <p>
                  Every session lasts one hour and includes the whole circuit: two ice baths, our eight-person
                  traditional sauna and the red light therapy room. Communal sessions are capped at five guests,
                  so the space never feels crowded, or you can book the hub privately for your own group.
                </p>
                <p>
                  Most guests alternate between the sauna and the ice baths two to four times, spending around
                  5–20 minutes in the heat and 1–3 minutes in the cold, then finish with time under the red light
                  panels. Our team gives every first-timer a tour and clear guidance, so you&apos;ll know exactly
                  what to do.
                </p>
              </div>
              <div className="space-y-5">
                <p>
                  The hub has private changing rooms and on-site bathroom facilities, and towels are available at
                  reception if you forget yours. We keep the space calm, clean and hygienic — shoes stay outside
                  the main hub area.
                </p>
                <p>
                  You&apos;ll find us at Ensign Yard on Ampress Lane in Lymington, with free parking available.
                  Read our{" "}
                  <Link to="/your-visit" className="underline underline-offset-4 hover:text-foreground">
                    first-visit guide
                  </Link>{" "}
                  or{" "}
                  <Link to="/blog/how-long-to-stay-in-an-ice-bath" className="underline underline-offset-4 hover:text-foreground">
                    how long to stay in an ice bath
                  </Link>{" "}
                  before you come.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Internal Links Section */}
        <section className="py-16 bg-gallery">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl md:text-3xl font-light text-center mb-10">
              Explore More
            </h2>
            {(() => {
              const exploreCards = [
                {
                  eyebrow: "First Visit",
                  title: "YOUR FIRST VISIT",
                  description: "What to expect, what to bring, and how your session works.",
                  cta: "READ THE GUIDE",
                  href: "/your-visit",
                },
                {
                  eyebrow: "Save",
                  title: "MEMBERSHIP PLANS",
                  description: "Regular visitor? Save with our flexible monthly membership options.",
                  cta: "VIEW MEMBERSHIPS",
                  href: "/memberships",
                },
                {
                  eyebrow: "What's On",
                  title: "UPCOMING EVENTS",
                  description: "Breathwork, yoga, and guided contrast therapy experiences.",
                  cta: "SEE EVENTS",
                  href: "/events",
                },
              ];
              return (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exploreCards.map((card) => (
                    <Link
                      key={card.title}
                      to={card.href}
                      className="group relative block bg-foreground/5 border border-foreground/15 p-8 transition-all duration-500 hover:bg-foreground/10 hover:border-foreground/25"
                    >
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-foreground/30" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-foreground/30" />
                      <div className="flex flex-col h-full justify-between min-h-[220px]">
                        <div>
                          <span className="text-muted-foreground text-xs tracking-[0.3em] uppercase mb-3 block">
                            {card.eyebrow}
                          </span>
                          <h3 className="text-2xl md:text-3xl font-light text-foreground mb-4 tracking-wide">
                            {card.title}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {card.description}
                          </p>
                        </div>
                        <span className="mt-6 inline-flex items-center gap-3 text-foreground border-b border-foreground/40 pb-1 w-fit group-hover:border-foreground transition-colors duration-300">
                          <span className="text-sm tracking-wider">{card.cta}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-light mb-6">
              Ready to Experience Our Hub?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Book your first session today and discover the transformative power of contrast therapy in our premium facility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/booking"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-full font-medium transition-colors"
              >
                Book a Session
              </Link>
              <Link 
                to="/contact"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-3 rounded-full font-medium transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default OurHub;
