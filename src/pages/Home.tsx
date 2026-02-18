
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { BookingCards } from "@/components/BookingCards";
import { PhotoGallery } from "@/components/PhotoGallery";
import { HomepageContent } from "@/components/HomepageContent";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { LocalBusinessSchema } from "@/components/LocalBusinessSchema";

const Home = () => {
  return (
    <div className="min-h-screen">
      <SEOHead title="Home" description="Revitalise Hub offers contrast therapy, sauna and cold plunge sessions in Lymington, Hampshire. Boost recovery, reduce inflammation and feel revitalised. Book today." path="/" />
      <LocalBusinessSchema />
      <Navigation />
      
      <main className="bg-gallery">
        <HeroSection />
        <BookingCards />
        <HomepageContent />
        <PhotoGallery />
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
