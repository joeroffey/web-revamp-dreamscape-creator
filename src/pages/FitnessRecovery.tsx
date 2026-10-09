import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { FAQSection } from "@/components/FAQSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, User, MessageCircle, Calendar, Snowflake } from "lucide-react";
import { Link } from "react-router-dom";

interface Coach {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  bio: string;
  images: string[];
}

const coaches: Coach[] = [
  {
    id: "harrison",
    name: "Harrison Burgess",
    title: "Hypertrophy Specialist",
    specialties: ["Hypertrophy Training", "Muscle Building", "Mindset Coaching"],
    bio: "I'm Harrison, a dedicated online fitness coach based in Southampton who has built my reputation on unwavering honesty and genuine care for my clients' success. Specialising in hypertrophy training, I understand that building muscle requires more than just lifting weights—it demands a comprehensive approach addressing mindset, consistency, and realistic goal-setting. What sets me apart is my commitment to telling clients exactly what they need to hear, not what they want to hear.\n\nAt the core of my coaching philosophy is the belief that transformation goes far beyond physical changes. Rather than simply providing cookie-cutter meal plans and training programmes, I invest in building deep, meaningful relationships with each client. I focus on helping clients become the best version of themselves, understanding that lasting change comes from addressing the whole person. This personalised approach creates a supportive environment where clients feel genuinely understood and empowered on their fitness journey.",
    images: ["/images/3f5b3af8-dcde-4341-b68a-caf6ed772c1e.webp", "/images/4dfd9a96-05b7-459b-b777-9c96aec3003f.webp"]
  },
  {
    id: "emily",
    name: "Emily Randell",
    title: "Women's Fitness & Pre/Postnatal Specialist",
    specialties: ["Women's Fitness", "Pre/Postnatal Training", "Nutrition Education"],
    bio: "I'm Emily, an experienced personal trainer turned online coach, passionate about helping women at every stage of life feel strong, confident, and happy in their own bodies and minds.\n\nWith over 5 years of in-person coaching and a specialist qualification in pre and postnatal training, I bring both expertise and empathy to every client journey. I don't believe in diets, instead, I educate my clients on how to fuel their bodies, unlearn toxic food rules, and build a healthy relationship with nutrition that lasts for life.\n\nEvery plan is designed to fit around your lifestyle, so you can still enjoy social events, holidays, and your favourite foods without guilt. Whether you're returning to fitness, chasing a glow-up, or just want to love what you see in the mirror, my coaching combines structure, flexibility, and empowerment so you whatever your goal, you'll be set up for success.",
    images: ["/images/e5bb958f-0a62-45ad-8c9c-dcefc4f82e50.webp", "/images/f428a21e-0a4a-4154-ac78-9e17d4a46904.webp"]
  },
  {
    id: "ross",
    name: "Ross Fisher",
    title: "Functional Fitness Trainer & Official Hyrox Coach",
    specialties: ["Functional Fitness", "Hyrox Training", "Recovery Methods", "Yoga & Mobility"],
    bio: "As the head coach at Hyrox Training Club Christchurch & a background in swimming and triathlon, Ross brings a functional fitness approach to training.\n\n\"Being a Dad with a 6 month old can make it tricky but I squeeze in quality workouts as and when I can. For me it's always about having a specific intention with each session - training smarter and harder is the only way to hit your goals in this day and age where we are ALL busy.\"\n\n\"Getting a good night's sleep is not always a guarantee for me so that's exactly why I put so much emphasis on recovery methods like contrast therapy. It's literally the best recovery hack and if you're not doing it then you're missing a trick!\"\n\nRoss has a few strings to his bow including a holistic health, lifestyle & nutrition certification, and is also working towards his L4 strength and conditioning qualification… oh and he is also a qualified yoga teacher and animal flow instructor should you be lacking in the flexibility & mobility department.\n\nIf you're looking for a holistic & hybrid approach to training then look no further. Ross is your man.",
    images: ["/images/05b15c5b-db98-4def-88f6-429bf8dbba01.webp", "/images/48eb7f4e-7e37-4f1e-8be2-5307d912b288.webp"]
  },
  {
    id: "amy",
    name: "Amy Richardson",
    title: "Holistic Coach & Mindset Specialist",
    specialties: ["Holistic Coaching", "Mindset Training", "Chronic Illness Support", "Fat Loss"],
    bio: "Hello All, My name is Amy and own AGPT Coaching. I'm a holistic coach with a personal, adaptable approach, supporting hundreds of clients across all walks of life to create real, lasting change in body, mind, and self belief.\n\nSince launching my coaching business in 2018, I've helped women and men achieve powerful physical results, but the heart of what I do goes deeper than just workouts and calories.\n\nMy focus? Mindset first. Always.\nWhat the mind believes the body achieves. Together, we shift the way you think, feel, and speak to yourself so your goals aren't just achieved… they're sustained.\n\nEvery journey is unique and so is your plan. Whether your goal is fat loss, strength, energy, confidence, chronic illness control or simply feeling like you again, I'll meet you where you are. You'll never be given a generic plan. This is coaching that listens. That adapts. That supports the whole of you.\n\nMy promise? You will feel Fully supported, Fully seen, Fully capable, even when life gets a little messy.\n\nIf you're ready to stop starting over, and want coaching that changes more than just your body. let's go. Your next chapter starts here.",
    images: ["/images/fe479004-3f98-4313-8139-cd56fc0fc351.webp", "/images/08e4b0dd-5745-49a2-b9e4-49bb9ddfee94.webp"]
  }
];

const FitnessRecovery = () => {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const openCoachModal = (coach: Coach) => {
    setSelectedCoach(coach);
    setSelectedImageIndex(0);
  };

  const closeCoachModal = () => {
    setSelectedCoach(null);
    setSelectedImageIndex(0);
  };

  return (
    <div className="rh-site min-h-screen bg-background">
      <SEOHead title="Fitness & Recovery Coaching in Lymington" description="Our 8-week Fitness and Recovery coaching package. Expert-guided training with contrast therapy sessions at Revitalise Hub, Lymington." path="/fitness-recovery" />
      <Navigation />
      
      <main className="rh-main">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/c6e090ae-1284-4412-996c-21d0b99ffa2c.webp"
              alt="Our Expert Coaching Team"
              width={1066}
              height={1600}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/60" />
          </div>
          
          {/* Content */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="rh-display mb-5 text-white drop-shadow-lg">
                Fitness & Recovery Package
              </h1>
              <p className="text-xl md:text-2xl font-light tracking-wide mb-6 text-white/90 drop-shadow-lg">
                8 Weeks to Your Best Self
              </p>
              <div className="text-4xl md:text-5xl font-light text-white mb-8 drop-shadow-lg">
                £370
              </div>
              <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                Whether you're looking to build strength, boost energy, improve recovery, or completely transform your body, 
                this all-in-one package combines elite fitness coaching with powerful recovery tools – all in one place.
              </p>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-center mb-16">What's Included</h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-3">1. Personalised Online Fitness Coaching</h3>
                        <p className="text-muted-foreground">
                          Work 1-on-1 with one of our expert coaches, matched to your goals and preferences. 
                          Our professional team includes specialists in HYROX training, fat loss, functional fitness, and bodybuilding.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-3">2. Tailored Training & Nutrition Plan</h3>
                        <p className="text-muted-foreground">
                          Receive a completely customised training and meal plan, designed around your lifestyle, 
                          body type, and goals. No templates – only what works best for you.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-3">3. Weekly Check-Ins</h3>
                        <p className="text-muted-foreground">
                          Stay accountable and on track with weekly virtual check-ins from your coach. 
                          Adjustments and support every step of the way.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-8 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Snowflake className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-3">4. Unlimited Ice Bath & Sauna Access</h3>
                        <p className="text-muted-foreground mb-4">
                          Recover like a pro with unlimited access to our state-of-the-art contrast therapy facility for 8 full weeks.
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Recommended usage plan tailored to your fitness routine</li>
                          <li>• Built-in recovery time to support your training between sessions</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full">
                  <Link to="/contact">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contact Us Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for + how the 8 weeks work */}
        <section className="py-20 md:py-24 bg-gallery" aria-labelledby="fitness-how-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div className="space-y-5">
                <span className="rh-eyebrow">Who it&apos;s for</span>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight text-foreground">
                  Training and recovery, planned together
                </h2>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  The Fitness &amp; Recovery package is for anyone who wants a clear plan and someone to keep them
                  on track — whether you&apos;re building strength, working on fat loss, preparing for a HYROX race
                  or simply getting fitter. Your coach plans your training and nutrition around your lifestyle, and
                  your recovery happens here at the hub in Lymington.
                </p>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  Because ice bath and sauna access is unlimited for the full eight weeks, recovery becomes part of
                  your routine rather than an afterthought — and complimentary red light therapy is included with
                  every session.
                </p>
              </div>
              <div>
                <h2 id="fitness-how-heading" className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-8">
                  How the eight weeks work
                </h2>
                <ol className="space-y-6">
                  {[
                    {
                      title: "Get matched with a coach",
                      body: "Tell us your goals and we'll pair you with the coach best suited to them — our team covers HYROX training, fat loss, functional fitness and bodybuilding.",
                    },
                    {
                      title: "Receive your personal plan",
                      body: "Your coach builds a training and nutrition plan around your lifestyle and goals, with a recommended recovery routine to match.",
                    },
                    {
                      title: "Train and check in every week",
                      body: "Weekly virtual check-ins keep you accountable, and your plan is adjusted as you progress.",
                    },
                    {
                      title: "Recover at the hub",
                      body: "Use the ice baths and sauna as often as you like for the full eight weeks.",
                    },
                  ].map((step, i) => (
                    <li key={step.title} className="flex gap-5">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-foreground/25 text-sm text-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-lg font-medium text-foreground">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed mt-1">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Coaches Section */}
        <section className="py-20 rh-surface">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight text-center mb-4">Meet Your Expert Coaches</h2>
              <p className="text-lg text-muted-foreground text-center mb-16 max-w-3xl mx-auto">
                Our team of certified professionals are here to guide you on your fitness journey. 
                Click on any coach to learn more about their expertise and approach.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {coaches.map((coach) => (
                  <Card 
                    key={coach.id} 
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 group"
                    onClick={() => openCoachModal(coach)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square overflow-hidden rounded-t-lg">
                        <img 
                          src={coach.images[0]}
                          alt={coach.name}
                          width={800}
                          height={800}
                          loading="lazy"
                          decoding="async"
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                            coach.id === 'amy' ? 'object-[center_20%]' : 'object-center'
                          }`}
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{coach.name}</h3>
                        <p className="text-primary font-medium mb-3">{coach.title}</p>
                        <div className="flex flex-wrap gap-2">
                          {coach.specialties.slice(0, 2).map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {coach.specialties.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{coach.specialties.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-16">
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full">
                  <Link to="/contact">Ready to Start? Contact Us Today</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <FAQSection
          faqs={[
            { question: "How long is the Fitness & Recovery package?", answer: "The package runs for eight weeks, with weekly check-ins from your coach throughout." },
            { question: "How much does it cost?", answer: "£370 for the full eight weeks. That covers 1-on-1 online coaching, your tailored training and nutrition plan, weekly check-ins and unlimited ice bath and sauna access at Revitalise Hub." },
            { question: "Is the coaching online or in person?", answer: "Your coaching, plans and weekly check-ins are delivered online, so they fit around your week. Your recovery sessions take place at the hub in Lymington." },
            { question: "Which coach will I work with?", answer: "We match you with a coach based on your goals and preferences. Our team includes specialists in HYROX training, fat loss, functional fitness and bodybuilding." },
            { question: "Is red light therapy included?", answer: "Yes. Complimentary red light therapy is included with every session at the hub." },
            { question: "How do I get started?", answer: "Get in touch through our contact page and we'll talk through your goals and match you with a coach." },
          ]}
          title="Fitness & Recovery FAQs"
          subtitle="What's included and how the package works."
        />
      </main>

      <Footer />

      {/* Coach Modal */}
      <Dialog open={!!selectedCoach} onOpenChange={closeCoachModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCoach && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-light tracking-tight">{selectedCoach.name}</DialogTitle>
                <p className="text-lg text-primary font-medium">{selectedCoach.title}</p>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={selectedCoach.images[selectedImageIndex]}
                      alt={selectedCoach.name}
                      width={800}
                      height={800}
                      className={`w-full h-full object-cover ${
                        selectedCoach.id === 'amy' ? 'object-[center_20%]' : 'object-center'
                      }`}
                    />
                  </div>
                  {selectedCoach.images.length > 1 && (
                    <div className="flex gap-2">
                      {selectedCoach.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                            selectedImageIndex === index ? 'border-primary' : 'border-muted'
                          }`}
                        >
                          <img 
                            src={image}
                            alt={`${selectedCoach.name} ${index + 1}`}
                            width={160}
                            height={160}
                            className="w-full h-full object-cover object-center"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCoach.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-3">About {selectedCoach.name.split(' ')[0]}</h4>
                    <div className="text-muted-foreground space-y-3">
                      {selectedCoach.bio.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Link to="/contact">
                      <Button className="w-full" onClick={closeCoachModal}>
                        Get Started with {selectedCoach.name.split(' ')[0]}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FitnessRecovery;