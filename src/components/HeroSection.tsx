
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSafariAutoplay } from "@/hooks/useSafariAutoplay";
import { SafariVideo } from "@/components/SafariVideo";

export const HeroSection = () => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { isSafari, userInteracted, attemptAutoplay, addUserInteractionListeners } = useSafariAutoplay();

  // Debug logging
  useEffect(() => {
    console.log("HeroSection: Safari detected:", isSafari);
    console.log("HeroSection: User interacted:", userInteracted);
    console.log("HeroSection: User agent:", navigator.userAgent);
  }, [isSafari, userInteracted]);

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
    console.log("Manual play button clicked");
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          console.log("Manual play successful");
          setShowPlayButton(false);
        })
        .catch((error) => {
          console.log("Manual play failed:", error);
        });
    }
  };

  useEffect(() => {
    // Add user interaction listeners for Safari
    if (isSafari) {
      console.log("Adding Safari user interaction listeners");
      addUserInteractionListeners();
    }
  }, [isSafari, addUserInteractionListeners]);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // Set all possible Safari-compatible attributes
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-video-playable-inline', 'true');
    video.setAttribute('webkit-video-playable-inline-auto-pause', 'false');
    video.defaultMuted = true;
    video.preload = 'auto';
    
    // Safari-specific autoplay strategy
    if (isSafari) {
      const attemptSafariAutoplay = async () => {
        console.log("Attempting Safari autoplay, userInteracted:", userInteracted);
        const canAutoplay = await attemptAutoplay();
        if (canAutoplay && video.readyState >= 2) { // HAVE_CURRENT_DATA
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Safari video autoplay successful");
                setVideoLoaded(true);
                setShowPlayButton(false);
              })
              .catch((error) => {
                console.log("Safari autoplay failed:", error);
                setVideoLoaded(true);
                setShowPlayButton(true);
              });
          }
        } else if (!canAutoplay) {
          console.log("Safari: Waiting for user interaction before autoplay");
          setVideoLoaded(true);
          setShowPlayButton(true);
        }
      };

      // Multiple event listeners for Safari
      const events = ['loadeddata', 'canplay', 'canplaythrough', 'loadedmetadata'];
      events.forEach(event => {
        video.addEventListener(event, attemptSafariAutoplay);
      });

      // If user has interacted, try to play immediately
      if (userInteracted) {
        console.log("User has interacted, attempting immediate autoplay");
        attemptSafariAutoplay();
      }

      // Force load the video
      video.load();

      return () => {
        events.forEach(event => {
          video.removeEventListener(event, attemptSafariAutoplay);
        });
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
  }, [isSafari, videoError, userInteracted, attemptAutoplay]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 safari-video-container">
        {!videoError && (
          <>
            {/* Use SafariVideo component for Safari */}
            {isSafari ? (
              <SafariVideo
                src="https://ismifvjzvvyleahdmdrz.supabase.co/storage/v1/object/public/data101/Websitevideo.MP4"
                poster="/lovable-uploads/25076f47-c2aa-4331-9cda-ba7cb683f9d4.png"
                className="w-full h-full object-cover object-top"
                onLoad={handleVideoLoaded}
                onError={handleVideoError}
                showPlayButton={showPlayButton}
                onPlayButtonClick={handlePlayClick}
              />
            ) : (
              /* Standard video for non-Safari browsers */
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
                webkit-playsinline="true"
                webkit-video-playable-inline="true"
                webkit-video-playable-inline-auto-pause="false"
              >
                <source 
                  src="https://ismifvjzvvyleahdmdrz.supabase.co/storage/v1/object/public/data101/Websitevideo.MP4" 
                  type="video/mp4" 
                />
              </video>
            )}
          </>
        )}
        
        {/* Fallback background image - only show if video fails */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(/lovable-uploads/25076f47-c2aa-4331-9cda-ba7cb683f9d4.png)`,
            display: (!videoLoaded || videoError) ? 'block' : 'none'
          }}
        />
        
        {/* Loading spinner - only for non-Safari browsers */}
        {!videoLoaded && !videoError && !isSafari && (
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
