import { Navigation } from "@/components/Navigation";
import { ContactSection } from "@/components/ContactSection";

const Contact = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        <ContactSection />
      </main>
    </div>
  );
};

export default Contact;