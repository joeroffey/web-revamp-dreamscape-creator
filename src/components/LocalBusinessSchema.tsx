import { Helmet } from "react-helmet-async";

export const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": "https://www.revitalisehub.co.uk/#business",
    "name": "Revitalise Hub",
    "description": "Premium cold water immersion, contrast therapy, saunas and recovery sessions in Lymington, Hampshire.",
    "url": "https://www.revitalisehub.co.uk",
    "telephone": "01590698691",
    "email": "info@revitalisehub.co.uk",
    "logo": "https://www.revitalisehub.co.uk/favicon.png",
    "image": [
      "https://www.revitalisehub.co.uk/images/7213f936-2c10-4a80-a628-96054c5c6507.png",
      "https://www.revitalisehub.co.uk/images/e66be255-48c0-42a2-92bb-1f189a14976d.png",
      "https://www.revitalisehub.co.uk/images/8e9e8578-24af-421e-9d1c-3b71d4e13523.png"
    ],
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
    "hasMap": "https://maps.google.com/?q=Revitalise+Hub,+Unit+7,+Ensign+Yard,+670+Ampress+Ln,+Lymington+SO41+8QY",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 50.7572,
        "longitude": -1.5369
      },
      "geoRadius": "30000"
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
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Red Light Therapy",
            "description": "Complimentary red light therapy included with every session"
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
