import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Gift, Heart, Star } from "lucide-react";
import { useState } from "react";

const GiftCards = () => {
  const [customAmount, setCustomAmount] = useState("");
  
  const presetAmounts = [
    { amount: 25, popular: false },
    { amount: 50, popular: true },
    { amount: 100, popular: false },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-24 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
                Gift Cards
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                Give the gift of wellness. Perfect for birthdays, anniversaries, or just because.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-semibold text-center mb-8">Choose Your Amount</h3>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {presetAmounts.map((preset) => (
                  <Card key={preset.amount} className={`wellness-card cursor-pointer relative ${preset.popular ? 'ring-2 ring-primary' : ''}`}>
                    {preset.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Most Popular
                        </div>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-3xl font-light">£{preset.amount}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Button 
                        size="lg" 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                        onClick={() => alert("Gift card purchase requires Supabase integration")}
                      >
                        Select £{preset.amount}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="wellness-card mb-8">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Custom Amount</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-semibold">£</span>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="text-lg"
                      min="10"
                      max="500"
                    />
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                    disabled={!customAmount || Number(customAmount) < 10}
                    onClick={() => alert("Gift card purchase requires Supabase integration")}
                  >
                    Purchase £{customAmount} Gift Card
                  </Button>
                </CardContent>
              </Card>

              <div className="bg-muted/30 rounded-lg p-8 text-center">
                <Heart className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">How It Works</h3>
                <div className="grid md:grid-cols-3 gap-6 text-muted-foreground">
                  <div>
                    <p className="font-medium mb-2">1. Choose Amount</p>
                    <p className="text-sm">Select from preset amounts or enter a custom value</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">2. Purchase</p>
                    <p className="text-sm">Complete your purchase securely online</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">3. Receive</p>
                    <p className="text-sm">Gift card code delivered via email instantly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GiftCards;