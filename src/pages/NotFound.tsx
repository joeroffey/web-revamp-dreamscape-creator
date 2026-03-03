import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Mail } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Return to Revitalise Hub to explore our cold water therapy, saunas, and recovery sessions in Lymington."
        path="/404"
        robots="noindex,nofollow"
      />
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-16">
        <div className="max-w-lg mx-auto text-center space-y-8">
          <img
            src="/images/7213f936-2c10-4a80-a628-96054c5c6507.png"
            alt="Revitalise Hub Logo"
            className="h-24 w-auto mx-auto opacity-60"
            width={160}
            height={96}
            loading="eager"
          />

          <div className="space-y-3">
            <h1 className="text-7xl font-bold text-primary tracking-tight">404</h1>
            <p className="text-xl text-foreground font-medium">
              Page not found
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
              Let's get you back on track.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link to="/">
              <Button className="w-full sm:w-auto rounded-full px-6 gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <Link to="/booking">
              <Button variant="outline" className="w-full sm:w-auto rounded-full px-6 gap-2">
                <Calendar className="h-4 w-4" />
                Book a Session
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="w-full sm:w-auto rounded-full px-6 gap-2">
                <Mail className="h-4 w-4" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
