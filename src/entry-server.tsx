/**
 * Build-time entry used ONLY by scripts/prerender.mjs (never shipped to the
 * browser). It renders a public route to static HTML so search engines and AI
 * crawlers receive real content, titles, descriptions, canonicals and schema
 * instead of an empty <div id="root">.
 */
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { AppProviders, AppRoutes } from "./App";
import {
  BlogPostFull,
  BlogPostSummary,
  getBlogSlug,
  normalizeBlogPost,
} from "./lib/blogPosts";
import { ScrollToTop } from "./components/ScrollToTop";

export { getBlogSlug };

export type SeedEntry = [readonly unknown[], unknown];

interface HelmetData {
  toString(): string;
}

interface HelmetServerState {
  title: HelmetData;
  meta: HelmetData;
  link: HelmetData;
  script: HelmetData;
  htmlAttributes: HelmetData;
}

export function render(url: string, seed: SeedEntry[] = []) {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false, gcTime: Infinity } },
  });
  for (const [key, data] of seed) client.setQueryData(key as unknown[], data);

  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <AppProviders client={client} helmetContext={helmetContext}>
      <StaticRouter location={url}>
        <ScrollToTop />
        <AppRoutes />
      </StaticRouter>
    </AppProviders>
  );

  const helmet = helmetContext.helmet;
  const head = helmet
    ? [helmet.title, helmet.meta, helmet.link, helmet.script].map((h) => h.toString()).join("\n")
    : "";

  return {
    html,
    head,
    htmlAttributes: helmet ? helmet.htmlAttributes.toString() : "",
    state: dehydrate(client),
  };
}

/** Shapes raw Supabase rows exactly the way the pages' queries do. */
export function buildBlogSeed(rawPosts: any[]) {
  const posts: BlogPostFull[] = rawPosts.map(normalizeBlogPost);
  const list: BlogPostSummary[] = posts.map(({ id, title, excerpt, image_url, published_at }) => ({
    id,
    title,
    excerpt,
    image_url,
    published_at,
  }));
  const entries = posts.map((post) => ({
    slug: getBlogSlug(post),
    post,
  }));
  return { list, entries };
}
