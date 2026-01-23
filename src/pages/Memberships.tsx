import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Sparkles, LogIn, Gift, Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthContext";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Memberships = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  
  // Intro offer state
  const [introDialogOpen, setIntroDialogOpen] = useState(false);
  const [introForm, setIntroForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [eligibilityReason, setEligibilityReason] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pre-fill form and check eligibility if user is logged in
  useEffect(() => {
    if (user?.email) {
      setIntroForm(prev => ({
        ...prev,
        email: user.email || "",
        name: user.user_metadata?.full_name || user.user_metadata?.name || ""
      }));
      // Auto-check eligibility for logged-in users
      checkIntroEligibility(user.email);
    }
  }, [user]);

  const membershipPlans = [
    {
      id: "4_sessions_month",
      name: "4 Sessions Per Month",
      price: 48,
      sessions: 4,
      period: "month",
      popular: false,
      features: [
        "4 sessions per month",
        "Use anytime within your billing period",
        "Flexible 30-day cancellation",
        "Personal use only"
      ],
      description: "Perfect for establishing a consistent wellness routine with structured contrast therapy sessions."
    },
    {
      id: "8_sessions_month", 
      name: "8 Sessions Per Month",
      price: 75,
      sessions: 8,
      period: "month",
      popular: true,
      features: [
        "8 sessions per month",
        "Use anytime within your billing period",
        "Flexible 30-day cancellation",
        "Personal use only"
      ],
      description: "Elevate your wellness journey with regular contrast therapy sessions."
    },
    {
      id: "unlimited",
      name: "Unlimited Membership",
      price: 100,
      sessions: 0,
      period: "month",
      popular: false,
      features: [
        "Unlimited sessions",
        "30-day cancellation period",
        "Personal use only",
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
          description: "Please sign in or create an account to purchase a membership.",
          variant: "destructive",
        });
        window.location.href = "/auth";
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-membership-payment', {
        body: {
          membershipType,
          userId: session.user.id,
          autoRenew: true,
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

  const checkIntroEligibility = async (email: string) => {
    if (!email) return;
    
    setCheckingEligibility(true);
    setIsEligible(null);
    setEligibilityReason(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-intro-eligibility', {
        body: { email: email.trim() }
      });

      if (error) throw error;

      setIsEligible(data.isEligible);
      setEligibilityReason(data.reason);
    } catch (error) {
      console.error('Eligibility check error:', error);
      setIsEligible(null);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleIntroEmailBlur = () => {
    if (introForm.email) {
      checkIntroEligibility(introForm.email);
    }
  };

  const handleIntroOfferPurchase = async () => {
    // Validate required fields
    if (!introForm.name || !introForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }

    // For non-logged-in users, validate password fields
    if (!user) {
      if (!introForm.password) {
        toast({
          title: "Password Required",
          description: "Please create a password for your account.",
          variant: "destructive",
        });
        return;
      }

      if (introForm.password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters.",
          variant: "destructive",
        });
        return;
      }

      if (introForm.password !== introForm.confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure your passwords match.",
          variant: "destructive",
        });
        return;
      }
    }

    if (isEligible === false) {
      toast({
        title: "Not Eligible",
        description: eligibilityReason || "You are not eligible for this offer.",
        variant: "destructive",
      });
      return;
    }

    setLoading('intro_offer');

    try {
      // If user is not logged in, create their account first
      if (!user) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: introForm.email.trim(),
          password: introForm.password,
          options: {
            data: {
              full_name: introForm.name.trim(),
              phone: introForm.phone.trim()
            },
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) {
          // Check if user already exists
          if (signUpError.message.includes('already registered')) {
            toast({
              title: "Account Exists",
              description: "An account with this email already exists. Please sign in instead.",
              variant: "destructive",
            });
            setLoading(null);
            return;
          }
          throw signUpError;
        }

        // Small delay to ensure auth state updates
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Now proceed with payment
      const { data, error } = await supabase.functions.invoke('create-intro-offer-payment', {
        body: {
          email: introForm.email.trim(),
          name: introForm.name.trim(),
          phone: introForm.phone.trim()
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Intro offer purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20 bg-gallery">
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

              {!user && (
                <div className="mt-8 bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-2xl mx-auto">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <LogIn className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Sign in to subscribe</h3>
                      <p className="text-sm text-muted-foreground">
                        You'll need an account to start a membership. Sign in or create a free account to get started.
                      </p>
                    </div>
                    <Link to="/auth">
                      <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In / Sign Up
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Introductory Offer Card - Only show if not signed in, or signed in and eligible */}
            {(!user || isEligible === true || isEligible === null) && (
              <div className="mb-12">
                <Card className="wellness-card border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                          <Gift className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">Introductory Offer</h3>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">First-Timers Only</Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">
                          New to contrast therapy? Try <strong>3 sessions for just £35</strong> – use them anytime within 3 months.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Available exclusively for first-time customers with no previous bookings.
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-center">
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-primary">£35</span>
                          <span className="text-muted-foreground text-sm block">for 3 sessions</span>
                        </div>
                        <Button 
                          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => setIntroDialogOpen(true)}
                        >
                          Get Started
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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
                  <p className="font-medium mb-2">Personal Use</p>
                  <p className="text-sm">Memberships are non-transferable and for individual use only</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Member Events</p>
                  <p className="text-sm">Access to exclusive wellness workshops and community events</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Introductory Offer Dialog */}
      <Dialog open={introDialogOpen} onOpenChange={setIntroDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Introductory Offer
            </DialogTitle>
            <DialogDescription>
              3 sessions for £35 – available for first-time customers only
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="intro-name">Full Name *</Label>
              <Input
                id="intro-name"
                placeholder="Enter your full name"
                value={introForm.name}
                onChange={(e) => setIntroForm({ ...introForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intro-email">Email Address *</Label>
              <Input
                id="intro-email"
                type="email"
                placeholder="Enter your email"
                value={introForm.email}
                onChange={(e) => setIntroForm({ ...introForm, email: e.target.value })}
                onBlur={handleIntroEmailBlur}
              />
              {checkingEligibility && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking eligibility...
                </div>
              )}
              {isEligible === true && !checkingEligibility && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Check className="h-3 w-3" />
                  You're eligible for this offer!
                </div>
              )}
              {isEligible === false && !checkingEligibility && (
                <div className="text-sm text-destructive">
                  {eligibilityReason || "You are not eligible for this offer."}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="intro-phone">Phone Number (optional)</Label>
              <Input
                id="intro-phone"
                type="tel"
                placeholder="Enter your phone number"
                value={introForm.phone}
                onChange={(e) => setIntroForm({ ...introForm, phone: e.target.value })}
              />
            </div>

            {/* Password fields - only show for non-logged-in users */}
            {!user && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="intro-password">Create Password *</Label>
                  <div className="relative">
                    <Input
                      id="intro-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min 6 characters)"
                      value={introForm.password}
                      onChange={(e) => setIntroForm({ ...introForm, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intro-confirm-password">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="intro-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={introForm.confirmPassword}
                      onChange={(e) => setIntroForm({ ...introForm, confirmPassword: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {introForm.password && introForm.confirmPassword && introForm.password !== introForm.confirmPassword && (
                    <p className="text-sm text-destructive">Passwords don't match</p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  An account will be created for you to manage your sessions.
                </p>
              </>
            )}

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1">What you get:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 3 communal session credits</li>
                <li>• Valid for 3 months from purchase</li>
                <li>• Use anytime during opening hours</li>
              </ul>
            </div>
          </div>

          {isEligible === false && !checkingEligibility && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
              <p className="text-sm text-destructive font-medium">
                {eligibilityReason || "You are not eligible for this offer."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This offer is only available for first-time customers.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIntroDialogOpen(false)}
            >
              Cancel
            </Button>
            {isEligible !== false && (
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleIntroOfferPurchase}
                disabled={
                  loading === 'intro_offer' || 
                  checkingEligibility || 
                  !introForm.name || 
                  !introForm.email ||
                  (!user && (!introForm.password || introForm.password.length < 6 || introForm.password !== introForm.confirmPassword))
                }
              >
                {loading === 'intro_offer' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {!user ? "Creating Account..." : "Processing..."}
                  </>
                ) : checkingEligibility ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  !user ? "Create Account & Pay £35" : "Pay £35"
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Memberships;
