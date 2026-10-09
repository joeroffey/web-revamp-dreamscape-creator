import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { LocalBusinessSchema } from "@/components/LocalBusinessSchema";
import { FAQSection } from "@/components/FAQSection";
import { Car, MapPin, Users } from "lucide-react";
import { GOOGLE_REVIEWS_URL } from "@/lib/site";

const contactFaqs = [
  {
    question: "Do I need to book before I visit?",
    answer:
      "Yes — sessions run at set times, so please book online before you come. You can choose a communal session or book the whole hub privately for your group.",
  },
  {
    question: "Can I book the hub for a group or private event?",
    answer:
      "Yes. A private session gives your group exclusive use of the whole hub for the hour. Private sessions need an empty time slot, so get in touch if you can't see the time you want.",
  },
  {
    question: "How quickly will you reply to my message?",
    answer:
      "We aim to reply as soon as we can during opening hours. For anything urgent on the day of your session, please call us on 01590 698691.",
  },
  {
    question: "Can I change or cancel my booking?",
    answer:
      "Yes, you can cancel or reschedule your booking. Please contact us as early as possible if you need to make changes. Cancellation policies may apply depending on your booking type.",
  },
];

const Contact = () => {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Contact Us – Find Us in Lymington"
        description="Contact Revitalise Hub at Ensign Yard, Ampress Lane, Lymington SO41 8QY. Call 01590 698691 or email us about sessions, private bookings and memberships."
        path="/contact"
      />
      <LocalBusinessSchema />
      <Navigation />

      <main className="pt-20 bg-gallery">
        <ContactSection />

        <section className="pb-8" aria-labelledby="finding-us-heading">
          <div className="max-w-6xl mx-auto px-6">
            <h2 id="finding-us-heading" className="text-2xl md:text-4xl font-light tracking-tight text-center mb-10">
              Finding Revitalise Hub
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="relative bg-foreground/5 border border-foreground/15 p-8">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-foreground/30" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-foreground/30" />
                <MapPin className="h-6 w-6 text-foreground/70 mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-2">Where we are</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We&apos;re at Unit 7, Ensign Yard, 670 Ampress Lane, Lymington SO41 8QY — an easy trip from
                  across the New Forest, Milford on Sea, Brockenhurst and New Milton.{" "}
                  <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="underline">
                    Open in Google Maps
                  </a>
                  .
                </p>
              </div>
              <div className="relative bg-foreground/5 border border-foreground/15 p-8">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-foreground/30" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-foreground/30" />
                <Car className="h-6 w-6 text-foreground/70 mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-2">Parking &amp; arrival</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Free parking is available. When you arrive, our team will welcome you at reception — first-time
                  guests complete a short health questionnaire, so allow a few extra minutes.{" "}
                  <Link to="/your-visit" className="underline">
                    What to expect on your visit
                  </Link>
                  .
                </p>
              </div>
              <div className="relative bg-foreground/5 border border-foreground/15 p-8">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-foreground/30" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-foreground/30" />
                <Users className="h-6 w-6 text-foreground/70 mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold mb-2">Groups &amp; private hire</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Celebrating, training as a team or just want the space to yourselves? Private sessions give your
                  group the whole hub for an hour.{" "}
                  <Link to="/booking" className="underline">
                    Check availability
                  </Link>{" "}
                  or message us with your plans.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FAQSection
          faqs={contactFaqs}
          title="Questions Before You Get in Touch"
          subtitle="Quick answers to the things people ask us most."
        />
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
