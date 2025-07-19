import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
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
    images: ["/lovable-uploads/3f5b3af8-dcde-4341-b68a-caf6ed772c1e.png", "/lovable-uploads/4dfd9a96-05b7-459b-b777-9c96aec3003f.png"]
  },
  {
    id: "emily",
    name: "Emily Randell",
    title: "Women's Fitness & Pre/Postnatal Specialist",
    specialties: ["Women's Fitness", "Pre/Postnatal Training", "Nutrition Education"],
    bio: "I'm Emily, an experienced personal trainer turned online coach, passionate about helping women at every stage of life feel strong, confident, and happy in their own bodies and minds.\n\nWith over 5 years of in-person coaching and a specialist qualification in pre and postnatal training, I bring both expertise and empathy to every client journey. I don't believe in diets, instead, I educate my clients on how to fuel their bodies, unlearn toxic food rules, and build a healthy relationship with nutrition that lasts for life.\n\nEvery plan is designed to fit around your lifestyle, so you can still enjoy social events, holidays, and your favourite foods without guilt. Whether you're returning to fitness, chasing a glow-up, or just want to love what you see in the mirror, my coaching combines structure, flexibility, and empowerment so you whatever your goal, you'll be set up for success.",
    images: ["/lovable-uploads/e5bb958f-0a62-45ad-8c9c-dcefc4f82e50.png", "/lovable-uploads/f428a21e-0a4a-4154-ac78-9e17d4a46904.png"]
  },
  {
    id: "ross",
    name: "Ross Fisher",
    title: "Functional Fitness Trainer & Official Hyrox Coach",
    specialties: ["Functional Fitness", "Hyrox Training", "Recovery Methods", "Yoga & Mobility"],
    bio: "As the head coach at Hyrox Training Club Christchurch & a background in swimming and triathlon, Ross brings a functional fitness approach to training.\n\n\"Being a Dad with a 6 month old can make it tricky but I squeeze in quality workouts as and when I can. For me it's always about having a specific intention with each session - training smarter and harder is the only way to hit your goals in this day and age where we are ALL busy.\"\n\n\"Getting a good night's sleep is not always a guarantee for me so that's exactly why I put so much emphasis on recovery methods like contrast therapy. It's literally the best recovery hack and if you're not doing it then you're missing a trick!\"\n\nRoss has a few strings to his bow including a holistic health, lifestyle & nutrition certification, and is also working towards his L4 strength and conditioning qualification… oh and he is also a qualified yoga teacher and animal flow instructor should you be lacking in the flexibility & mobility department.\n\nIf you're looking for a holistic & hybrid approach to training then look no further. Ross is your man.",
    images: ["/lovable-uploads/05b15c5b-db98-4def-88f6-429bf8dbba01.png", "/lovable-uploads/48eb7f4e-7e37-4f1e-8be2-5307d912b288.png"]
  },
  {
    id: "amy",
    name: "Amy Richardson",
    title: "Holistic Coach & Mindset Specialist",
    specialties: ["Holistic Coaching", "Mindset Training", "Chronic Illness Support", "Fat Loss"],
    bio: "Hello All, My name is Amy and own AGPT Coaching. I'm a holistic coach with a personal, adaptable approach, supporting hundreds of clients across all walks of life to create real, lasting change in body, mind, and self belief.\n\nSince launching my coaching business in 2018, I've helped women and men achieve powerful physical results, but the heart of what I do goes deeper than just workouts and calories.\n\nMy focus? Mindset first. Always.\nWhat the mind believes the body achieves. Together, we shift the way you think, feel, and speak to yourself so your goals aren't just achieved… they're sustained.\n\nEvery journey is unique and so is your plan. Whether your goal is fat loss, strength, energy, confidence, chronic illness control or simply feeling like you again, I'll meet you where you are. You'll never be given a generic plan. This is coaching that listens. That adapts. That supports the whole of you.\n\nMy promise? You will feel Fully supported, Fully seen, Fully capable, even when life gets a little messy.\n\nIf you're ready to stop starting over, and want coaching that changes more than just your body. let's go. Your next chapter starts here.",
    images: ["/lovable-uploads/fe479004-3f98-4313-8139-cd56fc0fc351.png", "/lovable-uploads/08e4b0dd-5745-49a2-b9e4-49bb9ddfee94.png"]
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Fitness & Recovery Package
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-muted-foreground">
                8 Weeks to Your Best Self
              </h2>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-8">
                £370
              </div>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12">
                Whether you're looking to build strength, boost energy, improve recovery, or completely transform your body, 
                this all-in-one package combines elite fitness coaching with powerful recovery tools – all in one place.
              </p>
              
              <div className="max-w-4xl mx-auto">
                <img 
                  src="/lovable-uploads/c6e090ae-1284-4412-996c-21d0b99ffa2c.png" 
                  alt="Our Expert Coaching Team"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">What's Included</h2>
              
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
                          <li>• Speed up recovery, reduce inflammation, and boost performance</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Link to="/contact">
                  <Button size="lg" className="text-lg px-8 py-6">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contact Us Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Coaches Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Meet Your Expert Coaches</h2>
              <p className="text-lg text-muted-foreground text-center mb-16 max-w-3xl mx-auto">
                Our team of certified professionals are here to guide you on your fitness journey. 
                Click on any coach to learn more about their expertise and approach.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {coaches.map((coach) => (
                  <Card 
                    key={coach.id} 
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
                    onClick={() => openCoachModal(coach)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square overflow-hidden rounded-t-lg">
                        <img 
                          src={coach.images[0]} 
                          alt={coach.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    Ready to Start? Contact Us Today
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Coach Modal */}
      <Dialog open={!!selectedCoach} onOpenChange={closeCoachModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCoach && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{selectedCoach.name}</DialogTitle>
                <p className="text-lg text-primary font-medium">{selectedCoach.title}</p>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="aspect-square overflow-hidden rounded-lg">
                    <img 
                      src={selectedCoach.images[selectedImageIndex]} 
                      alt={selectedCoach.name}
                      className="w-full h-full object-cover"
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
                            className="w-full h-full object-cover"
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