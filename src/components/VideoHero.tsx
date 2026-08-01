import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface VideoHeroProps {
  title: string;
  subtitle: string;
  description: string;
  videoUrl?: string;
  posterImage?: string;
}

export const VideoHero = ({ 
  title, 
  subtitle, 
  description, 
  videoUrl = "/placeholder-video.mp4",
  posterImage = "/placeholder-hero.jpg"
}: VideoHeroProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handlePlayPause = () => {
    const video = document.getElementById('hero-video') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    const video = document.getElementById('hero-video') as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video
          id="hero-video"
          className="w-full h-full object-cover"
          poster={posterImage}
          autoPlay
          muted
          loop
          playsInline
          webkit-playsinline="true"
          onLoadedData={() => {
            console.log('Video loaded successfully');
            const video = document.getElementById('hero-video') as HTMLVideoElement;
            if (video) {
              video.play().then(() => {
                console.log('Video started playing successfully');
                setIsPlaying(true);
              }).catch((error) => {
                console.error('Video autoplay failed:', error);
                setIsPlaying(false);
              });
            }
          }}
          onCanPlay={() => {
            console.log('Video can play, attempting to start');
            const video = document.getElementById('hero-video') as HTMLVideoElement;
            if (video && video.paused) {
              video.play().then(() => {
                console.log('Video started playing successfully');
                setIsPlaying(true);
              }).catch((error) => {
                console.error('Video play failed:', error);
                setIsPlaying(false);
              });
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={videoUrl} type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${posterImage})` }}
          />
        </video>
        
        {/* Video Overlay */}
        <div className="absolute inset-0 video-overlay" />
      </div>

      {/* Video Controls */}
      <div className="absolute top-8 right-8 flex gap-4 z-20">
        <Button
          variant="hero"
          size="icon"
          onClick={handlePlayPause}
          className="backdrop-blur-md"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="hero"
          size="icon"
          onClick={handleMute}
          className="backdrop-blur-md"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="animate-fade-in-up space-y-8">
          <div className="space-y-4">
            <p className="text-lg md:text-xl text-primary-foreground/80 font-medium tracking-wide uppercase">
              {subtitle}
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground leading-tight">
              {title}
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Button 
              variant="hero" 
              size="xl" 
              className="animate-scale-in min-w-[200px]"
            >
              Book Your Session
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="backdrop-blur-sm bg-background/10 border-primary-foreground/20 text-primary-foreground hover:bg-background/20 min-w-[200px]"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-primary-foreground/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-foreground/70 rounded-full mt-2 animate-wellness-pulse" />
        </div>
      </div>
    </section>
  );
};