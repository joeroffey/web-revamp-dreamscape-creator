import { BlogBlock, contentToBlocks, isBlocksArray } from "@/lib/blogBlocks";

export interface BlogPostSummary {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
}

export interface BlogPostFull extends BlogPostSummary {
  content: string;
  content_blocks: BlogBlock[] | null;
  updated_at?: string | null;
  created_at?: string | null;
}

/** Columns the public journal list needs (shared by /blog, the homepage and related posts). */
export const BLOG_LIST_COLUMNS = "id, title, excerpt, image_url, published_at";

/**
 * Hand-picked short URLs for posts that existed before readable slugs were
 * introduced (keyed by post id). Old /blog/<id> links are 301-redirected to
 * these in vercel.json. New posts get a slug generated from their title.
 */
export const BLOG_SLUG_OVERRIDES: Record<string, string> = {
  "09bec9ea-b1fe-4912-a92c-4d92149e28c7": "cold-water-therapy-arthritis",
  "3979bdbf-d927-4611-bf8c-16290c0a8497": "red-light-infrared-therapy-benefits",
  "47f2e8a5-575d-461a-b615-0f29030cfdff": "what-happens-to-your-body-in-the-heat",
  "dffc3628-20cd-4014-a6ea-c6753fb02411": "cold-water-therapy-benefits",
  "2465ec1e-d155-4b2d-b759-e7b744881309": "how-long-to-stay-in-an-ice-bath",
  "d530b62d-bfad-4020-894d-7104ae771dd3": "ancient-science-of-cold-water-therapy",
  "fe606ebb-392a-444f-b78c-54e76d60e449": "what-is-contrast-therapy",
  "0b7e6ef3-ce79-4557-b38c-e1c325a2b6f3": "cold-exposure-mental-resilience",
  "009f1f63-2804-4b66-91b6-fb68af12d994": "sauna-vs-ice-bath",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string | undefined) => !!value && UUID_RE.test(value);

export const slugify = (text: string, maxLength = 80) => {
  let slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’‘`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^(the|a|an)-/, "");
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    slug = slug.slice(0, slug.lastIndexOf("-") > 20 ? slug.lastIndexOf("-") : maxLength);
  }
  return slug || "post";
};

export const getBlogSlug = (post: { id: string; title: string }) =>
  BLOG_SLUG_OVERRIDES[post.id] ?? slugify(post.title);

export const blogPostPath = (post: { id: string; title: string }) => `/blog/${getBlogSlug(post)}`;

/** Finds the post that owns a slug from a list of (id, title) rows. */
export const findPostIdBySlug = (
  slug: string,
  rows: { id: string; title: string }[]
): string | null => {
  const match = rows.find((row) => getBlogSlug(row) === slug);
  return match ? match.id : null;
};

export const normalizeBlogPost = (raw: any): BlogPostFull => ({
  ...raw,
  content: raw?.content ?? "",
  content_blocks: isBlocksArray(raw?.content_blocks) ? (raw.content_blocks as BlogBlock[]) : null,
});

export const getPostBlocks = (post: BlogPostFull): BlogBlock[] =>
  post.content_blocks && post.content_blocks.length > 0
    ? post.content_blocks
    : contentToBlocks(post.content);

const plainText = (post: BlogPostFull) =>
  getPostBlocks(post)
    .map((b) => (b.type === "paragraph" || b.type === "quote" || b.type === "heading" ? b.text : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

export const countWords = (post: BlogPostFull) =>
  plainText(post).split(" ").filter(Boolean).length;

/** Truncates on a word boundary and adds an ellipsis. */
export const truncate = (text: string, max: number) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : cut.length).replace(/[\s,.;:–-]+$/, "")}…`;
};

/**
 * Meta description for a post: the excerpt (or opening text when the excerpt is
 * missing/too short), kept between roughly 120 and 160 characters.
 */
export const getPostDescription = (post: BlogPostFull) => {
  const excerpt = (post.excerpt || "").replace(/\s+/g, " ").trim();
  if (excerpt.length >= 120) return truncate(excerpt, 158);
  const body = plainText(post);
  const combined = excerpt
    ? `${excerpt}${/[.!?]$/.test(excerpt) ? "" : "."} ${body}`
    : body;
  return truncate(combined || `${post.title} – from the Revitalise Hub journal.`, 158);
};

/** Short excerpt for cards (the stored excerpt can be very long). */
export const getCardExcerpt = (post: BlogPostSummary, max = 180) =>
  post.excerpt ? truncate(post.excerpt, max) : "";

export const readingTimeMinutes = (post: BlogPostFull) =>
  Math.max(1, Math.round(countWords(post) / 220));
