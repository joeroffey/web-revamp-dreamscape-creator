import React, { useRef, useEffect, useState } from 'react';

interface SafariVideoProps {
  src: string;
  poster?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  showPlayButton?: boolean;
  onPlayButtonClick?: () => void;
}

export const SafariVideo: React.FC<SafariVideoProps> = ({
  src,
  poster,
  className = "",
  onLoad,
  onError,
  onPlay,
  onPause,
  showPlayButton = false,
  onPlayButtonClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSafari, setIsSafari] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Detect Safari
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSafariDetected = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && /Mac/.test(userAgent);
    setIsSafari(isSafariDetected);
  }, []);

  // Handle user interaction for Safari
  useEffect(() => {
    if (!isSafari) return;

    const handleInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        // Try to play video after user interaction
        if (videoRef.current && videoRef.current.readyState >= 2) {
          videoRef.current.play().catch(console.error);
        }
      }
    };

    const events = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [isSafari, userInteracted]);

  // Setup video element
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Set all Safari-compatible attributes
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-video-playable-inline', 'true');
    video.setAttribute('webkit-video-playable-inline-auto-pause', 'false');
    video.defaultMuted = true;
    video.preload = 'auto';

    // Safari-specific autoplay attempt
    if (isSafari) {
      const attemptAutoplay = () => {
        if (userInteracted && video.readyState >= 2) {
          video.play().catch(console.error);
        }
      };

      const events = ['loadeddata', 'canplay', 'canplaythrough', 'loadedmetadata'];
      events.forEach(event => {
        video.addEventListener(event, attemptAutoplay);
      });

      return () => {
        events.forEach(event => {
          video.removeEventListener(event, attemptAutoplay);
        });
      };
    }
  }, [isSafari, userInteracted]);

  const handleLoadedData = () => {
    setVideoLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    onError?.();
  };

  const handlePlay = () => {
    onPlay?.();
  };

  const handlePause = () => {
    onPause?.();
  };

  const handlePlayButtonClick = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
    onPlayButtonClick?.();
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className={className}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        controls={false}
        disablePictureInPicture
        onLoadedData={handleLoadedData}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        webkit-playsinline="true"
        webkit-video-playable-inline="true"
        webkit-video-playable-inline-auto-pause="false"
        style={{
          display: videoLoaded ? 'block' : 'none',
          opacity: videoLoaded ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
        }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Safari Play Button */}
      {showPlayButton && isSafari && !userInteracted && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <button
            onClick={handlePlayButtonClick}
            className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition-colors duration-300 group"
            aria-label="Play video"
          >
            <div className="w-0 h-0 border-l-[24px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-2 group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {!videoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </div>
  );
};