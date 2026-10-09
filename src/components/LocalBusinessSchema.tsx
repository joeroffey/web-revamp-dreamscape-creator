import { Helmet } from "react-helmet-async";
import {
  ADDRESS,
  BUSINESS_ID,
  DEFAULT_OG_IMAGE,
  EMAIL,
  FACEBOOK_URL,
  GOOGLE_MAPS_URL,
  INSTAGRAM_URL,
  LOGO_URL,
  PHONE_TEL,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
} from "@/lib/site";

/**
 * Business + website structured data. Rendered once per page from the footer,
 * so every public page carries the same business node (referenced elsewhere by
 * its @id, e.g. as the publisher of journal posts).
 */
export const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["HealthAndBeautyBusiness", "DaySpa"],
        "@id": BUSINESS_ID,
        name: SITE_NAME,
        description:
          "Contrast therapy centre in Lymington, Hampshire with two ice baths (3–7°C), an eight-person traditional sauna (85–90°C) and complimentary red light therapy with every one-hour session.",
        url: SITE_URL,
        telephone: PHONE_TEL,
        email: EMAIL,
        logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
        image: [
          DEFAULT_OG_IMAGE,
          `${SITE_URL}/images/e66be255-48c0-42a2-92bb-1f189a14976d.webp`,
          `${SITE_URL}/images/8e9e8578-24af-421e-9d1c-3b71d4e13523.webp`,
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: `${ADDRESS.line1}, ${ADDRESS.line2}`,
          addressLocality: ADDRESS.town,
          addressRegion: ADDRESS.county,
          postalCode: ADDRESS.postcode,
          addressCountry: "GB",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 50.7702,
          longitude: -1.5474,
        },
        hasMap: GOOGLE_MAPS_URL,
        areaServed: [
          "Lymington",
          "New Forest",
          "Milford on Sea",
          "Brockenhurst",
          "New Milton",
          "Christchurch",
        ].map((name) => ({ "@type": "Place", name })),
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            opens: "08:30",
            closes: "20:00",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Sunday",
            opens: "08:30",
            closes: "17:30",
          },
        ],
        priceRange: "££",
        currenciesAccepted: "GBP",
        sameAs: [INSTAGRAM_URL, FACEBOOK_URL, GOOGLE_MAPS_URL],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Contrast Therapy Services",
          itemListElement: [
            {
              "@type": "Offer",
              url: `${SITE_URL}/booking`,
              itemOffered: {
                "@type": "Service",
                name: "Contrast Therapy Session",
                description: "One-hour communal or private ice bath and sauna session",
              },
            },
            {
              "@type": "Offer",
              url: `${SITE_URL}/memberships`,
              itemOffered: {
                "@type": "Service",
                name: "Membership Plans",
                description: "Monthly contrast therapy membership plans",
              },
            },
            {
              "@type": "Offer",
              url: `${SITE_URL}/gift-cards`,
              itemOffered: {
                "@type": "Service",
                name: "Gift Cards",
                description: "Digital gift cards for contrast therapy sessions",
              },
            },
            {
              "@type": "Offer",
              url: `${SITE_URL}/red-light-therapy`,
              itemOffered: {
                "@type": "Service",
                name: "Red Light Therapy",
                description: "Complimentary red light therapy included with every session",
              },
            },
          ],
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "en-GB",
        publisher: { "@id": BUSINESS_ID },
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
