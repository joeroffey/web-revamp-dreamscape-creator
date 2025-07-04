import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { PhotoGallery } from "@/components/PhotoGallery";

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main>
        <HeroSection />
        <PhotoGallery />
      </main>
    </div>
  );
};

export default Home;