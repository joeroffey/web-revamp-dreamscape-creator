import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Check, Mail, Calendar, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthContext";

const IntroOfferSuccess = () => {
  const { user } = useAuth();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20 bg-gallery">
        <section className="py-24">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Gift className="h-12 w-12 text-primary" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-light text-foreground mb-4 tracking-tight">
              Welcome to Revitalise Hub!
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              Your introductory offer has been activated. You now have 3 session credits ready to use.
            </p>

            <Card className="wellness-card mb-8">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">3 session credits added to your account</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Confirmation email sent to your inbox</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">Valid for 3 months from today</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-foreground mb-2">What's next?</h3>
              <p className="text-muted-foreground text-sm">
                Head to the booking page to schedule your first contrast therapy session. 
                Your session credits will be automatically applied at checkout.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/booking">
                <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Your First Session
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="rounded-full px-8">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Button>
              </Link>
            </div>

            {user && (
              <p className="text-sm text-muted-foreground mt-6">
                Signed in as <span className="font-medium">{user.email}</span>
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default IntroOfferSuccess;
