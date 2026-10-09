import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { AboutSection } from "@/components/AboutSection";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ADDRESS, OPENING_HOURS } from "@/lib/site";

const hubFeatures = [
  { label: "Two ice baths", value: "Kept between 3°C and 7°C" },
  { label: "Traditional sauna", value: "Eight-person sauna at 85–90°C" },
  { label: "Red light therapy", value: "Complimentary with every session" },
  { label: "Private changing rooms", value: "Plus on-site bathroom facilities" },
  { label: "One-hour sessions", value: "Communal or private bookings" },
  { label: "Free parking", value: "Available at Ensign Yard" },
];

const About = () => {
  return (
    <div className="rh-site min-h-screen">
      <SEOHead title="About Us – Contrast Therapy in Lymington" description="Learn about Revitalise Hub, Lymington's dedicated cold water and contrast therapy centre. Meet our team and discover our mission." path="/about" />
      <Navigation />

      <main className="rh-main bg-gallery">
        <AboutSection />

        {/* What the hub offers */}
        <section className="py-20 md:py-24 bg-background" aria-labelledby="about-hub-heading">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-5 gap-12 items-start">
              <div className="lg:col-span-2 space-y-5">
                <span className="rh-eyebrow">The hub</span>
                <h2 id="about-hub-heading" className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                  A space built for contrast therapy
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  Everything at Revitalise Hub is designed around one thing: moving comfortably between heat and
                  cold. Each one-hour session gives you the whole circuit — the ice baths, the sauna and the red
                  light therapy room — at a pace that suits you.
                </p>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  Book a communal session and share the hub with a small group, or book it privately for your
                  friends, family or team.{" "}
                  <Link to="/our-hub" className="underline underline-offset-4 hover:text-foreground">
                    Take a look inside the hub
                  </Link>
                  .
                </p>
              </div>
              <ul className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
                {hubFeatures.map((item) => (
                  <li key={item.label} className="rounded-2xl border border-border bg-background/60 p-6">
                    <p className="text-lg font-light text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.value}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Safety and guidance */}
        <section className="py-20 md:py-24 rh-surface" aria-labelledby="about-safety-heading">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span className="rh-eyebrow mb-5">Your first visit</span>
            <h2 id="about-safety-heading" className="text-3xl md:text-4xl font-light tracking-tight text-foreground mb-8">
              Guided, safe and at your own pace
            </h2>
            <div className="space-y-5 text-muted-foreground text-base md:text-lg leading-relaxed text-left md:text-center">
              <p>
                You don&apos;t need any experience to visit. On your first session our team gives you a tour of
                the hub, explains how to use the ice baths and sauna safely, and suggests timings based on your
                experience — there&apos;s never any pressure to push beyond what feels comfortable.
              </p>
              <p>
                Every first-time guest completes a short health questionnaire before their session. Cold water
                immersion and sauna aren&apos;t suitable for everyone: if you have a heart or circulation
                condition, high or low blood pressure, are pregnant, or have any other health concern, please
                speak to your GP before booking.
              </p>
              <p>
                <Link to="/your-visit" className="underline underline-offset-4 hover:text-foreground">
                  Read our first-visit guide
                </Link>{" "}
                for what to bring, how a session flows and simple etiquette in the hub.
              </p>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="py-20 md:py-24 bg-background" aria-labelledby="about-location-heading">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-5">
              <span className="rh-eyebrow">Find us</span>
              <h2 id="about-location-heading" className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                In Lymington, on the edge of the New Forest
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                You&apos;ll find Revitalise Hub at Ensign Yard on Ampress Lane, with free parking available. We
                welcome guests from Lymington, the New Forest and the surrounding area — including Milford on Sea,
                Brockenhurst, New Milton and Christchurch.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/booking"
                  className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Book a session
                </Link>
                <Link
                  to="/contact"
                  className="rounded-full border border-foreground/30 px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                >
                  Contact us
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-8">
              <p className="rh-eyebrow mb-3">Address</p>
              <address className="not-italic text-foreground leading-relaxed">
                Revitalise Hub
                <br />
                {ADDRESS.line1}
                <br />
                {ADDRESS.line2}
                <br />
                {ADDRESS.town} {ADDRESS.postcode}
              </address>
              <p className="rh-eyebrow mt-8 mb-3">Opening hours</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-foreground">
                {OPENING_HOURS.map((row) => (
                  <div key={row.days} className="contents">
                    <dt className="text-muted-foreground">{row.days}</dt>
                    <dd>{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
