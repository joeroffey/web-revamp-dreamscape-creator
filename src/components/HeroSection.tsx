import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover"
          poster="/lovable-uploads/25076f47-c2aa-4331-9cda-ba7cb683f9d4.png"
        >
          <source 
            src="https://ismifvjzvvylehmdmdrz.supabase.co/storage/v1/object/public/data101/video.mp4" 
            type="video/mp4" 
          />
          {/* Fallback image if video fails */}
          <img 
            src="/lovable-uploads/25076f47-c2aa-4331-9cda-ba7cb683f9d4.png"
            alt="Revitalise Hub"
            className="w-full h-full object-cover"
          />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="space-y-6 animate-fade-in">
          <p className="text-lg md:text-xl text-white/90 font-light tracking-wide">
            Welcome To
          </p>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight">
            REVITALISE HUB
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light">
            Experience the transformative power of thermal therapy. Our premium ice baths and sauna 
            create the perfect environment for recovery, wellness, and mental clarity.
          </p>
          
          <div className="pt-8">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg font-medium rounded-full"
              onClick={() => window.open('https://revitalisehub.co.uk/contact', '_blank')}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book A Session
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};