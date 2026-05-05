import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
}

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, excerpt, image_url, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog - Contrast Therapy Insights"
        description="Read the latest insights on cold water therapy, contrast therapy, recovery science and wellness from the Revitalise Hub team."
        path="/blog"
      />
      <Navigation />

      <main className="pt-32 pb-20">
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-wide">
              Revitalise Hub Journal
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Insights, updates, and evidence-informed thoughts on contrast therapy, recovery, and resilience.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : !posts || posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {posts.map((post, idx) => {
                    const reverse = idx % 2 === 1;
                    return (
                      <Link
                        key={post.id}
                        to={`/blog/${post.id}`}
                        className="group relative block bg-foreground/5 border border-foreground/15 rounded-2xl overflow-hidden transition-all hover:bg-foreground/10"
                      >
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-foreground/30 z-10" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-foreground/30 z-10" />
                        <div className={`grid md:grid-cols-2 gap-0 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
                          {post.image_url ? (
                            <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                              <img
                                src={post.image_url}
                                alt={post.title}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[4/3] md:aspect-auto bg-gradient-to-br from-muted/40 to-muted" />
                          )}
                          <div className="p-8 md:p-12 flex flex-col justify-between min-h-[260px]">
                            <div className="space-y-4">
                              {post.published_at && (
                                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                  {format(new Date(post.published_at), "MMMM d, yyyy")}
                                </span>
                              )}
                              <h2 className="text-2xl md:text-3xl font-light tracking-wide text-foreground">
                                {post.title}
                              </h2>
                              {post.excerpt && (
                                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                  {post.excerpt}
                                </p>
                              )}
                            </div>
                            <span className="mt-6 inline-flex items-center gap-3 text-foreground border-b border-foreground/40 pb-1 w-fit group-hover:border-foreground transition-colors">
                              <span className="text-sm tracking-wider">Read article</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="mt-16 p-8 bg-muted/30 rounded-2xl text-center">
                <h3 className="text-xl font-light mb-3">Ready to experience contrast therapy?</h3>
                <p className="text-muted-foreground mb-6">
                  Discover the benefits first-hand at Revitalise Hub, Lymington.
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
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
