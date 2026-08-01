import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  robots?: string;
  ogType?: string;
}

export const SEOHead = ({
  title,
  description,
  path = "/",
  ogImage = "https://www.revitalisehub.co.uk/images/7213f936-2c10-4a80-a628-96054c5c6507.png",
  robots = "index,follow",
  ogType = "website",
}: SEOHeadProps) => {
  const fullTitle = title === "Home"
    ? "Revitalise Hub | Cold Water & Contrast Therapy | Lymington"
    : `${title} | Revitalise Hub`;
  const url = `https://www.revitalisehub.co.uk${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Revitalise Hub" />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};
