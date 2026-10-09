import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { FAQSection } from "@/components/FAQSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Heart, Star, User, Mail } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const giftCardFaqs = [
  {
    question: "How long are gift cards valid?",
    answer: "Gift cards are valid for 12 months from the date of purchase. The expiry date is included in the gift card email sent to the recipient."
  },
  {
    question: "Can I use a gift card for memberships?",
    answer: "Gift cards can be redeemed as credit towards individual session bookings. They cannot currently be applied directly to recurring membership subscriptions."
  },
  {
    question: "How does the recipient redeem their gift card?",
    answer: "The recipient will receive an email with a unique gift card code. They can redeem it by creating an account on our website and entering the code on the Redeem Gift Card page. The value is added to their account as credit."
  },
  {
    question: "What can the recipient spend it on?",
    answer: "The gift card value is added to the recipient's account as credit, which they can use towards communal or private contrast therapy sessions. Every session includes the ice baths, the sauna and complimentary red light therapy."
  },
  {
    question: "Can I choose any amount?",
    answer: "Yes. Choose £25, £50 or £100, or enter a custom amount anywhere from £10 to £500."
  },
  {
    question: "Can I get a refund on a gift card?",
    answer: "Gift cards are non-refundable once purchased. If you have any issues with your gift card, please contact us and we'll do our best to help."
  },
];

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
    
    if (!formData.purchaserName || !formData.purchaserEmail || !formData.recipientName || !formData.recipientEmail || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including recipient details and select an amount.",
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

      // Redirect to Stripe checkout in same tab (avoids popup blockers)
      if (data?.url) {
        window.location.href = data.url;
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
    <div className="rh-site min-h-screen">
      <SEOHead title="Gift Cards – Ice Bath & Sauna Vouchers" description="Give the gift of wellness with a Revitalise Hub gift card for ice bath, sauna and contrast therapy sessions in Lymington. Delivered instantly by email." path="/gift-cards" />
      <Navigation />
      
      <main className="rh-main bg-gallery">
        <section className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="rh-rule mb-8" aria-hidden="true" />
              <h1 className="rh-display text-foreground mb-6">
                Contrast Therapy Gift Cards
              </h1>
              <p className="rh-lede max-w-2xl mx-auto">
                Give the gift of wellness. A Revitalise Hub gift card is the perfect present for birthdays,
                anniversaries, Christmas, or just because — delivered instantly by email.
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Amount Selection - Now First */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-6">Choose Amount</h2>
                  
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
                              selectedAmount === preset.amount ? 'bg-primary border-primary' : 'border-foreground/30'
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
                  <h2 className="text-2xl font-semibold mb-6">Gift Card Details</h2>
                  
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
                              Recipient Name *
                            </Label>
                            <Input
                              id="recipientName"
                              name="recipientName"
                              value={formData.recipientName}
                              onChange={handleInputChange}
                              placeholder="Gift recipient's name"
                              required
                              disabled={getCurrentAmount() === 0}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="recipientEmail" className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Recipient Email *
                            </Label>
                            <Input
                              id="recipientEmail"
                              name="recipientEmail"
                              type="email"
                              value={formData.recipientEmail}
                              onChange={handleInputChange}
                              placeholder="recipient@example.com"
                              required
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
                          disabled={isLoading || !getCurrentAmount() || !formData.purchaserName || !formData.purchaserEmail || !formData.recipientName || !formData.recipientEmail}
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
                <h2 className="text-xl font-semibold mb-4">How It Works</h2>
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

        <section className="pb-20" aria-labelledby="gift-experience-heading">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-5">
                <h2 id="gift-experience-heading" className="text-2xl md:text-4xl font-light tracking-tight">
                  The gift of an hour to reset
                </h2>
                <div className="space-y-4 text-muted-foreground text-lg font-light leading-relaxed">
                  <p>
                    A Revitalise Hub gift card gives someone special an hour of contrast therapy at our hub in
                    Lymington: two ice baths kept between 3°C and 7°C, an eight-person traditional sauna at
                    85–90°C, and complimentary red light therapy to finish.
                  </p>
                  <p>
                    It&apos;s a brilliant present for runners, gym-goers and anyone in training, for friends who
                    need to switch off from a busy week, or for someone who has always wanted to try an ice bath.
                    First-timers are guided through everything by our team, so no experience is needed.
                  </p>
                  <p>
                    The card arrives by email with a unique code. The recipient adds it to their account as
                    credit and books a time that suits them — either a communal session or a private session for
                    their group. Gift cards are valid for 12 months.
                  </p>
                </div>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: "Instant delivery", text: "Sent straight to the recipient by email with your personal message." },
                  { title: "Any amount", text: "Choose £25, £50, £100 or a custom value from £10 to £500." },
                  { title: "Valid 12 months", text: "Plenty of time to book a session that fits around life." },
                  { title: "Red light included", text: "Every session includes complimentary red light therapy." },
                ].map((item) => (
                  <li key={item.title} className="relative bg-foreground/5 border border-foreground/15 p-6">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-foreground/30" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-foreground/30" />
                    <h3 className="text-lg font-light tracking-wide text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-10 text-center text-muted-foreground">
              Received a gift card?{" "}
              <a href="/redeem-gift-card" className="underline hover:text-foreground">
                Redeem it here
              </a>{" "}
              · New to contrast therapy?{" "}
              <a href="/your-visit" className="underline hover:text-foreground">
                See what to expect
              </a>
            </p>
          </div>
        </section>

        <FAQSection
          faqs={giftCardFaqs}
          title="Gift Card FAQs"
          subtitle="Common questions about purchasing and using gift cards."
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default GiftCards;
