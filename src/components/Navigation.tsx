
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Calendar, User, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  console.log('Navigation - user:', user?.email, 'isAdmin:', isAdmin, 'adminLoading:', adminLoading);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Our Hub", href: "/our-hub" },
    { name: "Memberships", href: "/memberships" },
    { name: "Contact", href: "/contact" },
    { name: "Booking", href: "/booking" },
    { name: "Gift Cards", href: "/gift-cards" },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-foreground hover:text-foreground/80 transition-all duration-300 font-light text-sm xl:text-base tracking-wide uppercase relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
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
                    {user.email?.split('@')[0] || 'Account'}
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
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-border">
            <div className="flex flex-col space-y-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-foreground hover:text-foreground/80 transition-colors font-light text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-3">
                {user ? (
                  <>
                    <div className="text-sm text-muted-foreground px-3">
                      {user.email}
                    </div>
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
        )}
      </div>
    </nav>
  );
};
