import { Helmet } from "react-helmet-async";
import { BUSINESS_ID, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, WEBSITE_ID } from "@/lib/site";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  robots?: string;
  ogType?: string;
  /** Shortcut for robots="noindex,follow" */
  noindex?: boolean;
  /** Extra Open Graph article meta for blog posts */
  article?: {
    publishedTime?: string | null;
    modifiedTime?: string | null;
  };
}

const HOME_TITLE = "Ice Bath & Sauna Lymington | Contrast Therapy | Revitalise Hub";

/**
 * Builds the final <title>. The brand is only appended when it isn't already
 * in the title and the result stays a sensible length (~60 characters), so we
 * never end up with "… - Revitalise Hub Journal | Revitalise Hub".
 */
export const buildTitle = (title: string) => {
  if (title === "Home") return HOME_TITLE;
  if (/revitalise hub/i.test(title)) return title;
  const withBrand = `${title} | ${SITE_NAME}`;
  return withBrand.length <= 65 ? withBrand : title;
};

export const SEOHead = ({
  title,
  description,
  path = "/",
  ogImage = DEFAULT_OG_IMAGE,
  robots,
  ogType = "website",
  noindex = false,
  article,
}: SEOHeadProps) => {
  const fullTitle = buildTitle(title);
  const url = `${SITE_URL}${path}`;
  const robotsContent = robots ?? (noindex ? "noindex,follow" : "index,follow,max-image-preview:large");
  const isDefaultImage = ogImage === DEFAULT_OG_IMAGE;
  // A WebPage node for every indexable page, tied to the site and business nodes
  // output by <LocalBusinessSchema/> in the footer.
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: fullTitle,
    description,
    inLanguage: "en-GB",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": BUSINESS_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: ogImage },
  };

  return (
    <Helmet>
      <html lang="en-GB" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent} />
      {!noindex && <link rel="canonical" href={url} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_GB" />
      <meta property="og:image" content={ogImage} />
      {isDefaultImage && <meta property="og:image:width" content="1200" />}
      {isDefaultImage && <meta property="og:image:height" content="630" />}
      <meta property="og:image:alt" content={fullTitle} />
      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {!noindex && <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>}
    </Helmet>
  );
};
