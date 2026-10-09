import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { JsonLd, breadcrumbSchema } from "@/components/JsonLd";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Clock, Info, ShieldCheck } from "lucide-react";
import { BlogBlocksRenderer } from "@/components/blog/BlogBlocks";
import {
  BLOG_LIST_COLUMNS,
  BLOG_SLUG_OVERRIDES,
  BlogPostFull,
  BlogPostSummary,
  blogPostPath,
  findPostIdBySlug,
  getCardExcerpt,
  getPostBlocks,
  getPostDescription,
  isUuid,
  normalizeBlogPost,
  readingTimeMinutes,
} from "@/lib/blogPosts";
import { MEDICAL_REVIEWER, POST_SOURCES, getPostAuthor } from "@/content/blogAuthors";
import { BUSINESS_ID, DEFAULT_OG_IMAGE, LOGO_URL, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";
import { optimisedImage } from "@/lib/images";

const fetchPostById = async (id: string) => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeBlogPost(data) : null;
};

const fetchPostBySlug = async (slug: string): Promise<BlogPostFull | null> => {
  // Legacy /blog/<uuid> links still resolve (and are then redirected to the slug URL).
  if (isUuid(slug)) return fetchPostById(slug);

  const overrideId = Object.keys(BLOG_SLUG_OVERRIDES).find((id) => BLOG_SLUG_OVERRIDES[id] === slug);
  if (overrideId) return fetchPostById(overrideId);

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title")
    .eq("is_published", true);
  if (error) throw error;
  const id = findPostIdBySlug(slug, data ?? []);
  return id ? fetchPostById(id) : null;
};

const formatDate = (value: string | null | undefined) =>
  value ? format(new Date(value), "d MMMM yyyy") : null;

const BlogPost = () => {
  const { slug = "" } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchPostBySlug(slug),
    enabled: !!slug,
  });

  const { data: allPosts } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(BLOG_LIST_COLUMNS)
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogPostSummary[];
    },
  });

  // Old ID-based URL → permanent home of the article.
  if (post && isUuid(slug)) {
    return <Navigate to={blogPostPath(post)} replace />;
  }

  const canonicalPath = post ? blogPostPath(post) : `/blog/${slug}`;
  const blocks = post ? getPostBlocks(post) : [];
  const author = post ? getPostAuthor(post.id) : null;
  const sources = post ? POST_SOURCES[post.id] ?? [] : [];
  const published = post?.published_at ?? post?.created_at ?? null;
  const modified = post?.updated_at ?? published;
  const showUpdated =
    published && modified && new Date(modified).getTime() - new Date(published).getTime() > 86_400_000;

  const related = (allPosts ?? []).filter((p) => p.id !== post?.id).slice(0, 3);

  return (
    <div className="rh-site min-h-screen bg-background">
      {post ? (
        <>
          <SEOHead
            title={post.title.length > 60 && post.title.includes(":") ? post.title.split(":")[0].trim() : post.title}
            description={getPostDescription(post)}
            path={canonicalPath}
            ogType="article"
            ogImage={post.image_url || DEFAULT_OG_IMAGE}
            article={{ publishedTime: published, modifiedTime: modified }}
          />
          <JsonLd
            data={[
              {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "@id": `${SITE_URL}${canonicalPath}#article`,
                headline: post.title,
                description: getPostDescription(post),
                image: [post.image_url || DEFAULT_OG_IMAGE],
                datePublished: published,
                dateModified: modified,
                inLanguage: "en-GB",
                mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${canonicalPath}` },
                author: {
                  "@type": author!.type,
                  name: author!.name,
                  url: absoluteUrl(author!.url),
                  ...(author!.type === "Person" ? { jobTitle: author!.role } : {}),
                },
                publisher: {
                  "@type": "Organization",
                  "@id": BUSINESS_ID,
                  name: SITE_NAME,
                  logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
                },
                ...(sources.length > 0 ? { citation: sources.map((s) => s.url) } : {}),
              },
              ...(MEDICAL_REVIEWER
                ? [
                    {
                      "@context": "https://schema.org",
                      "@type": "WebPage",
                      "@id": `${SITE_URL}${canonicalPath}`,
                      reviewedBy: {
                        "@type": MEDICAL_REVIEWER.type,
                        name: MEDICAL_REVIEWER.name,
                        url: absoluteUrl(MEDICAL_REVIEWER.url),
                      },
                    },
                  ]
                : []),
              breadcrumbSchema([
                { name: "Home", url: `${SITE_URL}/` },
                { name: "Journal", url: `${SITE_URL}/blog` },
                { name: post.title, url: `${SITE_URL}${canonicalPath}` },
              ]),
            ]}
          />
        </>
      ) : (
        <SEOHead
          title={isLoading ? "Journal" : "Article not found"}
          description="Insights from the Revitalise Hub team on contrast therapy, cold water immersion, sauna and recovery."
          path={canonicalPath}
          noindex
        />
      )}
      <Navigation />

      <main className="rh-main-loose pb-20">
        <article className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link to="/blog" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Journal
                  </Link>
                </li>
              </ol>
            </nav>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : !post ? (
              <div className="text-center py-16">
                <h1 className="text-3xl font-light tracking-tight mb-4">Article not found</h1>
                <p className="text-muted-foreground mb-6">This article may have moved or been unpublished.</p>
                <Link to="/blog" className="underline">Browse all articles</Link>
              </div>
            ) : (
              <>
                <header className="space-y-5 mb-10">
                  <Link to="/blog" className="rh-eyebrow hover:text-foreground transition-colors w-fit">
                    Revitalise Hub Journal
                  </Link>
                  <h1 className="text-[2rem] leading-[1.15] md:text-5xl md:leading-[1.1] font-light tracking-tight text-foreground">
                    {post.title}
                  </h1>
                  {post.excerpt && (
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {getCardExcerpt(post, 320)}
                    </p>
                  )}

                  {/* Byline — who wrote it, when, and (if set) who reviewed it */}
                  <div className="flex flex-col gap-3 border-y border-border py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span>By </span>
                      <Link to={author!.url} className="font-medium text-foreground hover:underline">
                        {author!.name}
                      </Link>
                      <span className="block text-xs">{author!.role}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {published && (
                        <span>
                          Published <time dateTime={published}>{formatDate(published)}</time>
                        </span>
                      )}
                      {showUpdated && modified && (
                        <span>
                          Updated <time dateTime={modified}>{formatDate(modified)}</time>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {readingTimeMinutes(post)} min read
                      </span>
                    </div>
                  </div>
                  {MEDICAL_REVIEWER && (
                    <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Reviewed by{" "}
                      <a href={MEDICAL_REVIEWER.url} className="font-medium text-foreground hover:underline">
                        {MEDICAL_REVIEWER.name}
                      </a>
                      , {MEDICAL_REVIEWER.role}
                    </p>
                  )}
                </header>

                {post.image_url && (
                  <div className="aspect-[16/9] overflow-hidden rounded-2xl mb-10">
                    <img
                      src={optimisedImage(post.image_url, 1400, 80)}
                      alt={post.title}
                      width={1200}
                      height={675}
                      className="w-full h-full object-cover"
                      decoding="async"
                    />
                  </div>
                )}

                <BlogBlocksRenderer blocks={blocks} title={post.title} />

                {sources.length > 0 && (
                  <section className="mt-12" aria-labelledby="sources-heading">
                    <h2 id="sources-heading" className="text-xl font-light tracking-tight mb-4">
                      Sources &amp; further reading
                    </h2>
                    <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
                      {sources.map((s) => (
                        <li key={s.url}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {/* Health disclaimer (YMYL) */}
                <aside className="mt-12 rounded-2xl border border-border bg-muted/30 p-6 text-sm leading-relaxed text-muted-foreground">
                  <p className="mb-2 flex items-center gap-2 font-medium text-foreground">
                    <Info className="w-4 h-4 text-primary" /> Speak to your GP first
                  </p>
                  <p>
                    This article is for general information only and isn&apos;t medical advice. Cold water
                    immersion and sauna aren&apos;t suitable for everyone — if you have a heart or circulation
                    condition, high or low blood pressure, are pregnant, or have any other health concern,
                    please speak to your GP or another qualified health professional before trying them. Every
                    first-time guest at Revitalise Hub completes a short health questionnaire before their session.
                  </p>
                </aside>

                {/* About the author */}
                <section className="mt-8 rounded-2xl border border-border p-6" aria-label="About the author">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">About the author</p>
                  <p className="font-medium text-foreground">{author!.name}</p>
                  {author!.bio && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{author!.bio}</p>}
                  <Link to={author!.url} className="mt-3 inline-block text-sm underline">
                    Meet the team
                  </Link>
                </section>

                <div className="mt-12 p-8 bg-muted/30 rounded-2xl text-center">
                  <h2 className="text-xl font-light mb-3">Ready to experience contrast therapy?</h2>
                  <p className="text-muted-foreground mb-6">
                    Try it for yourself at Revitalise Hub in Lymington — two ice baths, an eight-person sauna and
                    complimentary red light therapy with every session.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link
                      to="/booking"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
                    >
                      Book a Session
                    </Link>
                    <Link
                      to="/your-visit"
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-2.5 rounded-full text-sm font-medium transition-colors"
                    >
                      Plan Your Visit
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </article>

        {post && related.length > 0 && (
          <section className="container mx-auto px-4 mt-20" aria-labelledby="related-heading">
            <div className="max-w-5xl mx-auto">
              <h2 id="related-heading" className="text-2xl md:text-3xl font-light tracking-tight mb-8 text-center">
                More from the journal
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    to={blogPostPath(item)}
                    className="group flex flex-col rounded-2xl border border-foreground/15 bg-foreground/5 overflow-hidden transition-colors hover:bg-foreground/10"
                  >
                    {item.image_url ? (
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={optimisedImage(item.image_url, 800)}
                          alt={item.title}
                          width={800}
                          height={600}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-muted/40 to-muted" />
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-light text-foreground mb-2 leading-snug">{item.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{getCardExcerpt(item, 140)}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm">
                        Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
