
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { BookingCards } from "@/components/BookingCards";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Footer } from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen">
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
