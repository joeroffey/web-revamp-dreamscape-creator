// Journal cover images are uploaded to Supabase Storage at full size (often
// 0.7–1.3 MB). Supabase's image transformation endpoint serves a resized,
// compressed copy (WebP for browsers that support it) from the same file, so
// the originals and the admin upload flow stay exactly as they are.

const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

/** Set to false to always serve the original uploads. */
export const IMAGE_TRANSFORMS_ENABLED = true;

/**
 * Returns a resized version of a Supabase Storage image URL. Any other URL
 * (local /images files, external links) is returned unchanged.
 */
export const optimisedImage = (url: string | null | undefined, width: number, quality = 75) => {
  if (!url) return url ?? undefined;
  if (!IMAGE_TRANSFORMS_ENABLED || !url.includes(OBJECT_PATH) || url.includes("?")) return url;
  return `${url.replace(OBJECT_PATH, RENDER_PATH)}?width=${width}&quality=${quality}`;
};
