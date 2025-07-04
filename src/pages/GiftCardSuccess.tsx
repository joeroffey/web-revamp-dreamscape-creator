import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Gift, Mail, Home } from "lucide-react";
import { Link } from "react-router-dom";

const GiftCardSuccess = () => {
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
              Gift Card Purchased!
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light mb-12">
              Your gift card has been successfully purchased. The recipient will receive it via email.
            </p>

            <Card className="wellness-card max-w-2xl mx-auto mb-8">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Gift className="h-5 w-5" />
                    <span>Gift card code generated and ready to use</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Mail className="h-5 w-5" />
                    <span>Email sent with gift card details</span>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-semibold mb-2">Gift Card Details</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Valid for 12 months from purchase date</li>
                      <li>• Can be used for any of our wellness services</li>
                      <li>• Present the gift card code when booking</li>
                      <li>• Contact us for assistance with redemption</li>
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
                <Link to="/gift-cards">
                  <Gift className="h-4 w-4 mr-2" />
                  Purchase Another Gift Card
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GiftCardSuccess;