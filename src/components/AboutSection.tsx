import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const benefits = [
  { number: "01", title: "Boosts Recovery", description: "Reduces muscle soreness" },
  { number: "02", title: "Improves Circulation", description: "Enhances blood flow" },
  { number: "03", title: "Stress Relief", description: "Nervous system regulation" },
  { number: "04", title: "Mental Clarity", description: "Enhances focus" },
  { number: "05", title: "Reduces Inflammation", description: "Manages joint stiffness" },
  { number: "06", title: "Better Sleep", description: "Promotes sleep quality" },
  { number: "07", title: "Builds Resilience", description: "Physical & mental stress" },
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
      <section className="relative py-24 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/lovable-uploads/0c9e8b9e-c7cf-48f4-b85b-860370fe6702.png')`,
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative max-w-6xl mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-16 tracking-wider">
            BENEFITS
          </h2>
          
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            {benefits.slice(0, 6).map((benefit) => (
              <div 
                key={benefit.number}
                className="flex items-start gap-6 pb-6 border-b border-white/30"
              >
                <span className="text-4xl md:text-5xl font-bold text-white/90">
                  {benefit.number}
                </span>
                <div className="pt-2">
                  <h3 className="text-xl md:text-2xl font-medium text-white mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-white/70 text-sm md:text-base">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Centered 7th benefit */}
          <div className="mt-8 pb-6 border-b border-white/30">
            <div className="flex justify-center">
              <div className="flex items-start gap-6 max-w-md">
                <span className="text-4xl md:text-5xl font-bold text-white/90">
                  {benefits[6].number}
                </span>
                <div className="pt-2">
                  <h3 className="text-xl md:text-2xl font-medium text-white mb-1">
                    {benefits[6].title}
                  </h3>
                  <p className="text-white/70 text-sm md:text-base">
                    {benefits[6].description}
                  </p>
                </div>
              </div>
            </div>
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
