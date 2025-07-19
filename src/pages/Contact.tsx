
import { Navigation } from "@/components/Navigation";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

const Contact = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20 bg-gallery">
        <ContactSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
