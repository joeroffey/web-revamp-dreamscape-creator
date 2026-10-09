import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BLOG_LIST_COLUMNS, BlogPostSummary, blogPostPath, getCardExcerpt } from "@/lib/blogPosts";

/** Latest journal articles — gives every post more internal links than just /blog. */
export const LatestPostsSection = ({
  title = "FROM THE JOURNAL",
  limit = 3,
}: {
  title?: string;
  limit?: number;
}) => {
  const { data: posts } = useQuery({
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

  const latest = (posts ?? []).slice(0, limit);
  if (latest.length === 0) return null;

  return (
    <section className="py-24 bg-background" aria-labelledby="journal-heading">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 id="journal-heading" className="text-4xl md:text-6xl font-bold text-foreground tracking-wider mb-4">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Practical, evidence-informed guides to cold water therapy, sauna and recovery from our team.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {latest.map((post) => (
            <Link
              key={post.id}
              to={blogPostPath(post)}
              className="group relative flex flex-col bg-foreground/5 border border-foreground/15 overflow-hidden transition-all duration-500 hover:bg-foreground/10 hover:border-foreground/25"
            >
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-foreground/30 z-10" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-foreground/30 z-10" />
              {post.image_url ? (
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-muted/40 to-muted" />
              )}
              <div className="p-8 flex flex-col flex-1">
                {post.published_at && (
                  <time
                    dateTime={post.published_at}
                    className="text-muted-foreground text-xs tracking-[0.3em] uppercase mb-3 block"
                  >
                    {format(new Date(post.published_at), "d MMM yyyy")}
                  </time>
                )}
                <h3 className="text-xl md:text-2xl font-light text-foreground mb-3 tracking-wide">{post.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">
                  {getCardExcerpt(post, 150)}
                </p>
                <span className="mt-6 inline-flex items-center gap-3 text-foreground border-b border-foreground/40 pb-1 w-fit group-hover:border-foreground transition-colors duration-300">
                  <span className="text-sm tracking-wider">READ ARTICLE</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/blog"
            className="inline-flex items-center gap-3 text-foreground border-b border-foreground/40 pb-1 hover:border-foreground transition-colors"
          >
            <span className="text-sm tracking-wider">VIEW ALL ARTICLES</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
