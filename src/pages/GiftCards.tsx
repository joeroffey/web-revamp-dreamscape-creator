import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Heart, Star, User, Mail } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const GiftCards = () => {
  const { toast } = useToast();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    purchaserName: "",
    purchaserEmail: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
  });
  
  const presetAmounts = [
    { amount: 25, popular: false },
    { amount: 50, popular: true },
    { amount: 100, popular: false },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
  };

  const getCurrentAmount = () => {
    return selectedAmount || (customAmount ? Number(customAmount) : 0);
  };

  const handlePurchase = async () => {
    const amount = getCurrentAmount();
    
    if (!formData.purchaserName || !formData.purchaserEmail || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select an amount.",
        variant: "destructive",
      });
      return;
    }

    if (amount < 10 || amount > 500) {
      toast({
        title: "Invalid Amount",
        description: "Gift card amount must be between £10 and £500.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-gift-card-payment', {
        body: {
          purchaserName: formData.purchaserName,
          purchaserEmail: formData.purchaserEmail,
          recipientName: formData.recipientName || null,
          recipientEmail: formData.recipientEmail || null,
          amount: amount,
          message: formData.message || null,
        }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Gift card purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your gift card purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20 bg-cream">
        <section className="py-24">
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

            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Amount Selection - Now First */}
                <div>
                  <h3 className="text-2xl font-semibold mb-6">Choose Amount</h3>
                  
                  <div className="grid gap-4 mb-6">
                    {presetAmounts.map((preset) => (
                      <Card 
                        key={preset.amount} 
                        className={`wellness-card cursor-pointer relative transition-all ${
                          selectedAmount === preset.amount ? 'ring-2 ring-primary' : ''
                        } ${preset.popular ? 'border-primary/50' : ''}`}
                        onClick={() => handleAmountSelect(preset.amount)}
                      >
                        {preset.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Most Popular
                            </div>
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-semibold">£{preset.amount}</span>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedAmount === preset.amount ? 'bg-primary border-primary' : 'border-gray-300'
                            }`} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="wellness-card mb-6">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <Label>Custom Amount (£10 - £500)</Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-semibold">£</span>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="text-lg"
                            min="10"
                            max="500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="wellness-card">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4">
                        <span className="text-3xl font-semibold text-primary">
                          £{getCurrentAmount() || '0'}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">Selected Amount</p>
                      </div>
                      {getCurrentAmount() > 0 && (
                        <p className="text-sm text-muted-foreground">
                          ✓ Great choice! Now fill in your details on the right to purchase.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Gift Card Form - Now Second */}
                <div>
                  <h3 className="text-2xl font-semibold mb-6">Gift Card Details</h3>
                  
                  {getCurrentAmount() === 0 && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg text-center">
                      <p className="text-muted-foreground">👈 Please select a gift card amount first</p>
                    </div>
                  )}
                  
                  <Card className={`wellness-card ${getCurrentAmount() === 0 ? 'opacity-50' : ''}`}>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="purchaserName" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Your Name *
                            </Label>
                            <Input
                              id="purchaserName"
                              name="purchaserName"
                              value={formData.purchaserName}
                              onChange={handleInputChange}
                              placeholder="Your full name"
                              required
                              disabled={getCurrentAmount() === 0}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="purchaserEmail" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Your Email *
                            </Label>
                            <Input
                              id="purchaserEmail"
                              name="purchaserEmail"
                              type="email"
                              value={formData.purchaserEmail}
                              onChange={handleInputChange}
                              placeholder="your.email@example.com"
                              required
                              disabled={getCurrentAmount() === 0}
                            />
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label htmlFor="recipientName" className="flex items-center gap-2">
                              <Gift className="h-4 w-4" />
                              Recipient Name
                            </Label>
                            <Input
                              id="recipientName"
                              name="recipientName"
                              value={formData.recipientName}
                              onChange={handleInputChange}
                              placeholder="Gift recipient's name"
                              disabled={getCurrentAmount() === 0}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="recipientEmail">Recipient Email</Label>
                            <Input
                              id="recipientEmail"
                              name="recipientEmail"
                              type="email"
                              value={formData.recipientEmail}
                              onChange={handleInputChange}
                              placeholder="recipient@example.com"
                              disabled={getCurrentAmount() === 0}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="message">Personal Message</Label>
                          <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            placeholder="Add a personal message to your gift card..."
                            rows={3}
                            disabled={getCurrentAmount() === 0}
                          />
                        </div>
                        
                        <Button 
                          size="lg" 
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                          onClick={handlePurchase}
                          disabled={isLoading || !getCurrentAmount() || !formData.purchaserName || !formData.purchaserEmail}
                        >
                          {isLoading ? "Processing..." : `Purchase £${getCurrentAmount()} Gift Card`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="mt-12 bg-muted/30 rounded-lg p-8 text-center">
                <Heart className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">How It Works</h3>
                <div className="grid md:grid-cols-3 gap-6 text-muted-foreground">
                  <div>
                    <p className="font-medium mb-2">1. Choose Amount</p>
                    <p className="text-sm">Select from preset amounts or enter a custom value</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">2. Enter Details</p>
                    <p className="text-sm">Fill in your information and optional recipient details</p>
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
      
      <Footer />
    </div>
  );
};

export default GiftCards;