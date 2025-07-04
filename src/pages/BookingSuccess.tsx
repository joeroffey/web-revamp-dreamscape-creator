import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Mail, Home } from "lucide-react";
import { Link } from "react-router-dom";

const BookingSuccess = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
              Booking Confirmed!
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light mb-12">
              Thank you for your booking. We've sent a confirmation email with all the details.
            </p>

            <Card className="wellness-card max-w-2xl mx-auto mb-8">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    <span>Your session details have been confirmed</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Mail className="h-5 w-5" />
                    <span>Confirmation email sent to your inbox</span>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-semibold mb-2">What's Next?</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Arrive 10 minutes before your session</li>
                      <li>• Bring a towel and comfortable clothing</li>
                      <li>• Stay hydrated before and after your session</li>
                      <li>• Contact us if you need to reschedule</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Return Home
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/booking">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Another Session
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default BookingSuccess;