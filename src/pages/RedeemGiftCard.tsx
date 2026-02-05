import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthContext";

const RedeemGiftCard = () => {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [giftCode, setGiftCode] = useState(searchParams.get("code") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [redeemedAmount, setRedeemedAmount] = useState<number | null>(null);

  // If user is not logged in, redirect to auth with return URL
  useEffect(() => {
    if (!authLoading && !user) {
      const code = searchParams.get("code");
      const returnUrl = code 
        ? `/redeem-gift-card?code=${code}` 
        : "/redeem-gift-card";
      navigate(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, authLoading, navigate, searchParams]);

  const handleRedeem = async () => {
    if (!giftCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter your gift card code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to redeem your gift card.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('redeem-gift-card', {
        body: { giftCode: giftCode.trim() },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }

      setIsRedeemed(true);
      setRedeemedAmount(data.creditAmount);
      
      toast({
        title: "Gift Card Redeemed!",
        description: data.message,
      });

    } catch (error) {
      console.error('Redemption error:', error);
      toast({
        title: "Redemption Failed",
        description: error instanceof Error ? error.message : "There was an error redeeming your gift card.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20 bg-gallery">
        <section className="py-24">
          <div className="max-w-md mx-auto px-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-light text-foreground mb-4 tracking-tight">
                Redeem Gift Card
              </h1>
              <p className="text-muted-foreground">
                Enter your gift card code to add credit to your account
              </p>
            </div>

            {isRedeemed ? (
              <Card className="wellness-card text-center">
                <CardContent className="pt-8 pb-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Success!</h2>
                  <p className="text-3xl font-bold text-primary mb-4">
                    £{redeemedAmount ? (redeemedAmount / 100).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-muted-foreground mb-6">
                    has been added to your credit balance
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/booking')}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                    >
                      Book a Session
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      className="w-full rounded-full"
                    >
                      View My Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="wellness-card">
                <CardHeader>
                  <CardTitle>Enter Your Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="giftCode">Gift Card Code</Label>
                    <Input
                      id="giftCode"
                      value={giftCode}
                      onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX"
                      className="text-center text-lg tracking-widest font-mono"
                      disabled={isLoading}
                    />
                  </div>

                  <Button 
                    size="lg"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                    onClick={handleRedeem}
                    disabled={isLoading || !giftCode.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redeeming...
                      </>
                    ) : (
                      "Redeem Gift Card"
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    Your credit will be valid for 1 year from redemption and can be used for bookings or memberships.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default RedeemGiftCard;
