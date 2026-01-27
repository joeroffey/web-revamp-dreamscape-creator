import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: "The Science Behind Cold Exposure Therapy",
      excerpt: "Discover the proven health benefits of cold water immersion and how it can transform your recovery routine.",
      date: "Coming Soon",
      readTime: "5 min read",
      category: "Wellness",
      image: "/lovable-uploads/0c9e8b9e-c7cf-48f4-b85b-860370fe6702.png",
    },
    {
      id: 2,
      title: "Maximising Your Sauna Sessions",
      excerpt: "Learn the optimal techniques for heat therapy to enhance circulation and promote deep relaxation.",
      date: "Coming Soon",
      readTime: "4 min read",
      category: "Tips",
      image: "/lovable-uploads/e5bb958f-0a62-45ad-8c9c-dcefc4f82e50.png",
    },
    {
      id: 3,
      title: "Recovery Strategies for Athletes",
      excerpt: "How professional athletes use contrast therapy to speed up recovery and improve performance.",
      date: "Coming Soon",
      readTime: "6 min read",
      category: "Fitness",
      image: "/lovable-uploads/08e4b0dd-5745-49a2-b9e4-49bb9ddfee94.png",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-wide">
              Blog & Insights
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expert tips, wellness insights, and the latest news from Revitalise Hub.
            </p>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-medium group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {post.date}
                      </div>
                      <span className="text-sm font-medium flex items-center group-hover:text-primary transition-colors">
                        Read More
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Coming Soon Notice */}
            <div className="mt-16 text-center">
              <Card className="max-w-2xl mx-auto p-8">
                <h3 className="text-2xl font-light mb-4">More Content Coming Soon</h3>
                <p className="text-muted-foreground mb-6">
                  We're working on bringing you valuable wellness content. Check back soon for articles on recovery, fitness, and healthy living.
                </p>
                <Link to="/contact">
                  <span className="text-primary hover:underline">Get in touch →</span>
                </Link>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
