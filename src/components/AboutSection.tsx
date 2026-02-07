import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Zap, 
  Heart, 
  Brain, 
  Leaf, 
  Moon, 
  Shield,
  Flame,
  LucideIcon
} from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
  detail: string;
}

const benefits: Benefit[] = [
  { 
    icon: Zap, 
    title: "Boosts Recovery", 
    description: "Reduces muscle soreness",
    detail: "Accelerate your body's natural healing process and get back to peak performance faster."
  },
  { 
    icon: Heart, 
    title: "Improves Circulation", 
    description: "Enhances blood flow",
    detail: "Promote cardiovascular health and optimize oxygen delivery throughout your body."
  },
  { 
    icon: Leaf, 
    title: "Stress Relief", 
    description: "Nervous system regulation",
    detail: "Reset your parasympathetic nervous system and find deep, lasting calm."
  },
  { 
    icon: Brain, 
    title: "Mental Clarity", 
    description: "Enhances focus",
    detail: "Sharpen your mind and unlock heightened concentration and cognitive performance."
  },
  { 
    icon: Flame, 
    title: "Reduces Inflammation", 
    description: "Manages joint stiffness",
    detail: "Combat chronic inflammation and support joint health naturally."
  },
  { 
    icon: Moon, 
    title: "Better Sleep", 
    description: "Promotes sleep quality",
    detail: "Improve your sleep architecture for deeper, more restorative rest."
  },
  { 
    icon: Shield, 
    title: "Builds Resilience", 
    description: "Physical & mental stress",
    detail: "Train your body and mind to adapt and thrive under pressure."
  },
];

export const AboutSection = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-rotate benefits
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % benefits.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index: number) => {
    if (index !== activeIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const activeBenefit = benefits[activeIndex];

  return (
    <>
      <section className="py-24 bg-gallery">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-light text-foreground mb-8 tracking-tight">
              About us
            </h2>
            
            <div className="space-y-8 text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
              <p>
                The wellness centre offers a unique experience that combines the benefits of 
                cold-water immersion and heat therapies, creating an experience that promotes 
                health, recovery, and mental clarity.
              </p>
              
              <p>
                Our facility features two ice baths and an eight-person sauna, allowing us to 
                accommodate up to five clients at a time for personalised and impactful sessions.
              </p>
            </div>
            
            <div className="mt-12">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 text-lg font-medium rounded-full"
                onClick={() => navigate('/booking')}
              >
                Book A Session
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Auto-rotating Carousel */}
      <section className="relative py-24 md:py-32 overflow-hidden min-h-[600px] md:min-h-[700px]">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url('/lovable-uploads/0c9e8b9e-c7cf-48f4-b85b-860370fe6702.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/85" />
        
        <div className="relative max-w-5xl mx-auto px-6 flex flex-col items-center justify-center h-full">
          {/* Section Label */}
          <div className="mb-8">
            <span className="text-white/40 text-sm tracking-[0.3em] uppercase">
              Why Contrast Therapy
            </span>
          </div>

          {/* Main Rotating Display */}
          <div className="text-center min-h-[280px] md:min-h-[320px] flex flex-col items-center justify-center">
            {/* Icon */}
            <div 
              className={`w-20 h-20 md:w-24 md:h-24 mx-auto mb-8 rounded-full border-2 border-white/20 flex items-center justify-center transition-all duration-500 ${
                isTransitioning ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
              }`}
            >
              <activeBenefit.icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>

            {/* Title */}
            <h3 
              className={`text-3xl md:text-5xl lg:text-6xl font-light text-white mb-4 tracking-wide transition-all duration-500 ${
                isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              }`}
            >
              {activeBenefit.title}
            </h3>

            {/* Subtitle */}
            <p 
              className={`text-white/60 text-lg md:text-xl mb-6 transition-all duration-500 delay-75 ${
                isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              }`}
            >
              {activeBenefit.description}
            </p>

            {/* Detail Text */}
            <p 
              className={`text-white/40 text-sm md:text-base max-w-xl mx-auto leading-relaxed transition-all duration-500 delay-100 ${
                isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
              }`}
            >
              {activeBenefit.detail}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-3 mt-12">
            {benefits.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`relative h-2 rounded-full transition-all duration-500 ${
                  index === activeIndex 
                    ? 'w-8 bg-white' 
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`View benefit ${index + 1}`}
              >
                {index === activeIndex && (
                  <span 
                    className="absolute inset-0 rounded-full bg-white/50 animate-pulse"
                    style={{ animationDuration: '4s' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Benefit Pills - Small indicators at bottom */}
          <div className="hidden md:flex flex-wrap justify-center gap-3 mt-10 max-w-3xl">
            {benefits.map((benefit, index) => (
              <button
                key={benefit.title}
                onClick={() => handleDotClick(index)}
                className={`px-4 py-2 rounded-full text-xs tracking-wide transition-all duration-300 ${
                  index === activeIndex
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-transparent text-white/40 border border-white/10 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {benefit.title}
              </button>
            ))}
          </div>
        </div>
      </section>

    {/* How It Started Section */}
    <section className="py-24 bg-gallery">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="/lovable-uploads/founders-lewis-tommy.png"
              alt="Lewis and Tommy, founders of Revitalise Hub"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
          
          {/* Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-light text-foreground tracking-tight">
              How It Started
            </h2>
            
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed font-light">
              <p>
                Revitalise Hub was founded by Lewis and Tommy, two friends with a shared passion for the power of cold water and its ability to reset both body and mind. What started as a personal journey has grown into a space where others can experience the same sense of renewal, resilience, and clarity.
              </p>
              
              <p>
                Step into the contrast of ice baths and sauna sessions, designed to invigorate, challenge, and restore. The sharp energy of cold immersion meets the deep relaxation of heat therapy, leaving you refreshed, balanced, and ready to take on life with a clearer mind.
              </p>
              
              <p className="font-medium text-foreground">
                Revitalise Hub is your space to pause, reset, and recharge.
              </p>
              
              <p>
                Our facility will feature two ice baths and an eight-person sauna, allowing us to accommodate up to five customers per hour for personalised and impactful sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </>
);
};
