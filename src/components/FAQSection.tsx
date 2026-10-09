import { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  title?: string;
  subtitle?: string;
  /** If true, only renders the JSON-LD schema without visible UI */
  schemaOnly?: boolean;
}

export const FAQSection = ({ faqs, title = "Frequently Asked Questions", subtitle, schemaOnly = false }: FAQSectionProps) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  if (schemaOnly) {
    return (
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>
    );
  }

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <section className="rh-faq py-20 bg-muted/20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground text-base md:text-lg">{subtitle}</p>
            )}
          </div>

          <Card className="wellness-card">
            <CardContent className="px-5 py-2 sm:px-8 sm:py-4">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} className="last:border-b-0">
                    <AccordionTrigger className="gap-4 py-5 text-left text-base md:text-[1.0625rem] font-normal text-foreground hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    {/* forceMount keeps answers in the page HTML (hidden until opened) so
                        search engines and AI crawlers can read them */}
                    <AccordionContent forceMount className="pb-5 pr-8">
                      <p className="text-muted-foreground text-[0.9375rem] md:text-base leading-relaxed">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};
