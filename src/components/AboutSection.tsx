import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Zap, 
  Heart, 
  Brain, 
  Leaf, 
  Moon, 
  Shield,
  Flame
} from "lucide-react";

const benefits = [
  { icon: Zap, title: "Boosts Recovery", description: "Reduces muscle soreness" },
  { icon: Heart, title: "Improves Circulation", description: "Enhances blood flow" },
  { icon: Leaf, title: "Stress Relief", description: "Nervous system regulation" },
  { icon: Brain, title: "Mental Clarity", description: "Enhances focus" },
  { icon: Flame, title: "Reduces Inflammation", description: "Manages joint stiffness" },
  { icon: Moon, title: "Better Sleep", description: "Promotes sleep quality" },
  { icon: Shield, title: "Builds Resilience", description: "Physical & mental stress" },
];

export const AboutSection = () => {
  const navigate = useNavigate();

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

      {/* Benefits Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url('/lovable-uploads/0c9e8b9e-c7cf-48f4-b85b-860370fe6702.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        
        <div className="relative max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide">
              The Benefits
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Experience the proven advantages of contrast therapy
            </p>
          </div>
          
          {/* Benefits Grid - Icon Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {benefits.slice(0, 4).map((benefit) => (
              <div 
                key={benefit.title}
                className="group backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-white/80" />
                </div>
                <h3 className="text-white font-medium mb-2 text-sm md:text-base">
                  {benefit.title}
                </h3>
                <p className="text-white/50 text-xs md:text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
          
          {/* Second Row - 3 cards centered */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6 max-w-4xl mx-auto">
            {benefits.slice(4, 7).map((benefit) => (
              <div 
                key={benefit.title}
                className="group backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300 last:col-span-2 md:last:col-span-1"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-white/80" />
                </div>
                <h3 className="text-white font-medium mb-2 text-sm md:text-base">
                  {benefit.title}
                </h3>
                <p className="text-white/50 text-xs md:text-sm">
                  {benefit.description}
                </p>
              </div>
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
