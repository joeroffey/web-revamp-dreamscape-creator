import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section Title */}
        <h2 className="text-4xl md:text-6xl font-bold text-white text-center mb-16 tracking-wider">
          BOOK A SESSION
        </h2>
        
        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Session Card */}
          <div className="bg-black/90 rounded-2xl p-8 md:p-10 text-center flex flex-col items-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-wide">
              CONTRAST THERAPY
            </h3>
            <p className="text-white/70 mb-8 leading-relaxed">
              Book a communal or private session combining ice bath and sauna for the ultimate recovery experience.
            </p>
            <Button 
              onClick={() => navigate('/booking')}
              className="bg-white text-black hover:bg-white/90 rounded-full px-8 py-3 font-medium"
            >
              BOOK A SESSION
            </Button>
          </div>
          
          {/* Membership Card */}
          <div className="bg-black/90 rounded-2xl p-8 md:p-10 text-center flex flex-col items-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-wide">
              MEMBERSHIP
            </h3>
            <p className="text-white/70 mb-8 leading-relaxed">
              Regulars, we've got you! Get unlimited access and exclusive benefits with our membership plans.
            </p>
            <Button 
              onClick={() => navigate('/memberships')}
              className="bg-white text-black hover:bg-white/90 rounded-full px-8 py-3 font-medium"
            >
              VIEW MEMBERSHIPS
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
