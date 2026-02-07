import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Zap, 
  Heart, 
  Brain, 
  Target, 
  Shield, 
  Moon, 
  Mountain 
} from "lucide-react";

const benefits = [
  { icon: Zap, title: "Boosts Recovery", description: "Reduces muscle soreness" },
  { icon: Heart, title: "Improves Circulation", description: "Enhances blood flow" },
  { icon: Brain, title: "Stress Relief", description: "Nervous system regulation" },
  { icon: Target, title: "Mental Clarity", description: "Enhances focus" },
  { icon: Shield, title: "Reduces Inflammation", description: "Manages joint stiffness" },
  { icon: Moon, title: "Better Sleep", description: "Promotes sleep quality" },
  { icon: Mountain, title: "Builds Resilience", description: "Physical & mental stress" },
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
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14 md:mb-16">
            <span className="text-sm uppercase tracking-widest text-primary/70 font-medium mb-3 block">
              Why Contrast Therapy
            </span>
            <h2 className="text-3xl md:text-5xl font-light text-foreground tracking-tight">
              The Benefits
            </h2>
          </div>
          
          {/* Bento-style grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              // Make first and last items span 2 columns on larger screens
              const isWide = index === 0 || index === 6;
              
              return (
                <div 
                  key={benefit.title}
                  className={`
                    group relative p-6 md:p-8 rounded-2xl bg-card border border-border/50
                    hover:border-primary/30 hover:shadow-lg transition-all duration-300
                    ${isWide ? 'lg:col-span-1' : ''}
                  `}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                  
                  {/* Subtle decorative element */}
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-primary/5 group-hover:scale-150 group-hover:bg-primary/10 transition-all duration-500" />
                </div>
              );
            })}
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
