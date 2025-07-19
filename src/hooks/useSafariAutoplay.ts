import { useState, useEffect, useRef } from 'react';

interface UseSafariAutoplayReturn {
  isSafari: boolean;
  userInteracted: boolean;
  attemptAutoplay: () => Promise<boolean>;
  addUserInteractionListeners: () => void;
  removeUserInteractionListeners: () => void;
}

export const useSafariAutoplay = (): UseSafariAutoplayReturn => {
  const [isSafari, setIsSafari] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const listenersAdded = useRef(false);

  // Detect Safari more accurately
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSafariDetected = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && /Mac/.test(userAgent);
    setIsSafari(isSafariDetected);
    console.log("Safari on Mac detected:", isSafariDetected);
  }, []);

  const handleUserInteraction = () => {
    if (!userInteracted) {
      console.log("User interaction detected, enabling autoplay");
      setUserInteracted(true);
      removeUserInteractionListeners();
    }
  };

  const addUserInteractionListeners = () => {
    if (isSafari && !listenersAdded.current) {
      document.addEventListener('click', handleUserInteraction, { passive: true });
      document.addEventListener('touchstart', handleUserInteraction, { passive: true });
      document.addEventListener('keydown', handleUserInteraction, { passive: true });
      document.addEventListener('scroll', handleUserInteraction, { passive: true });
      document.addEventListener('mousemove', handleUserInteraction, { passive: true });
      listenersAdded.current = true;
      console.log("Safari user interaction listeners added");
    }
  };

  const removeUserInteractionListeners = () => {
    if (listenersAdded.current) {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);
      document.removeEventListener('mousemove', handleUserInteraction);
      listenersAdded.current = false;
      console.log("Safari user interaction listeners removed");
    }
  };

  const attemptAutoplay = async (): Promise<boolean> => {
    if (!isSafari) return true;
    
    // If user hasn't interacted yet, we can't autoplay
    if (!userInteracted) {
      console.log("Safari: User hasn't interacted yet, cannot autoplay");
      return false;
    }

    console.log("Safari: User has interacted, autoplay should work");
    return true;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeUserInteractionListeners();
    };
  }, []);

  return {
    isSafari,
    userInteracted,
    attemptAutoplay,
    addUserInteractionListeners,
    removeUserInteractionListeners,
  };
};