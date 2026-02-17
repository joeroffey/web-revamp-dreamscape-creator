
import { Navigation } from "@/components/Navigation";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const Contact = () => {
  return (
    <div className="min-h-screen">
      <SEOHead title="Contact" description="Get in touch with Revitalise Hub in Lymington. Ask about our cold water therapy, sauna sessions, memberships, or book a visit." path="/contact" />
      <Navigation />
      
      <main className="pt-20 bg-gallery">
        <ContactSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
