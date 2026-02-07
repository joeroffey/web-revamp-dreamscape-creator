import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const BookingCards = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/lovable-uploads/0c9e8b9e-c7cf-48f4-b85b-860370fe6702.png')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      
      <div className="relative max-w-5xl mx-auto px-6">
        {/* Section Title */}
        <h2 className="text-4xl md:text-6xl font-bold text-white text-center mb-16 tracking-wider">
          BOOK A SESSION
        </h2>
        
        {/* Cards - 3 column glassmorphism design */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Contrast Therapy Card */}
          <div className="group relative backdrop-blur-md bg-white/10 border border-white/20 p-8 transition-all duration-500 hover:bg-white/15 hover:border-white/30">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40" />
            
            <div className="flex flex-col h-full justify-between min-h-[220px]">
              <div>
                <span className="text-white/50 text-xs tracking-[0.3em] uppercase mb-3 block">Session</span>
                <h3 className="text-2xl md:text-3xl font-light text-white mb-4 tracking-wide">
                  CONTRAST THERAPY
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Book a communal or private session combining ice bath and sauna for the ultimate recovery experience.
                </p>
              </div>
              
              <button 
                onClick={() => navigate('/booking')}
                className="mt-6 inline-flex items-center gap-3 text-white border-b border-white/40 pb-1 w-fit group-hover:border-white transition-colors duration-300"
              >
                <span className="text-sm tracking-wider">BOOK NOW</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
          
          {/* Membership Card */}
          <div className="group relative backdrop-blur-md bg-white/10 border border-white/20 p-8 transition-all duration-500 hover:bg-white/15 hover:border-white/30">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40" />
            
            <div className="flex flex-col h-full justify-between min-h-[220px]">
              <div>
                <span className="text-white/50 text-xs tracking-[0.3em] uppercase mb-3 block">Monthly</span>
                <h3 className="text-2xl md:text-3xl font-light text-white mb-4 tracking-wide">
                  MEMBERSHIP
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Regulars, we've got you! Get unlimited access and exclusive benefits with our membership plans.
                </p>
              </div>
              
              <button 
                onClick={() => navigate('/memberships')}
                className="mt-6 inline-flex items-center gap-3 text-white border-b border-white/40 pb-1 w-fit group-hover:border-white transition-colors duration-300"
              >
                <span className="text-sm tracking-wider">VIEW MEMBERSHIPS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Gift Card */}
          <div className="group relative backdrop-blur-md bg-white/10 border border-white/20 p-8 transition-all duration-500 hover:bg-white/15 hover:border-white/30">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/40" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/40" />
            
            <div className="flex flex-col h-full justify-between min-h-[220px]">
              <div>
                <span className="text-white/50 text-xs tracking-[0.3em] uppercase mb-3 block">Gift</span>
                <h3 className="text-2xl md:text-3xl font-light text-white mb-4 tracking-wide">
                  GIFT CARD
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Give the gift of wellness. Treat someone special to an unforgettable recovery experience.
                </p>
              </div>
              
              <button 
                onClick={() => navigate('/gift-cards')}
                className="mt-6 inline-flex items-center gap-3 text-white border-b border-white/40 pb-1 w-fit group-hover:border-white transition-colors duration-300"
              >
                <span className="text-sm tracking-wider">BUY GIFT CARD</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
