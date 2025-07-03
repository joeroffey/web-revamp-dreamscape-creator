import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  Heart, 
  Zap, 
  Shield, 
  Target, 
  Sparkles,
  Activity,
  RefreshCw
} from "lucide-react";

export const BenefitsSection = () => {
  const benefits = [
    {
      icon: Brain,
      title: "Mental Clarity",
      description: "Cold exposure triggers the release of norepinephrine, enhancing focus, alertness, and cognitive function.",
      stat: "300%",
      statLabel: "increase in norepinephrine"
    },
    {
      icon: Heart,
      title: "Cardiovascular Health",
      description: "Heat and cold therapy improve circulation, heart rate variability, and overall cardiovascular resilience.",
      stat: "25%",
      statLabel: "improvement in circulation"
    },
    {
      icon: Zap,
      title: "Faster Recovery",
      description: "Reduced inflammation and enhanced blood flow accelerate muscle recovery and reduce soreness.",
      stat: "50%",
      statLabel: "faster muscle recovery"
    },
    {
      icon: Shield,
      title: "Immune System Boost",
      description: "Regular thermal therapy strengthens immune response and increases white blood cell production.",
      stat: "40%",
      statLabel: "increase in immune markers"
    },
    {
      icon: Target,
      title: "Stress Reduction",
      description: "Controlled stress exposure builds resilience and reduces cortisol levels for better stress management.",
      stat: "20%",
      statLabel: "reduction in cortisol"
    },
    {
      icon: Sparkles,
      title: "Enhanced Sleep",
      description: "Temperature regulation and stress reduction lead to deeper, more restorative sleep patterns.",
      stat: "30%",
      statLabel: "improvement in sleep quality"
    },
    {
      icon: Activity,
      title: "Metabolism Boost",
      description: "Cold exposure activates brown fat and increases metabolic rate for enhanced energy expenditure.",
      stat: "15%",
      statLabel: "increase in metabolism"
    },
    {
      icon: RefreshCw,
      title: "Cellular Renewal",
      description: "Heat shock proteins and cold shock proteins promote cellular repair and longevity pathways.",
      stat: "60%",
      statLabel: "increase in heat shock proteins"
    }
  ];

  return (
    <section id="benefits" className="py-24 bg-wellness-calm/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Science-Backed Benefits
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the proven advantages of thermal therapy, supported by research 
            and validated by thousands of satisfied clients.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <Card 
              key={benefit.title}
              className="wellness-card group text-center overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:animate-float">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>

                {/* Stat */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {benefit.stat}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {benefit.statLabel}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Research Section */}
        <div className="bg-card wellness-card p-8 md:p-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-foreground mb-6">
              Backed by Research
            </h3>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our thermal therapy protocols are based on peer-reviewed research from leading 
              institutions including Stanford University, University of Helsinki, and the 
              National Institute of Health. Every session is designed to maximize these proven benefits.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Published Studies</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">10,000+</div>
                <div className="text-sm text-muted-foreground">Satisfied Clients</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">Report Improvements</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};