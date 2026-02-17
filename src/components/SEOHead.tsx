import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
}

export const SEOHead = ({ title, description, path = "/" }: SEOHeadProps) => {
  const fullTitle = title === "Home" 
    ? "Revitalise Hub | Cold Water & Contrast Therapy | Lymington"
    : `${title} | Revitalise Hub`;
  const url = `https://www.revitalisehub.co.uk${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
    </Helmet>
  );
};
