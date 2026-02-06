
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Calendar, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Fetch user's first name from profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile?.full_name) {
          setFirstName(profile.full_name.split(' ')[0]);
        }
      } else {
        setFirstName("");
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Our Hub", href: "/our-hub" },
    { name: "Your Visit", href: "/your-visit" },
    { name: "Memberships", href: "/memberships" },
    { name: "Fitness & Recovery", href: "/fitness-recovery" },
    { name: "Contact", href: "/contact" },
    { name: "Booking", href: "/booking" },
    { name: "Gift Cards", href: "/gift-cards" },
  ];

  const aboutSubItems = [
    { name: "About Us", href: "/about", description: "Learn about our story and mission" },
    { name: "Events", href: "/events", description: "Upcoming workshops and gatherings" },
    { name: "Blog", href: "/blog", description: "Tips, news and wellness insights" },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="w-full px-4 sm:px-6 lg:px-4">
        <div className="flex items-center justify-between h-20 sm:h-24 md:h-28 lg:h-32">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src="/lovable-uploads/7213f936-2c10-4a80-a628-96054c5c6507.png" 
              alt="Revitalise Hub Logo" 
              className="h-20 sm:h-24 md:h-28 lg:h-36 xl:h-40 w-auto transition-all duration-300 hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 2xl:space-x-8">
            {/* Home Link */}
            <Link
              to="/"
              className="text-foreground hover:text-foreground/80 transition-all duration-300 font-light text-sm xl:text-base tracking-wide uppercase whitespace-nowrap relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
            >
              Home
            </Link>

            {/* About Dropdown */}
            <div className="relative group">
              <button className="text-foreground hover:text-foreground/80 transition-all duration-300 font-light text-sm xl:text-base tracking-wide uppercase whitespace-nowrap flex items-center gap-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-foreground after:transition-all after:duration-300 group-hover:after:w-full">
                About
                <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-background border border-border rounded-md shadow-lg py-2 min-w-[140px]">
                  {aboutSubItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="block px-4 py-2 text-sm font-light text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Rest of nav items */}
            {navItems.slice(1).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-foreground hover:text-foreground/80 transition-all duration-300 font-light text-sm xl:text-base tracking-wide uppercase whitespace-nowrap relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center flex-shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full px-4 lg:px-6 py-2 transition-all duration-300 hover:scale-105">
                    <User className="h-4 w-4 mr-2" />
                    {firstName || user.email?.split('@')[0] || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      {isAdmin ? "Admin Dashboard" : "Dashboard"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" className="rounded-full px-4 lg:px-6 py-2 transition-all duration-300 hover:scale-105">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 -mr-2 touch-manipulation"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-border">
            <div className="max-h-[calc(100vh-5rem)] overflow-y-auto py-6">
              <div className="flex flex-col space-y-6">
                <Link
                  to="/"
                  className="text-foreground hover:text-foreground/80 transition-colors font-light text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                
                {/* About section with sub-items */}
                <div className="space-y-3">
                  <span className="text-foreground font-light text-lg">About</span>
                  <div className="pl-4 space-y-3 border-l-2 border-border">
                    {aboutSubItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="block text-muted-foreground hover:text-foreground transition-colors font-light text-base"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {navItems.slice(1).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-foreground hover:text-foreground/80 transition-colors font-light text-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 pb-6 space-y-3">
                  {user ? (
                    <>
                      <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full rounded-full">
                          <Settings className="h-4 w-4 mr-2" />
                          {isAdmin ? "Admin Dashboard" : "Dashboard"}
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        className="w-full rounded-full text-red-600"
                        onClick={() => {
                          setIsOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full">
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
