import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Events = () => {
  const somaBreathworkDates = [
    "1st February",
    "22nd February",
    "15th March",
    "12th April",
    "26th April",
    "10th May",
    "24th May",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-wide">
              Events at Revitalise Hub | Lymington
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Guided experiences combining movement, breath, recovery, and contrast therapy.
            </p>
          </div>
        </section>

        {/* About Our Events */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-light mb-8 tracking-wide">
                About Our Events
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Our events at Revitalise Hub in Lymington bring together expert-led practices and contrast therapy in a calm, supportive environment.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Each event is thoughtfully structured and may include guided movement, breathwork, or education, followed by sauna and ice bath contrast therapy. Events vary in focus but share the same intention: supporting recovery, nervous system regulation, and overall wellbeing.
              </p>
            </div>
          </div>
        </section>

        {/* Location Banner */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">Revitalise Hub, 7 Ensign Yard, 670 Ampress Ln, Lymington SO41 8QY</span>
            </div>
          </div>
        </section>

        {/* Upcoming Events Header */}
        <section className="pt-16 pb-8">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-light tracking-wide">
              Upcoming Events
            </h2>
          </div>
        </section>

        {/* Event 1: Soma Breathwork */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
                <div className="space-y-6">
                  <h3 className="text-2xl md:text-3xl font-light tracking-wide">
                    Soma Breathwork & Contrast Therapy Workshop
                  </h3>
                  <p className="text-lg text-muted-foreground italic">With Emma</p>
                  <p className="text-xl font-light text-foreground">
                    A Deeply Restorative Mind–Body Experience
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Join us at Revitalise Hub for a nourishing Soma Breathwork & Contrast Therapy workshop designed to help you reset your nervous system, reconnect with your body, and restore balance from the inside out.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    This immersive experience combines guided breathwork with sauna and ice bath contrast therapy, leaving you feeling calm, grounded, and renewed.
                  </p>
                </div>
                <div className="aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl">
                  <img 
                    src="/events/breathwork-session.jpg" 
                    alt="Soma Breathwork session at Revitalise Hub"
                    className="w-full h-full object-cover object-[center_30%]"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="bg-muted/30 rounded-2xl p-8 mb-12">
                <h4 className="text-xl font-light mb-6 text-center">Upcoming Dates</h4>
                <p className="text-center text-muted-foreground mb-6 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  All sessions begin at 3:15pm
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {somaBreathworkDates.map((date) => (
                    <div 
                      key={date}
                      className="flex items-center gap-2 bg-background rounded-full px-4 py-2 border border-border"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-light">{date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What is Soma Breathwork */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl order-2 md:order-1">
                  <img 
                    src="/events/breathwork-setup.jpg" 
                    alt="Breathwork setup with mats and candles"
                    className="w-full h-full object-cover object-[center_40%]"
                  />
                </div>
                <div className="space-y-6 order-1 md:order-2">
                  <h4 className="text-xl md:text-2xl font-light tracking-wide">
                    What Is Soma Breathwork?
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Soma Breathwork is a guided breathing practice combining rhythmic breathing, breath retention, visualisation, affirmations, and music.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    This method supports nervous system regulation while also enhancing energy, focus, and emotional balance. Emma's gentle and empowering guidance creates a safe, supportive space to fully relax and drop into the experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto border-t border-border" />
        </div>

        {/* Event 2: Hot Yoga */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
                <div className="aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl">
                  <img 
                    src="/events/yoga-class.jpg" 
                    alt="Hot Yoga class at Revitalise Hub"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div className="space-y-6">
                  <h3 className="text-2xl md:text-3xl font-light tracking-wide">
                    Hot Yoga + Contrast Therapy
                  </h3>
                  <p className="text-lg text-muted-foreground italic">With Chloe</p>
                  <p className="text-muted-foreground leading-relaxed">
                    A guided hot yoga session focused on mobility, strength, and mindful movement, followed by sauna and ice bath contrast therapy.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Step into a revitalising Hot Yoga & Contrast Therapy workshop designed to support mindful movement, physical release, and deep restoration. This experience helps you slow down, tune into your body, and leave feeling refreshed and energised.
                  </p>
                </div>
              </div>

              {/* Hot Yoga Details */}
              <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
                <div className="space-y-6">
                  <h4 className="text-xl md:text-2xl font-light tracking-wide">
                    Hot Yoga: Heated Flow Practice
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Hot yoga is a mindful movement practice performed in a warm environment to support flexibility, mobility, and strength.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The heat helps release tension, improve circulation, and encourage presence and focus. Chloe's grounded, supportive teaching style makes the session accessible for all levels, with space to move at your own pace.
                  </p>
                </div>
                <div className="aspect-[3/4] md:aspect-square overflow-hidden rounded-2xl">
                  <img 
                    src="/events/yoga-pose.jpg" 
                    alt="Yoga pose demonstration"
                    className="w-full h-full object-cover object-[center_60%]"
                  />
                </div>
              </div>

              {/* Contrast Therapy Info */}
              <div className="bg-muted/30 rounded-2xl p-8 mb-12">
                <h4 className="text-xl font-light mb-4 text-center">
                  Contrast Therapy for Recovery & Resilience
                </h4>
                <p className="text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
                  After yoga, you'll transition into sauna and ice bath contrast therapy. This supports recovery, reduces muscle soreness, and helps regulate the nervous system — leaving you calm, clear, and rebalanced.
                </p>
              </div>

              {/* Hot Yoga Date */}
              <div className="bg-muted/30 rounded-2xl p-8">
                <h4 className="text-xl font-light mb-6 text-center">Upcoming Date</h4>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 bg-background rounded-full px-6 py-3 border border-border">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="font-light">7th February</span>
                    <Clock className="h-5 w-5 text-muted-foreground ml-4" />
                    <span className="font-light">1pm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Booking CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl md:text-3xl font-light mb-6 tracking-wide">
              Ready to Join Us?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get in touch to book your place at one of our upcoming events. We'd love to welcome you to the Revitalise Hub community.
            </p>
            <Link to="/contact">
              <Button size="lg" className="rounded-full px-8">
                Book Your Place
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Events;
