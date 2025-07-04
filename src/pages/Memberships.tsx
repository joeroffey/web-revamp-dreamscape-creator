import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Memberships = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const membershipPlans = [
    {
      id: "1_session_week",
      name: "1 Session Per Week",
      price: 48,
      sessions: 4,
      period: "month",
      popular: false,
      discount: 10,
      features: [
        "4 sessions per month",
        "10% discount on products",
        "Flexible 30-day cancellation",
        "Personal use only"
      ],
      description: "Perfect for establishing a consistent wellness routine with structured contrast therapy sessions."
    },
    {
      id: "2_sessions_week", 
      name: "2 Sessions Per Week",
      price: 75,
      sessions: 8,
      period: "month",
      popular: true,
      discount: 10,
      features: [
        "8 sessions per month",
        "10% discount on products",
        "Flexible 30-day cancellation",
        "Personal use only",
        "Priority booking"
      ],
      description: "Elevate your wellness journey with twice-weekly contrast therapy sessions."
    },
    {
      id: "unlimited",
      name: "Unlimited Membership",
      price: 100,
      sessions: 0,
      period: "month",
      popular: false,
      discount: 15,
      features: [
        "Unlimited sessions",
        "15% discount on products",
        "30-day cancellation period",
        "Personal use only",
        "Priority booking",
        "Exclusive member events"
      ],
      description: "Ultimate wellness freedom with unlimited access to contrast therapy sessions."
    }
  ];

  const handleSubscribe = async (membershipType: string) => {
    setLoading(membershipType);

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to purchase a membership.",
          variant: "destructive",
        });
        // Redirect to auth page
        window.location.href = "/auth";
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-membership-payment', {
        body: {
          membershipType,
          userId: session.user.id,
        }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Membership purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your membership purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
                Become a Member
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light">
                Experience the life-changing benefits of contrast therapy by becoming a member of Revitalise Hub. 
                Take advantage of substantial savings and unique perks as you seamlessly integrate this rejuvenating practice into your daily routine.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {membershipPlans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`wellness-card relative ${
                    plan.popular ? 'ring-2 ring-primary border-primary/50' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm font-medium flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-semibold mb-2">{plan.name}</CardTitle>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-primary">£{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                      } rounded-full`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading === plan.id}
                    >
                      {loading === plan.id ? "Processing..." : "Subscribe"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Membership Benefits</h3>
              <div className="grid md:grid-cols-3 gap-6 text-muted-foreground">
                <div>
                  <p className="font-medium mb-2">Flexible Cancellation</p>
                  <p className="text-sm">30-day cancellation policy on all memberships</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Product Discounts</p>
                  <p className="text-sm">Exclusive discounts on wellness products and accessories</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Personal Use</p>
                  <p className="text-sm">Memberships are non-transferable and for individual use only</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Memberships;