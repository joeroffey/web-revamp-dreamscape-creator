import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Activity,
  Zap,
  Heart,
  Sparkles,
  Flame,
  Snowflake,
  Sun,
  ShieldCheck,
  Eye,
  Timer,
  CheckCircle2,
} from "lucide-react";

const benefits = [
  {
    icon: Activity,
    title: "Recovery & Performance",
    points: [
      "Supports muscle recovery",
      "Helps reduce soreness and fatigue",
      "Enhances circulation",
    ],
  },
  {
    icon: Zap,
    title: "Energy & Cellular Function",
    points: [
      "Boosts natural energy production",
      "Supports cellular repair processes",
      "Helps the body recover more efficiently",
    ],
  },
  {
    icon: Heart,
    title: "Wellbeing",
    points: [
      "Promotes relaxation",
      "Supports stress reduction",
      "Complements your recovery routine",
    ],
  },
  {
    icon: Sparkles,
    title: "Skin & Health",
    points: [
      "Supports healthy skin",
      "May improve skin tone and texture",
      "Encourages natural rejuvenation",
    ],
  },
];

const guidelines = [
  {
    icon: Eye,
    title: "Before Use",
    items: [
      "Do not look directly at the lights when turning the device on",
      "Always wear the protective goggles provided",
      "Ensure skin is clean and free from lotions or oils",
    ],
  },
  {
    icon: Timer,
    title: "During Your Session",
    items: [
      "Recommended exposure time: 10–15 minutes",
      "Relax and remain still for optimal results",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Safety",
    items: [
      "Avoid direct eye exposure at all times",
      "Discontinue use if you experience discomfort",
      "Consult a professional if you have any medical concerns",
    ],
  },
  {
    icon: CheckCircle2,
    title: "After Use",
    items: [
      "Switch off the device after your session",
      "Wipe down the area if required",
      "Allow others to enjoy the space respectfully",
    ],
  },
];

const RedLightTherapy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Red Light Therapy"
        description="Red light therapy at Revitalise Hub in Lymington — included with every session at no extra cost. Support recovery, energy, skin and wellbeing."
        path="/red-light-therapy"
      />
      <Navigation />

      <main className="pt-20">
        {/* Hero */}
        <section className="relative">
          <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
            <img
              src="/images/red-light/panel.jpg"
              alt="Red light therapy panel glowing inside the Revitalise Hub recovery room"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/90" />
            <div className="relative z-10 max-w-5xl mx-auto px-6 h-full flex flex-col items-center justify-end pb-16 text-center">
              <Badge className="mb-4 bg-primary/90 text-primary-foreground">
                Now at Revitalise Hub
              </Badge>
              <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground mb-4">
                Red Light Therapy
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-light">
                Included with every session at no extra cost — no separate booking required.
              </p>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Sun className="h-10 w-10 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-light mb-6">
              Light that works at a cellular level
            </h2>
            <p className="text-lg text-muted-foreground font-light leading-relaxed mb-4">
              Red light therapy uses specific wavelengths of light to penetrate the skin and
              support your body at a cellular level. This process helps stimulate energy
              production within your cells, promoting faster recovery, improved skin health,
              and reduced inflammation.
            </p>
            <p className="text-lg text-muted-foreground font-light leading-relaxed">
              Regular use can support muscle recovery, enhance collagen production and
              contribute to overall wellbeing — making it the perfect addition to your
              contrast therapy routine.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-gallery">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light mb-4">The Benefits</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-light">
                A gentle, non-invasive therapy that complements heat and cold exposure.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((b) => (
                <Card key={b.title} className="wellness-card h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <b.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{b.title}</h3>
                    <ul className="space-y-2">
                      {b.points.map((p) => (
                        <li key={p} className="text-sm text-muted-foreground flex gap-2">
                          <span className="w-1.5 h-1.5 mt-2 rounded-full bg-primary shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/images/red-light/session.jpg"
                alt="Guest enjoying a red light therapy session at Revitalise Hub"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-light mb-6">How it works</h2>
              <p className="text-muted-foreground font-light leading-relaxed mb-4">
                Red light therapy stimulates your cells through a process known as
                <em> photobiomodulation</em>.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  Increases cellular energy (ATP production)
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  Improves circulation
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  Supports tissue repair and recovery
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Recovery Protocol */}
        <section className="py-20 bg-gallery">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              The Revitalise Hub Recovery Protocol
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-12 font-light">
              For best results, use red light therapy after sauna and cold exposure as part of
              your recovery routine.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Flame, title: "Sauna", desc: "Open up, sweat it out and relax." },
                { icon: Snowflake, title: "Ice Bath", desc: "Cold exposure to reset and energise." },
                { icon: Sun, title: "Red Light", desc: "Wind down and recover at a cellular level." },
              ].map((s, i) => (
                <Card key={s.title} className="wellness-card">
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <s.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                      Step {i + 1}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Guidelines */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light mb-4">Guidelines</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-light">
                A few simple steps to ensure a safe and effective session.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {guidelines.map((g) => (
                <Card key={g.title} className="wellness-card h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <g.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{g.title}</h3>
                    <ul className="space-y-2">
                      {g.items.map((it) => (
                        <li key={it} className="text-sm text-muted-foreground flex gap-2">
                          <span className="w-1.5 h-1.5 mt-2 rounded-full bg-primary shrink-0" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Included CTA */}
        <section className="py-20 bg-gallery">
          <div className="max-w-4xl mx-auto px-6">
            <Card className="wellness-card overflow-hidden">
              <CardContent className="p-10 md:p-14 text-center">
                <Badge className="mb-4 bg-primary/90 text-primary-foreground">
                  Complimentary
                </Badge>
                <h2 className="text-3xl md:text-4xl font-light mb-4">
                  Included with every visit
                </h2>
                <p className="text-muted-foreground font-light max-w-2xl mx-auto mb-8">
                  No booking, no extra charge. Red Light Therapy is available to all guests
                  during their session — simply step in and enjoy as part of your contrast
                  therapy experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild size="lg">
                    <Link to="/booking">Book a Session</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/our-hub">Explore Our Hub</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RedLightTherapy;
