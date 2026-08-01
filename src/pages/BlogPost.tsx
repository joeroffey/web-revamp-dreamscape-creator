import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { BlogBlock, contentToBlocks, isBlocksArray } from "@/lib/blogBlocks";
import { BlogBlocksRenderer } from "@/components/blog/BlogBlocks";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  content_blocks: BlogBlock[] | null;
  excerpt: string | null;
  image_url: string | null;
  published_at: string | null;
}

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        content_blocks: isBlocksArray((data as any).content_blocks)
          ? ((data as any).content_blocks as BlogBlock[])
          : null,
      } as BlogPost;
    },
    enabled: !!id,
  });

  const blocks: BlogBlock[] = post
    ? post.content_blocks && post.content_blocks.length > 0
      ? post.content_blocks
      : contentToBlocks(post.content)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post ? `${post.title} - Revitalise Hub Journal` : "Article - Revitalise Hub Journal"}
        description={post?.excerpt || "Insights from the Revitalise Hub team on contrast therapy and recovery."}
        path={`/blog/${id}`}
      />
      <Navigation />

      <main className="pt-32 pb-20">
        <article className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" /> Back to journal
            </Link>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : !post ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-6">This article could not be found.</p>
                <Link to="/blog" className="underline">Browse all articles</Link>
              </div>
            ) : (
              <>
                <header className="space-y-4 mb-10">
                  {post.published_at && (
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {format(new Date(post.published_at), "MMMM d, yyyy")}
                    </span>
                  )}
                  <h1 className="text-4xl md:text-5xl font-light tracking-wide leading-tight">
                    {post.title}
                  </h1>
                  {post.excerpt && (
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </header>

                {post.image_url && (
                  <div className="aspect-[16/9] overflow-hidden rounded-2xl mb-10">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <BlogBlocksRenderer blocks={blocks} />

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
              </>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
