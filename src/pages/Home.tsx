
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { BookingCards } from "@/components/BookingCards";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { LocalBusinessSchema } from "@/components/LocalBusinessSchema";

const Home = () => {
  return (
    <div className="min-h-screen">
      <SEOHead title="Home" description="Revitalise Hub offers premium cold water immersion, contrast therapy, saunas and recovery sessions in Lymington, Hampshire. Book your session today." path="/" />
      <LocalBusinessSchema />
      <Navigation />
      
      <main className="bg-gallery">
        <HeroSection />
        <BookingCards />
        <PhotoGallery />
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
