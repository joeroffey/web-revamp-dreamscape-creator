import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  content: string;
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
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Blog - Contrast Therapy Insights" description="Read the latest insights on cold water therapy, contrast therapy, recovery science and wellness from the Revitalise Hub team." path="/blog" />
      <Navigation />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-wide">
              Revitalise Hub Journal
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A space for updates, education, and insight into contrast therapy, recovery, and modern wellbeing.
            </p>
          </div>
        </section>

        {/* Subtitle */}
        <section className="py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto italic">
              Insights, updates, and evidence-informed thoughts on contrast therapy, recovery, and resilience.
            </p>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : posts?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
                </div>
              ) : (
                <div className="space-y-16">
                  {posts?.map((post, index) => (
                    <article key={post.id} className="space-y-6">
                      {/* Post Header */}
                      <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-light tracking-wide">
                          {post.title}
                        </h2>
                        {post.published_at && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(post.published_at), "MMMM d, yyyy")}
                          </p>
                        )}
                      </div>

                      {/* Post Image */}
                      {post.image_url && (
                        <div className="aspect-[16/9] overflow-hidden rounded-2xl">
                          <img 
                            src={post.image_url} 
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Post Content */}
                      <div className="prose prose-lg max-w-none">
                        {post.content.split('\n\n').map((paragraph, pIndex) => (
                          <p key={pIndex} className="text-muted-foreground leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {/* Divider (except for last post) */}
                      {index < posts.length - 1 && (
                        <div className="pt-8">
                          <div className="border-t border-border" />
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Links CTA */}
            <div className="mt-16 p-8 bg-muted/30 rounded-2xl text-center max-w-4xl mx-auto">
              <h3 className="text-xl font-light mb-3">Ready to experience contrast therapy?</h3>
              <p className="text-muted-foreground mb-6">Discover the benefits first-hand at Revitalise Hub, Lymington.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/booking" className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
                  Book a Session
                </Link>
                <Link to="/your-visit" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-2.5 rounded-full text-sm font-medium transition-colors">
                  Plan Your Visit
                </Link>
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
