import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { BookingCards } from "@/components/BookingCards";
import { HomeCTASection } from "@/components/HomeCTASection";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { LocalBusinessSchema } from "@/components/LocalBusinessSchema";
import { HomeIntroSection } from "@/components/HomeIntroSection";
import { GoogleReviewsSection } from "@/components/GoogleReviewsSection";
import { LatestPostsSection } from "@/components/LatestPostsSection";
import { FAQSection } from "@/components/FAQSection";

const homeFaqs = [
  {
    question: "What is contrast therapy?",
    answer:
      "Contrast therapy means alternating between heat and cold. At Revitalise Hub that's our traditional sauna (85–90°C) and two ice baths (3–7°C). Most guests move between the two several times during a one-hour session, at a pace that suits them.",
  },
  {
    question: "Do I need any experience?",
    answer:
      "No. Revitalise Hub is beginner-friendly. On your first visit our team gives you a quick tour, explains safe ice bath and sauna use and suggests timings based on your experience — there's no pressure to push beyond what feels comfortable.",
  },
  {
    question: "What should I bring?",
    answer:
      "Just swimwear and a towel. If you forget your towel, ask at reception. Private changing rooms and bathroom facilities are on site.",
  },
  {
    question: "Is red light therapy included?",
    answer:
      "Yes. Complimentary red light therapy is included with every session at no extra cost, and there's no separate booking needed.",
  },
  {
    question: "Where are you and is there parking?",
    answer:
      "You'll find us at Unit 7, Ensign Yard, 670 Ampress Lane, Lymington SO41 8QY. Free parking is available.",
  },
  {
    question: "Is contrast therapy safe for everyone?",
    answer:
      "Contrast therapy is generally safe for healthy adults. If you have a heart condition, are pregnant or have other health concerns, please speak to your GP before booking. First-time guests complete a short health questionnaire before their session.",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Home"
        description="Contrast therapy in Lymington: two ice baths, an eight-person sauna and free red light therapy with every one-hour session. Book communal or private sessions."
        path="/"
      />
      <LocalBusinessSchema />
      <Navigation />

      <main className="bg-gallery">
        <HeroSection />
        <BookingCards />
        <HomeIntroSection />
        <HomeCTASection />
        <GoogleReviewsSection />
        <PhotoGallery />
        <LatestPostsSection />
        <FAQSection
          faqs={homeFaqs}
          title="Contrast Therapy FAQs"
          subtitle="Quick answers before your first visit."
        />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
