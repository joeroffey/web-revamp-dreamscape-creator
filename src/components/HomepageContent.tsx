import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import { FAQSection } from "@/components/FAQSection";

const homepageFaqs = [
  {
    question: "What is contrast therapy and how does it work?",
    answer: "Contrast therapy alternates between cold water immersion (ice bath) and heat exposure (sauna). This process causes blood vessels to constrict and dilate, boosting circulation, reducing inflammation, and accelerating muscle recovery. Sessions at Revitalise Hub typically involve alternating between our ice bath at 3–6°C and our sauna at 80–95°C."
  },
  {
    question: "Is cold plunge therapy safe for beginners?",
    answer: "Absolutely. Our team guides every first-timer through the process, starting with shorter immersions and building up gradually. We recommend consulting your GP if you have cardiovascular conditions, Raynaud's disease, or are pregnant. Most healthy adults adapt quickly and enjoy the benefits from their very first session."
  },
  {
    question: "How long is a session at Revitalise Hub?",
    answer: "Each contrast therapy session lasts 60 minutes. This gives you plenty of time for multiple rounds of cold plunge and sauna, plus time to shower and relax afterwards. We recommend arriving 5–10 minutes early for your first visit."
  },
  {
    question: "What should I bring to my session?",
    answer: "Bring swimwear, a water bottle, and a towel (though towels are available at the hub). We provide everything else you need including robes and changing facilities. Avoid heavy meals 1–2 hours before your session for the best experience."
  },
  {
    question: "What's the difference between communal and private sessions?",
    answer: "Communal sessions are shared with other guests — a social, supportive environment that many regulars love. Private sessions give you exclusive use of the facilities, ideal for couples, small groups, or anyone who prefers a more personal experience. Both include full access to ice bath and sauna."
  },
  {
    question: "Do you offer memberships or packages?",
    answer: "Yes! We offer weekly memberships starting from 2 sessions per week, with significant savings compared to single bookings. Members also enjoy priority booking and exclusive perks. Visit our Memberships page for full details and pricing."
  },
  {
    question: "Where is Revitalise Hub located?",
    answer: "We're located at Unit 7, Ensign Yard, 670 Ampress Lane, Lymington SO41 8QY, Hampshire. We're easily accessible from the New Forest, Southampton, Bournemouth, and surrounding areas. Free parking is available on site."
  },
  {
    question: "What are the proven benefits of contrast therapy?",
    answer: "Research supports numerous benefits including reduced muscle soreness and inflammation, improved circulation, enhanced immune function, better sleep quality, reduced stress and anxiety, and improved mental clarity. Regular contrast therapy has also been linked to increased metabolic rate and improved mood through endorphin release."
  },
];

export const HomepageContent = () => {
  return (
    <>
      {/* What Is Contrast Therapy */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-8 tracking-tight text-center">
            What Is Contrast Therapy?
          </h2>
          <div className="prose prose-lg max-w-none text-muted-foreground font-light leading-relaxed space-y-5">
            <p>
              Contrast therapy is the practice of alternating between extreme cold — such as an ice bath or cold plunge — and heat exposure in a sauna. This powerful technique has been used for centuries across Scandinavian, Japanese, and Russian cultures, and is now backed by{" "}
              <a href="https://www.nhs.uk/live-well/exercise/running-and-aerobic-exercises/how-to-warm-up-before-exercising/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80">
                modern research
              </a>{" "}
              as one of the most effective methods for recovery, resilience, and overall wellbeing.
            </p>
            <p>
              At Revitalise Hub in Lymington, Hampshire, our purpose-built facility offers premium contrast therapy sessions combining ice baths at 3–6°C with infrared and traditional saunas reaching 80–95°C. Whether you're an athlete seeking faster recovery, someone managing chronic pain, or simply looking to boost your energy and mental clarity, contrast therapy delivers measurable results from your very first session.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-12 tracking-tight text-center">
            Benefits of Cold Plunge &amp; Sauna Therapy
          </h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 text-muted-foreground font-light leading-relaxed">
            <div>
              <h3 className="text-xl font-medium text-foreground mb-3">Faster Muscle Recovery</h3>
              <p>
                Cold water immersion constricts blood vessels, flushing metabolic waste from tired muscles. When you then enter the sauna, fresh oxygenated blood rushes back in, dramatically{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/17214597/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  reducing delayed-onset muscle soreness
                </a>{" "}
                and speeding up repair.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground mb-3">Reduced Inflammation</h3>
              <p>
                The cold plunge triggers a powerful anti-inflammatory response throughout the body. Regular sessions can help manage chronic inflammation linked to conditions like arthritis, joint pain, and sports injuries.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground mb-3">Boosted Immune System</h3>
              <p>
                Studies show that regular cold exposure increases white blood cell production and stimulates the lymphatic system, helping your body fight illness more effectively throughout the year.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground mb-3">Improved Mental Health</h3>
              <p>
                Cold water immersion triggers a surge of endorphins and norepinephrine — the brain's natural mood-boosting chemicals. Many of our Lymington clients report reduced anxiety, better sleep, and sharper mental focus after regular sessions.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground mb-3">Enhanced Circulation</h3>
              <p>
                Alternating between cold and heat acts as a vascular workout, training your blood vessels to dilate and constrict more efficiently. This improves overall cardiovascular health and can lower blood pressure over time.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground mb-3">Better Sleep Quality</h3>
              <p>
                The cooling effect of cold water therapy helps regulate your core body temperature, promoting deeper and more restorative sleep. Many clients find that evening sessions lead to significantly improved rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-8 tracking-tight text-center">
            Why Choose Revitalise Hub?
          </h2>
          <div className="prose prose-lg max-w-none text-muted-foreground font-light leading-relaxed space-y-5">
            <p>
              Based in the heart of Lymington, Hampshire, Revitalise Hub is the area's dedicated contrast therapy centre. Unlike generic spas or gyms, our entire facility is purpose-built for cold water immersion and sauna therapy, giving you a focused, premium experience every time.
            </p>
            <p>
              Our team are passionate about cold water therapy and guide every guest — from first-timers nervous about the plunge to seasoned cold water enthusiasts looking to push their limits. We offer both{" "}
              <Link to="/booking" className="text-primary underline underline-offset-4 hover:text-primary/80">communal and private sessions</Link>,{" "}
              flexible <Link to="/memberships" className="text-primary underline underline-offset-4 hover:text-primary/80">membership plans</Link>,{" "}
              and <Link to="/gift-cards" className="text-primary underline underline-offset-4 hover:text-primary/80">gift cards</Link> for every occasion.
            </p>
            <p>
              Easily accessible from the New Forest, Southampton, Bournemouth, and across Hampshire, we're open six days a week with convenient parking on site. Check out{" "}
              <Link to="/our-hub" className="text-primary underline underline-offset-4 hover:text-primary/80">our hub</Link>{" "}
              and <Link to="/your-visit" className="text-primary underline underline-offset-4 hover:text-primary/80">plan your visit</Link>{" "}
              to learn more, or explore our upcoming <Link to="/events" className="text-primary underline underline-offset-4 hover:text-primary/80">events</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-8 tracking-tight text-center">
            Who Is Contrast Therapy For?
          </h2>
          <div className="prose prose-lg max-w-none text-muted-foreground font-light leading-relaxed space-y-5">
            <p>
              Contrast therapy isn't just for elite athletes. At Revitalise Hub we welcome everyone — from runners and cyclists recovering after long rides through the New Forest, to office workers tackling stress and chronic tension, to retirees looking to improve mobility and joint health.
            </p>
            <p>
              Whether you're training for an event, managing a health condition, or simply want to feel more energised and resilient, contrast therapy adapts to your needs. Our guided sessions make it easy for complete beginners while still challenging experienced cold water enthusiasts.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-6 tracking-tight">
            Book Your Session
          </h2>
          <p className="text-lg text-muted-foreground font-light mb-8">
            Ready to experience the benefits of contrast therapy in Lymington? Book your first session today and feel the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/booking">
                <Calendar className="mr-2 h-5 w-5" />
                Book Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link to="/memberships">
                View Memberships
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section with Schema */}
      <FAQSection
        faqs={homepageFaqs}
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about contrast therapy at Revitalise Hub in Lymington."
      />
    </>
  );
};
