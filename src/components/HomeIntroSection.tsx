import { Link } from "react-router-dom";
import { Clock, Snowflake, Sun, Thermometer } from "lucide-react";

const facts = [
  { icon: Clock, label: "Session length", value: "1 hour" },
  { icon: Snowflake, label: "Two ice baths", value: "3–7°C" },
  { icon: Thermometer, label: "8-person sauna", value: "85–90°C" },
  { icon: Sun, label: "Red light therapy", value: "Included" },
];

export const HomeIntroSection = () => {
  return (
    <section className="py-24 bg-background" aria-labelledby="intro-heading">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-3 space-y-6">
            <span className="text-muted-foreground text-xs tracking-[0.3em] uppercase block">
              Lymington · Hampshire
            </span>
            <h2
              id="intro-heading"
              className="text-3xl md:text-5xl font-light text-foreground tracking-tight leading-tight"
            >
              Ice baths, sauna &amp; red light therapy in Lymington
            </h2>
            <div className="space-y-5 text-muted-foreground text-base md:text-lg leading-relaxed font-light">
              <p>
                Revitalise Hub is a dedicated contrast therapy space at Ensign Yard on Ampress Lane in
                Lymington. Every one-hour session gives you two ice baths, kept between 3°C and 7°C, and an
                eight-person traditional sauna heated to 85–90°C, so you can move between hot and cold at a
                pace that suits you. Complimentary{" "}
                <Link to="/red-light-therapy" className="underline underline-offset-4 hover:text-foreground">
                  red light therapy
                </Link>{" "}
                is included with every visit.
              </p>
              <p>
                Whether you&apos;re recovering from training, winding down after a busy week or simply want to
                feel more awake, contrast therapy is a simple and sociable way to reset. First-timers are guided
                through everything by our team — how long to stay in the ice bath, how many rounds to do and how
                to breathe through the cold — with no pressure to push beyond what feels comfortable.{" "}
                <Link to="/your-visit" className="underline underline-offset-4 hover:text-foreground">
                  Here&apos;s what to expect on your first visit
                </Link>
                .
              </p>
              <p>
                Book a communal session and share the hub with up to five guests, or book it privately for your
                friends, family or team. Regulars can save with a{" "}
                <Link to="/memberships" className="underline underline-offset-4 hover:text-foreground">
                  monthly membership
                </Link>
                , and{" "}
                <Link to="/gift-cards" className="underline underline-offset-4 hover:text-foreground">
                  gift cards
                </Link>{" "}
                make a thoughtful present for anyone who loves to feel good.
              </p>
              <p>
                We welcome guests from Lymington, the New Forest and the surrounding area — including Milford on
                Sea, Brockenhurst, New Milton and Christchurch — with free parking available.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4 lg:mt-14">
            {facts.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="relative bg-foreground/5 border border-foreground/15 p-6 flex flex-col gap-3"
              >
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-foreground/30" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-foreground/30" />
                <Icon className="h-6 w-6 text-foreground/70" aria-hidden="true" />
                <span className="text-2xl md:text-3xl font-light text-foreground">{value}</span>
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">{label}</span>
              </div>
            ))}
            <Link
              to="/booking"
              className="col-span-2 mt-2 text-center bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-full font-medium tracking-wide transition-colors"
            >
              Book a session
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
