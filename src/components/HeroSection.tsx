import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export const HeroSection = () => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoError = () => {
    console.log("Video failed to load, showing fallback image");
    setVideoError(true);
  };

  const handleVideoLoaded = () => {
    console.log("Video loaded successfully");
    setVideoLoaded(true);
  };

  const handleVideoCanPlay = () => {
    console.log("Video can play, attempting to start");
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Video started playing successfully");
            setVideoLoaded(true);
          })
          .catch((error) => {
            console.log("Autoplay failed:", error);
            setVideoLoaded(true);
          });
      }
    }
  };

  useEffect(() => {
    // Force video to play when component mounts
    const timer = setTimeout(() => {
      if (videoRef.current && !videoError) {
        videoRef.current.load();
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Initial play attempt failed:", error);
          });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [videoError]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        {!videoError && (
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover"
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            onCanPlay={handleVideoCanPlay}
            preload="auto"
            style={{ 
              display: videoLoaded ? 'block' : 'none',
              opacity: videoLoaded ? 1 : 0,
              transition: 'opacity 1s ease-in-out'
            }}
          >
            <source 
              src="https://ismifvjzvvyleahdmdrz.supabase.co/storage/v1/object/public/data101/Websitevideo.MP4"  
            />
          </video>
        )}
        
        {/* Fallback background image - only show if video fails */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(/lovable-uploads/25076f47-c2aa-4331-9cda-ba7cb683f9d4.png)`,
            display: (!videoLoaded || videoError) ? 'block' : 'none'
          }}
        />
        
        {/* Loading spinner */}
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <p className="text-base sm:text-lg md:text-xl text-white/90 font-light tracking-wide">
            Welcome To
          </p>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light text-white tracking-tight leading-tight">
            REVITALISE HUB
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed font-light px-4">
            Experience the transformative power of thermal therapy. Our premium ice baths and sauna 
            create the perfect environment for recovery, wellness, and mental clarity.
          </p>
          
          <div className="pt-6 sm:pt-8">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-full transition-all duration-300 hover:scale-105"
              onClick={() => window.location.href = '/booking'}
            >
              <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Book A Session
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 hidden sm:block">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};