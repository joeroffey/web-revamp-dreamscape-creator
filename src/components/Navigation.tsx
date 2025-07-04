import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Our Hub", href: "/our-hub" },
    { name: "Memberships", href: "/memberships" },
    { name: "Contact", href: "/contact" },
    { name: "Booking", href: "/booking" },
    { name: "Gift Cards", href: "/gift-cards" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary backdrop-blur-sm border-b border-primary-foreground/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-24 md:h-28">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src="/lovable-uploads/7213f936-2c10-4a80-a628-96054c5c6507.png" 
              alt="Revitalise Hub Logo" 
              className="h-16 md:h-20 lg:h-24 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-primary-foreground hover:text-primary-foreground/80 transition-all duration-300 font-light text-sm tracking-wide uppercase relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary-foreground after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center flex-shrink-0">
            {user ? (
              <Link to="/dashboard">
                <Button variant="outline" className="rounded-full px-6 py-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300">
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="outline" className="rounded-full px-6 py-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6 text-primary-foreground" /> : <Menu className="h-6 w-6 text-primary-foreground" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-primary-foreground/20">
            <div className="flex flex-col space-y-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-primary-foreground hover:text-primary-foreground/80 transition-colors font-light text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-3">
                {user ? (
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
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
        )}
      </div>
    </nav>
  );
};