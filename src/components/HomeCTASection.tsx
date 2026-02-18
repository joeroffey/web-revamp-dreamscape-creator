import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const HomeCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background" aria-labelledby="why-choose-heading">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 id="why-choose-heading" className="text-3xl md:text-4xl font-bold text-foreground tracking-wide mb-4">
            WHY CHOOSE REVITALISE HUB?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Whether you're recovering from training, managing stress or simply looking for a boost, our contrast therapy sessions in Lymington combine sauna heat and cold plunge immersion to leave you feeling recharged.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Explore Our Hub</h3>
            <p className="text-muted-foreground leading-relaxed">
              Purpose-built for recovery and wellness, our Lymington facility features ice baths, infrared saunas and everything you need for a restorative session.{" "}
              <a href="/our-hub" onClick={(e) => { e.preventDefault(); navigate("/our-hub"); }} className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                Take a look around our hub
              </a>.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Upcoming Events</h3>
            <p className="text-muted-foreground leading-relaxed">
              From breathwork workshops to guided cold exposure sessions, we host regular events for all experience levels.{" "}
              <a href="/events" onClick={(e) => { e.preventDefault(); navigate("/events"); }} className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                See what's coming up
              </a>.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Plan Your Visit</h3>
            <p className="text-muted-foreground leading-relaxed">
              First time? Find out what to expect, what to bring and how to prepare for your session.{" "}
              <a href="/your-visit" onClick={(e) => { e.preventDefault(); navigate("/your-visit"); }} className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                Read our visitor guide
              </a>.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Save With a Membership</h3>
            <p className="text-muted-foreground leading-relaxed">
              Regular visitors can save with our flexible membership plans — unlimited sessions, priority booking and exclusive perks.{" "}
              <a href="/memberships" onClick={(e) => { e.preventDefault(); navigate("/memberships"); }} className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                View membership options
              </a>.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/booking")} className="min-h-[48px] text-base px-8">
            Book Your Session
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/your-visit")} className="min-h-[48px] text-base px-8">
            Plan Your Visit
          </Button>
        </div>
      </div>
    </section>
  );
};
