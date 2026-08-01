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

      <section className="py-20 bg-muted/20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-light text-foreground mb-4 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground font-light text-lg">{subtitle}</p>
            )}
          </div>

          <Card className="wellness-card">
            <CardContent className="p-2 sm:p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
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
