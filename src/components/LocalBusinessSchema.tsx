import { Helmet } from "react-helmet-async";

export const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "name": "Revitalise Hub",
    "description": "Premium cold water immersion, contrast therapy, saunas and recovery sessions in Lymington, Hampshire.",
    "url": "https://www.revitalisehub.co.uk",
    "telephone": "01590698691",
    "email": "info@revitalisehub.co.uk",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Unit 7, Ensign Yard, 670 Ampress Ln",
      "addressLocality": "Lymington",
      "addressRegion": "Hampshire",
      "postalCode": "SO41 8QY",
      "addressCountry": "GB"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 50.7572,
      "longitude": -1.5369
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "08:30",
        "closes": "20:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Sunday",
        "opens": "08:30",
        "closes": "17:30"
      }
    ],
    "priceRange": "££",
    "image": "https://www.revitalisehub.co.uk/lovable-uploads/7213f936-2c10-4a80-a628-96054c5c6507.png",
    "sameAs": [
      "https://www.instagram.com/revitalise.hub",
      "https://www.facebook.com/share/1Ak6ZqBrd1/"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Contrast Therapy Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Contrast Therapy Session",
            "description": "Communal or private ice bath and sauna session"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Membership Plans",
            "description": "Weekly contrast therapy membership packages"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Gift Cards",
            "description": "Gift vouchers for contrast therapy sessions"
          }
        }
      ]
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
