/**
 * Build-time pre-rendering for SEO.
 *
 * Runs after `vite build` (see the "build" script in package.json):
 *   1. Saves the untouched app shell as dist/spa.html. Vercel serves it for
 *      app-only routes (admin, account, booking confirmations…), so those
 *      behave exactly as before.
 *   2. Builds src/entry-server.tsx for Node and renders every public page to
 *      static HTML (dist/about.html, dist/blog/<slug>.html, …) with its own
 *      <title>, meta description, canonical, Open Graph tags and JSON-LD.
 *   3. Writes dist/404.html (served with a real 404 status) and a fresh
 *      dist/sitemap.xml that includes every published blog post.
 *
 * It is deliberately fail-safe: if anything here goes wrong the build still
 * succeeds and the affected pages fall back to the normal client-side app.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SSR_OUT = path.join(ROOT, "node_modules", ".cache", "prerender-ssr");
const SITE_URL = "https://www.revitalisehub.co.uk";

// Fallbacks match src/integrations/supabase/client.ts (public anon key).
const FALLBACK_SUPABASE_URL = "https://ismifvjzvvyleahdmdrz.supabase.co";
const FALLBACK_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbWlmdmp6dnZ5bGVhaGRtZHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MzQ2NTMsImV4cCI6MjA2NzIxMDY1M30.k3K22ghSwneMTfuNX6GRIXbn2RmTSb3nhN2i6ny8l8M";

/** Public, indexable pages: [path, sitemap changefreq, sitemap priority] */
const STATIC_ROUTES = [
  ["/", "weekly", "1.0"],
  ["/booking", "weekly", "0.9"],
  ["/memberships", "monthly", "0.8"],
  ["/about", "monthly", "0.8"],
  ["/our-hub", "monthly", "0.7"],
  ["/your-visit", "monthly", "0.7"],
  ["/red-light-therapy", "monthly", "0.7"],
  ["/gift-cards", "monthly", "0.7"],
  ["/fitness-recovery", "monthly", "0.6"],
  ["/events", "weekly", "0.6"],
  ["/blog", "weekly", "0.7"],
  ["/contact", "monthly", "0.6"],
  ["/privacy-policy", "yearly", "0.2"],
  ["/terms-conditions", "yearly", "0.2"],
  ["/cookie-policy", "yearly", "0.2"],
];

const log = (...args) => console.log("[prerender]", ...args);
const warn = (...args) => console.warn("[prerender] WARNING:", ...args);

async function readEnv() {
  const env = { ...process.env };
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  } catch {
    /* no .env — use fallbacks */
  }
  return {
    url: env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL,
    key: env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_KEY,
  };
}

async function fetchRows(env, query) {
  const res = await fetch(`${env.url}/rest/v1/${query}`, {
    headers: { apikey: env.key, Authorization: `Bearer ${env.key}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${query}`);
  return res.json();
}

const fileForRoute = (route) =>
  route === "/" ? path.join(DIST, "index.html") : path.join(DIST, `${route.replace(/^\//, "")}.html`);

const escapeXml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const serializeState = (state) =>
  JSON.stringify(state)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

function injectPage(template, { html, head, htmlAttributes, state, withState }) {
  let page = template
    // The page's own tags (from <SEOHead/>) replace the generic defaults.
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/i, "");

  if (htmlAttributes) page = page.replace(/<html[^>]*>/i, `<html ${htmlAttributes}>`);
  page = page.replace("</head>", `${head}\n  </head>`);

  // The homepage video is created by the app exactly as before once it loads;
  // leaving it out of the static snapshot avoids downloading it twice.
  const body = html.replace(/<video\b[\s\S]*?<\/video>/gi, "");
  const stateScript = withState
    ? `<script>window.__RH_QUERY_STATE__=${serializeState(state)}</script>`
    : "";
  return page.replace('<div id="root"></div>', `<div id="root">${body}</div>${stateScript}`);
}

async function writeFileSafe(file, contents) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, contents);
}

function buildSitemap(blogEntries) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = STATIC_ROUTES.map(
    ([route, changefreq, priority]) =>
      `  <url>\n    <loc>${SITE_URL}${route}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  );
  for (const { slug, post } of blogEntries) {
    const lastmod = (post.updated_at || post.published_at || post.created_at || today).slice(0, 10);
    urls.push(
      `  <url>\n    <loc>${SITE_URL}/blog/${escapeXml(slug)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

async function main() {
  const templatePath = path.join(DIST, "index.html");
  const template = await fs.readFile(templatePath, "utf8");

  // 1. App shell for client-only routes — written first so routing can never break.
  await fs.writeFile(path.join(DIST, "spa.html"), template);
  await fs.writeFile(path.join(DIST, "404.html"), template);

  // 2. Build the server renderer.
  let ssr;
  try {
    const { build } = await import("vite");
    await build({
      configFile: path.join(ROOT, "vite.config.ts"),
      mode: "production",
      logLevel: "warn",
      // Bundle dependencies into the server build so CommonJS packages
      // (e.g. react-helmet-async) work under Node's ESM loader.
      ssr: { noExternal: true },
      build: {
        ssr: "src/entry-server.tsx",
        outDir: SSR_OUT,
        emptyOutDir: true,
      },
    });
    ssr = await import(pathToFileURL(path.join(SSR_OUT, "entry-server.js")).href);
  } catch (error) {
    warn("could not build the server renderer — pages will render client-side only.", error);
    await fs.writeFile(path.join(DIST, "sitemap.xml"), buildSitemap([]));
    return;
  }

  // 3. Data that lives in Supabase (published blog posts and events).
  const env = await readEnv();
  let blog = null;
  let events = null;
  try {
    const rows = await fetchRows(env, "blog_posts?select=*&is_published=eq.true&order=published_at.desc");
    blog = ssr.buildBlogSeed(rows);
    log(`fetched ${rows.length} published blog posts`);
  } catch (error) {
    warn("could not load blog posts — /blog pages will render client-side.", error.message);
  }
  try {
    events = await fetchRows(env, "events?select=*&is_published=eq.true&order=display_order.asc");
    log(`fetched ${events.length} published events`);
  } catch (error) {
    warn("could not load events — /events will render client-side.", error.message);
  }

  const blogListSeed = blog ? [[["blog-posts"], blog.list]] : [];
  const jobs = [];
  for (const [route] of STATIC_ROUTES) {
    if (route === "/blog" && !blog) continue;
    if (route === "/events" && !events) continue;
    let seed = [];
    if (route === "/" || route === "/blog") seed = blogListSeed;
    if (route === "/events") seed = [[["events-published"], events]];
    jobs.push({ route, seed, file: fileForRoute(route) });
  }
  for (const { slug, post } of blog?.entries ?? []) {
    jobs.push({
      route: `/blog/${slug}`,
      seed: [...blogListSeed, [["blog-post", slug], post]],
      file: path.join(DIST, "blog", `${slug}.html`),
    });
  }

  // 4. Render.
  let ok = 0;
  for (const job of jobs) {
    try {
      const result = ssr.render(job.route, job.seed);
      if (!result.html || result.html.length < 200) throw new Error("empty render");
      await writeFileSafe(job.file, injectPage(template, { ...result, withState: job.seed.length > 0 }));
      ok++;
    } catch (error) {
      warn(`failed to render ${job.route} — it will render client-side.`, error);
    }
  }

  try {
    const result = ssr.render("/__page-not-found__", []);
    await fs.writeFile(path.join(DIST, "404.html"), injectPage(template, { ...result, withState: false }));
  } catch (error) {
    warn("failed to render the 404 page — using the app shell.", error);
  }

  await fs.writeFile(path.join(DIST, "sitemap.xml"), buildSitemap(blog?.entries ?? []));
  log(`rendered ${ok}/${jobs.length} pages, plus 404.html, spa.html and sitemap.xml`);
}

main()
  .catch((error) => {
    warn("pre-rendering stopped early — the site will still work as a client-side app.", error);
  })
  // The Supabase client keeps timers alive; exit explicitly once done.
  .finally(() => process.exit(0));
