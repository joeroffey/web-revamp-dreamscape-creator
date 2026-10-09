import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const popularLinks = [
  { name: "Book a session", href: "/booking" },
  { name: "Plan your visit", href: "/your-visit" },
  { name: "Memberships", href: "/memberships" },
  { name: "Gift cards", href: "/gift-cards" },
  { name: "Our hub", href: "/our-hub" },
  { name: "Journal", href: "/blog" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="rh-site min-h-screen flex flex-col bg-background">
      {/* Served with a real 404 status by Vercel (dist/404.html) and never indexed */}
      <SEOHead
        title="Page not found"
        description="Sorry, we couldn't find that page. Explore contrast therapy, sauna and ice bath sessions at Revitalise Hub in Lymington."
        path={location.pathname}
        noindex
      />
      <Navigation />
      <main className="flex-1 flex items-center justify-center rh-main-loose pb-20 px-6 bg-gallery">
        <div className="text-center max-w-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-4">Error 404</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">We can&apos;t find that page</h1>
          <p className="text-lg text-muted-foreground mb-10">
            The page may have moved or no longer exists. Try one of these instead:
          </p>
          <ul className="flex flex-wrap justify-center gap-3 mb-10">
            {popularLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="inline-block rounded-full border border-foreground/20 px-5 py-2 text-sm hover:bg-foreground/5 transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/"
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-full font-medium transition-colors"
          >
            Return to the homepage
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
