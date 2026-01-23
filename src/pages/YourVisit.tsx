import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ClipboardList,
  DoorOpen,
  Footprints,
  Info,
  Timer,
  Thermometer,
  Snowflake,
} from "lucide-react";
import { Link } from "react-router-dom";

const YourVisit = () => {
  const heroImages = [
    { src: "/visit/DSC09637.jpg", alt: "Revitalise Hub ice bath recovery" },
    { src: "/visit/DSC09659.jpg", alt: "Revitalise Hub sauna experience" },
    { src: "/visit/DSC09792.jpg", alt: "Revitalise Hub reception and check-in" },
  ];

  const whoItsFor = [
    {
      title: "Gym-goers & athletes",
      description:
        "Support recovery, reduce muscle soreness, and improve performance.",
    },
    {
      title: "Busy professionals",
      description: "Switch off, de-stress, and reset both mentally and physically.",
    },
    {
      title: "Aches, stiffness, or fatigue",
      description: "A low-impact recovery solution that helps you feel better.",
    },
    {
      title: "First-timers",
      description:
        "A guided, supportive introduction to sauna and cold exposure (no pressure).",
    },
    {
      title: "Wellbeing-focused individuals",
      description:
        "Prioritise stress relief, circulation, and overall health with contrast therapy.",
    },
  ];

  const etiquette = [
    "Remove shoes before entering the hub space",
    "Bring swimwear and a towel (or collect one at reception)",
    "Keep noise levels calm and respectful",
    "Be mindful of time spent in shared facilities",
    "Shower or rinse if required before entering the ice baths",
    "Always listen to your body and step out if needed",
  ];

  const steps = [
    {
      icon: DoorOpen,
      title: "Arrival & welcome",
      body:
        "You’ll be welcomed at reception by a member of our team. First-time visitors complete a short health questionnaire so your session is safe and tailored to you. Forgot your towel? Just ask — we’ve got you.",
    },
    {
      icon: Footprints,
      title: "Shoes off policy",
      body:
        "Before entering the main hub space, please remove your shoes and leave them outside. This keeps the environment clean, hygienic, and relaxing for everyone.",
    },
    {
      icon: ClipboardList,
      title: "Tour, safety & best practice",
      body:
        "We’ll give you a quick tour and clear guidance on safe ice bath use, sauna best practice, and recommended timings based on your experience level. If you’re new, everything is explained and there’s no pressure to push beyond what feels comfortable.",
    },
    {
      icon: Info,
      title: "Facilities at the hub",
      body:
        "Two ice baths (3°C–7°C), sauna (85°C–90°C), two timers by the ice baths, private changing rooms, and on-site bathroom facilities.",
      highlights: [
        { icon: Snowflake, label: "Ice Baths", value: "2 baths • 3–7°C" },
        { icon: Thermometer, label: "Sauna", value: "85–90°C" },
        { icon: Timer, label: "Timers", value: "2 timers by ice baths" },
      ],
    },
    {
      icon: CheckCircle2,
      title: "Get changed & start your session",
      body:
        "Head to the changing rooms when you’re ready. Each session lasts 1 hour, giving you time to relax and enjoy the full experience. Most guests alternate between sauna and ice baths throughout their session, moving at a pace that suits their body and goals.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-5xl font-light text-foreground mb-6 tracking-tight">
                Your Visit to Revitalise Hub: What to Expect
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light">
                Welcome to Revitalise Hub, a premium sauna and ice bath recovery space designed to help you relax,
                recover, and reset. Whether it’s your first visit or you’re a regular, this guide walks you through
                exactly what to expect when you arrive.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
                <Badge variant="secondary">Calm • Clean • Supportive</Badge>
                <Badge variant="secondary">Guided for first-timers</Badge>
                <Badge variant="secondary">1-hour sessions</Badge>
              </div>
              <div className="mt-10 flex items-center justify-center">
                <Link to="/booking">
                  <Button className="rounded-full px-8">Book a Session</Button>
                </Link>
              </div>
            </div>

            {/* Image grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {heroImages.map((img) => (
                <div
                  key={img.src}
                  className="rounded-2xl overflow-hidden shadow-sm border border-border bg-muted"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-72 md:h-80 object-cover object-[70%_center]"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-20 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-light text-foreground mb-4 tracking-tight">
                Who Revitalise Hub Is For
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto font-light text-lg">
                Revitalise Hub is designed for anyone looking to improve recovery, relaxation, and overall wellbeing.
                You don’t need prior experience — sessions are guided and tailored to your comfort level.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whoItsFor.map((item) => (
                <Card key={item.title} className="wellness-card">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Etiquette */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1">
                <h2 className="text-2xl md:text-4xl font-light text-foreground mb-4 tracking-tight">
                  Etiquette Summary
                </h2>
                <p className="text-muted-foreground font-light text-lg leading-relaxed">
                  To help everyone enjoy their time, we ask all guests to follow a few simple guidelines.
                  Our team is on hand if you have questions or need guidance.
                </p>
              </div>
              <Card className="wellness-card lg:col-span-2">
                <CardContent className="p-6">
                  <ul className="grid sm:grid-cols-2 gap-4">
                    {etiquette.map((rule) => (
                      <li key={rule} className="flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20 bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-light text-foreground mb-4 tracking-tight">
                Your Session, Step by Step
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto font-light text-lg">
                From check-in to your first round of contrast therapy, here’s how your visit flows.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <Card key={step.title} className="wellness-card">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary">Step {idx + 1}</Badge>
                            <h3 className="text-lg font-semibold">{step.title}</h3>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                          {step.highlights && (
                            <div className="mt-5 grid sm:grid-cols-3 gap-3">
                              {step.highlights.map((h) => {
                                const HIcon = h.icon;
                                return (
                                  <div
                                    key={h.label}
                                    className="rounded-xl border border-border bg-white/60 p-4"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <HIcon className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">{h.label}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{h.value}</div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-10">
              <Card className="wellness-card">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">During your session</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Keep noise levels calm and respectful, be mindful of shared space and timings, and listen to your
                    body — step out whenever needed. Our team is always nearby if you have questions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-4xl font-light text-foreground mb-4 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground font-light text-lg">
                Helpful guidance for beginners and regulars.
              </p>
            </div>

            <Card className="wellness-card">
              <CardContent className="p-2 sm:p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="ice-time">
                    <AccordionTrigger>How long should I stay in the ice bath?</AccordionTrigger>
                    <AccordionContent>
                      We recommend starting with 1–3 minutes. For most people, around 3 minutes is enough to gain the
                      benefits of cold exposure. The maximum recommended time is 10 minutes. Always listen to your body
                      and exit if you feel uncomfortable.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sauna-time">
                    <AccordionTrigger>How long should I stay in the sauna?</AccordionTrigger>
                    <AccordionContent>
                      For optimal health and recovery benefits, we recommend 5–20 minutes. Beginners may prefer shorter
                      durations, while experienced users can build up gradually over time.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="alternations">
                    <AccordionTrigger>How many times should I alternate between sauna and ice bath?</AccordionTrigger>
                    <AccordionContent>
                      There’s no strict rule. Most guests alternate 2–4 rounds, depending on how their body feels and how
                      much time they have within the 1-hour session.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="gym">
                    <AccordionTrigger>Can I use the sauna and ice baths if I train at the gym?</AccordionTrigger>
                    <AccordionContent>
                      Yes — sauna and ice bath therapy can be a great addition to training. Many people use the hub after
                      strength training, cardio, or sport to support recovery, reduce muscle soreness, and promote
                      relaxation. If your primary goal is muscle growth, consider using ice baths strategically and not
                      immediately after every heavy lifting session.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="first-timers">
                    <AccordionTrigger>Is this suitable for first-timers?</AccordionTrigger>
                    <AccordionContent>
                      Absolutely. Revitalise Hub is beginner-friendly, and our team will guide you through everything on
                      your first visit so you feel confident and comfortable.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="bring">
                    <AccordionTrigger>Do I need to bring anything with me?</AccordionTrigger>
                    <AccordionContent>
                      We recommend bringing swimwear and a towel. If you forget your towel, we have towels available at the
                      hub — just ask at reception.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <div className="mt-10 text-center">
              <p className="text-muted-foreground font-light mb-4">
                Ready to relax, recover, and reset?
              </p>
              <Link to="/booking">
                <Button className="rounded-full px-8">Book Your Visit</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default YourVisit;
