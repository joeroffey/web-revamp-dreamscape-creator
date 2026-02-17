
import { Navigation } from "@/components/Navigation";
import { AboutSection } from "@/components/AboutSection";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const About = () => {
  return (
    <div className="min-h-screen">
      <SEOHead title="About Us" description="Learn about Revitalise Hub, Lymington's dedicated cold water and contrast therapy centre. Meet our team and discover our mission." path="/about" />
      <Navigation />
      
      <main className="pt-20 bg-gallery">
        <AboutSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
