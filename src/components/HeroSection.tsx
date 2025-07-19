
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
    // Enhanced Safari compatibility
    const timer = setTimeout(() => {
      if (videoRef.current && !videoError) {
        // Safari-specific preloading
        videoRef.current.preload = 'metadata';
        videoRef.current.load();
        
        // Progressive loading for better Safari performance
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.preload = 'auto';
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                console.log("Initial play attempt failed:", error);
              });
            }
          }
        }, 500);
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
            webkit-playsinline="true"
            className="w-full h-full object-cover object-top"
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            onCanPlay={handleVideoCanPlay}
            preload="metadata"
            style={{ 
              display: videoLoaded ? 'block' : 'none',
              opacity: videoLoaded ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              objectPosition: 'center top'
            }}
          >
            <source 
              src="https://ismifvjzvvyleahdmdrz.supabase.co/storage/v1/object/public/data101/Websitevideo.MP4" 
              type="video/mp4" 
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
        
        {/* Reduced dark overlay for better video visibility */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content - Only Welcome message */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <p className="text-xl sm:text-2xl md:text-3xl text-white font-light tracking-wider uppercase drop-shadow-2xl">
              Welcome To
            </p>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light text-white tracking-tight leading-tight drop-shadow-2xl">
              REVITALISE HUB
            </h1>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 hidden sm:block">
        <div className="w-6 h-10 border-2 border-white/70 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/80 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};
