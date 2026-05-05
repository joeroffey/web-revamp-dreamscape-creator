import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const cards = [
  {
    eyebrow: "Facility",
    title: "EXPLORE OUR HUB",
    description:
      "Purpose-built for recovery and wellness — ice baths, traditional saunas and everything you need for a restorative session.",
    cta: "TAKE A LOOK",
    href: "/our-hub",
  },
  {
    eyebrow: "What's On",
    title: "UPCOMING EVENTS",
    description:
      "From breathwork workshops to guided cold exposure sessions, we host regular events for all experience levels.",
    cta: "SEE EVENTS",
    href: "/events",
  },
  {
    eyebrow: "First Visit",
    title: "PLAN YOUR VISIT",
    description:
      "First time? Find out what to expect, what to bring and how to prepare for your session.",
    cta: "VISITOR GUIDE",
    href: "/your-visit",
  },
  {
    eyebrow: "Save",
    title: "MEMBERSHIPS",
    description:
      "Regular visitors save with flexible monthly plans — priority booking and exclusive perks included.",
    cta: "VIEW PLANS",
    href: "/memberships",
  },
  {
    eyebrow: "Complimentary",
    title: "RED LIGHT THERAPY",
    description:
      "Now included with every session at no extra cost. The perfect way to wind down your sauna and ice bath routine.",
    cta: "DISCOVER",
    href: "/red-light-therapy",
  },
];

export const HomeCTASection = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative py-24 bg-background"
      aria-labelledby="why-choose-heading"
    >
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            id="why-choose-heading"
            className="text-4xl md:text-6xl font-bold text-foreground tracking-wider mb-4"
          >
            WHY CHOOSE REVITALISE HUB?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Whether you're recovering from training, managing stress or simply
            looking for a boost, our contrast therapy sessions in Lymington
            leave you feeling recharged.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group relative backdrop-blur-md bg-foreground/5 border border-foreground/15 p-8 transition-all duration-500 hover:bg-foreground/10 hover:border-foreground/25"
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

                <button
                  onClick={() => navigate(card.href)}
                  className="mt-6 inline-flex items-center gap-3 text-foreground border-b border-foreground/40 pb-1 w-fit group-hover:border-foreground transition-colors duration-300"
                >
        <div className="text-center mb-16">
          <h2
            id="why-choose-heading"
            className="text-4xl md:text-6xl font-bold text-white tracking-wider mb-4"
          >
            WHY CHOOSE REVITALISE HUB?
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Whether you're recovering from training, managing stress or simply
            looking for a boost, our contrast therapy sessions in Lymington
            leave you feeling recharged.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group relative backdrop-blur-md bg-white/10 border border-white/20 p-8 transition-all duration-500 hover:bg-white/15 hover:border-white/30"
            >
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40" />

              <div className="flex flex-col h-full justify-between min-h-[220px]">
                <div>
                  <span className="text-white/50 text-xs tracking-[0.3em] uppercase mb-3 block">
                    {card.eyebrow}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-light text-white mb-4 tracking-wide">
                    {card.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <button
                  onClick={() => navigate(card.href)}
                  className="mt-6 inline-flex items-center gap-3 text-white border-b border-white/40 pb-1 w-fit group-hover:border-white transition-colors duration-300"
                >
                  <span className="text-sm tracking-wider">{card.cta}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
