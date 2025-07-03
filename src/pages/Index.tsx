import { Navigation } from "@/components/Navigation";
import { VideoHero } from "@/components/VideoHero";
import { ServicesSection } from "@/components/ServicesSection";
import { BenefitsSection } from "@/components/BenefitsSection";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main>
        <VideoHero 
          title="REVITALISE HUB"
          subtitle="Welcome To"
          description="Experience the transformative power of thermal therapy. Our premium ice baths and sauna create the perfect environment for recovery, wellness, and mental clarity."
          posterImage="/lovable-uploads/4b835fc2-686a-4098-bcd0-3b9519ea6cc0.png"
        />
        
        <ServicesSection />
        <BenefitsSection />
        <AboutSection />
        <ContactSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
