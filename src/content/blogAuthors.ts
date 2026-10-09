/**
 * Author and medical-review details shown on every journal article and used in
 * the BlogPosting structured data.
 *
 * HOW TO UPDATE
 * - DEFAULT_AUTHOR is used for every post unless a post id is listed in
 *   POST_AUTHORS. Replace it with a named person (e.g. one of the founders) and
 *   their relevant experience/qualifications when you can — Google gives more
 *   weight to health content written by a named, credible author.
 * - MEDICAL_REVIEWER: if a qualified professional (GP, physiotherapist, sports
 *   scientist, nurse…) reviews your articles, fill this in and every post will
 *   show "Medically reviewed by …". Leave it as null until that is genuinely
 *   the case — never list a reviewer who hasn't reviewed the content.
 * - POST_SOURCES: optional list of studies / NHS pages per post id that will be
 *   shown under "Sources & further reading". You can also add sources straight
 *   into a post from the admin blog editor as a paragraph, using
 *   [link text](https://example.com) — links are now rendered on the site.
 */

export interface BlogPerson {
  name: string;
  /** Short credential line, e.g. "Founder, Revitalise Hub" */
  role: string;
  /** Page describing the person (absolute or site path) */
  url: string;
  /** "Person" for a named individual, "Organization" for the team */
  type: "Person" | "Organization";
  bio?: string;
}

export const DEFAULT_AUTHOR: BlogPerson = {
  name: "The Revitalise Hub Team",
  role: "Contrast therapy & recovery specialists in Lymington",
  url: "/about",
  type: "Organization",
  bio: "Revitalise Hub was founded by Lewis and Tommy, two friends with a shared passion for cold water and its ability to reset body and mind. Our team guides guests through their ice bath and sauna sessions at our hub in Lymington, Hampshire.",
};

export const MEDICAL_REVIEWER: BlogPerson | null = null;

export const POST_AUTHORS: Record<string, BlogPerson> = {};

export const POST_SOURCES: Record<string, { title: string; url: string }[]> = {};

export const getPostAuthor = (postId: string) => POST_AUTHORS[postId] ?? DEFAULT_AUTHOR;
