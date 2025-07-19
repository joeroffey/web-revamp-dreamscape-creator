
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export const HeroSection = () => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
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
            setShowPlayButton(false);
          })
          .catch((error) => {
            console.log("Autoplay failed:", error);
            setVideoLoaded(true);
            if (isSafari) {
              setShowPlayButton(true);
            }
          });
      }
    }
  };

  const handlePlayClick = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setShowPlayButton(false);
        })
        .catch((error) => {
          console.log("Manual play failed:", error);
        });
    }
  };

  useEffect(() => {
    // Detect Safari
    const userAgent = navigator.userAgent;
    const isSafariDetected = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    setIsSafari(isSafariDetected);
    console.log("Safari detected:", isSafariDetected);
  }, []);

  useEffect(() => {
    // Aggressive Safari autoplay strategy
    if (isSafari && videoRef.current) {
      const video = videoRef.current;
      
      // Set properties for maximum Safari compatibility
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('playsinline', 'true');
      video.defaultMuted = true;
      
      // Force load and attempt immediate play
      video.load();
      
      const attemptPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Safari video autoplay successful");
              setVideoLoaded(true);
              setShowPlayButton(false);
            })
            .catch((error) => {
              console.log("Safari autoplay failed, will retry:", error);
              // Retry after a short delay
              setTimeout(() => {
                video.play().catch(() => {
                  console.log("Safari autoplay retry failed");
                  setShowPlayButton(true);
                });
              }, 1000);
            });
        }
      };
      
      // Multiple trigger points for Safari
      video.addEventListener('loadeddata', attemptPlay);
      video.addEventListener('canplay', attemptPlay);
      video.addEventListener('canplaythrough', attemptPlay);
      
      // Immediate attempt
      if (video.readyState >= 3) {
        attemptPlay();
      }
      
      return () => {
        video.removeEventListener('loadeddata', attemptPlay);
        video.removeEventListener('canplay', attemptPlay);
        video.removeEventListener('canplaythrough', attemptPlay);
      };
    }
    
    // Standard intersection observer for non-Safari browsers
    if (!isSafari) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && videoRef.current && !videoError) {
              const video = videoRef.current;
              video.preload = 'auto';
              video.load();
              
              setTimeout(() => {
                if (video) {
                  const playPromise = video.play();
                  if (playPromise !== undefined) {
                    playPromise.catch((error) => {
                      console.log("Non-Safari play failed:", error);
                    });
                  }
                }
              }, 300);
            }
          });
        },
        { threshold: 0.1 }
      );

      const videoElement = videoRef.current;
      if (videoElement) {
        observer.observe(videoElement);
      }

      return () => {
        if (videoElement) {
          observer.unobserve(videoElement);
        }
      };
    }
  }, [isSafari, videoError]);

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
            controls={false}
            disablePictureInPicture
            className="w-full h-full object-cover object-top"
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            onCanPlay={handleVideoCanPlay}
            preload="auto"
            style={{ 
              display: videoLoaded ? 'block' : 'none',
              opacity: videoLoaded ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              objectPosition: 'center top'
            }}
            {...(isSafari && { 'webkit-playsinline': true })}
          >
            <source 
              src="https://ismifvjzvvyleahdmdrz.supabase.co/storage/v1/object/public/data101/Websitevideo.MP4" 
              type="video/mp4" 
            />
          </video>
        )}
        
        {/* Safari Play Button Overlay */}
        {showPlayButton && isSafari && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <button
              onClick={handlePlayClick}
              className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition-colors duration-300 group"
              aria-label="Play video"
            >
              <div className="w-0 h-0 border-l-[24px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-2 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
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
