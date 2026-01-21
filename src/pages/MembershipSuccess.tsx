import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, Calendar, Mail, Home, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MembershipDetails {
  membership_type: string;
  sessions_per_week: number;
  start_date: string;
  end_date: string;
  price_amount: number;
  customer_email: string;
}

const MembershipSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [membership, setMembership] = useState<MembershipDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembership = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("memberships")
          .select("membership_type, sessions_per_week, start_date, end_date, price_amount, customer_email")
          .eq("stripe_subscription_id", sessionId)
          .maybeSingle();

        if (!error && data) {
          setMembership(data);
        }
      } catch (err) {
        console.error("Error fetching membership:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembership();
  }, [sessionId]);

  const getMembershipName = (type: string) => {
    const names: Record<string, string> = {
      "1_session_week": "1 Session Per Week",
      "2_sessions_week": "2 Sessions Per Week",
      "unlimited": "Unlimited Membership"
    };
    return names[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="h-10 w-10 text-primary" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
              Welcome to the Club!
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light mb-12">
              Your membership is now active. Get ready to experience the full benefits of contrast therapy.
            </p>

            <Card className="wellness-card max-w-2xl mx-auto mb-8">
              <CardContent className="p-8">
                {loading ? (
                  <div className="text-muted-foreground">Loading your membership details...</div>
                ) : membership ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Sparkles className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-semibold text-foreground">
                        {getMembershipName(membership.membership_type)}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Sessions Per Week</p>
                        <p className="text-lg font-medium">
                          {membership.sessions_per_week >= 999 ? "Unlimited" : membership.sessions_per_week}
                        </p>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Monthly Price</p>
                        <p className="text-lg font-medium">
                          £{(membership.price_amount / 100).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                        <p className="text-lg font-medium">
                          {membership.start_date ? formatDate(membership.start_date) : "Today"}
                        </p>
                      </div>
                      
                      <div className="bg-muted/30 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Next Renewal</p>
                        <p className="text-lg font-medium">
                          {membership.end_date ? formatDate(membership.end_date) : "In 1 month"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-muted-foreground pt-4 border-t border-border">
                      <Mail className="h-5 w-5" />
                      <span>Confirmation sent to {membership.customer_email}</span>
                    </div>
                    
                    <div className="pt-4 border-t border-border">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        What's Next?
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-2 text-left">
                        <li>• Book your first session using your membership credits</li>
                        <li>• Your credits reset every Monday at midnight</li>
                        <li>• Manage your membership from your dashboard</li>
                        <li>• Enjoy exclusive member benefits and priority booking</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Your membership has been activated</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <Mail className="h-5 w-5" />
                      <span>Confirmation email sent to your inbox</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <Calendar className="h-5 w-5" />
                      <span>You can now book sessions using your membership</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/booking">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Your First Session
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MembershipSuccess;
