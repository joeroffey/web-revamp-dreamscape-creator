import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah M.",
      image: "/lovable-uploads/2f950cd7-4515-4f21-ab0c-9005a8bde6c2.png",
      rating: 5,
      text: "The ice bath experience at Revitalise Hub is incredible. I feel energized and recovered after every session. The team is so knowledgeable and supportive!",
      treatment: "Ice Bath Therapy"
    },
    {
      name: "Emma K.",
      image: "/lovable-uploads/029c3081-4504-4d35-b1af-8c8ec751d983.png",
      rating: 5,
      text: "I never thought I'd enjoy cold water therapy, but the atmosphere here makes it amazing. The benefits I've experienced are beyond what I expected.",
      treatment: "Contrast Therapy"
    },
    {
      name: "Jessica L.",
      image: "/lovable-uploads/0c9e8b9e-c7cf-48f4-b85b-860370fe6702.png",
      rating: 5,
      text: "The combination of ice baths and sauna has transformed my recovery routine. I sleep better, feel stronger, and have so much more energy.",
      treatment: "Full Wellness Program"
    }
  ];

  return (
    <section className="py-24 bg-wellness-calm/20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            What Our Clients Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real experiences from real people who have transformed their wellness journey with us.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.name}
              className="wellness-card animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Client Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.treatment}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Ready to start your own transformation story?
          </p>
          <div className="bg-card wellness-card p-6 max-w-md mx-auto">
            <div className="text-3xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-sm text-muted-foreground">Average client rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};