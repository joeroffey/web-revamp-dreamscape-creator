
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/booking" },
    { name: "Benefits", href: "/fitness-recovery" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const services = [
    { name: "Ice Bath Therapy", href: "/booking" },
    { name: "Sauna Sessions", href: "/booking" },
    { name: "Contrast Therapy", href: "/booking" },
    { name: "Membership Plans", href: "/memberships" },
  ];

  return (
    <footer className="text-foreground" style={{ backgroundColor: 'hsl(var(--footer-background))' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16">
          {/* Logo and Description - Centered */}
          <div className="flex flex-col items-center text-center mb-12">
            <Link to="/" className="mb-6">
              <img 
                src="/lovable-uploads/7213f936-2c10-4a80-a628-96054c5c6507.png" 
                alt="Revitalise Hub Logo" 
                className="h-32 w-auto"
              />
            </Link>
            <p className="text-foreground/80 max-w-md leading-relaxed mb-6">
              Your premier destination for thermal therapy and wellness. 
              Experience the power of ice and heat for optimal health and recovery.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-transparent border-foreground/20 hover:bg-foreground/10"
                onClick={() => window.open('https://www.instagram.com/revitalise.hub?igsh=MWFwbXluYWR4bHpodw==', '_blank')}
              >
                <Instagram className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-transparent border-foreground/20 hover:bg-foreground/10"
                onClick={() => window.open('https://www.facebook.com/share/1Ak6ZqBrd1/', '_blank')}
              >
                <Facebook className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Links Grid - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href}
                      className="text-foreground/80 hover:text-foreground transition-colors"
                      onClick={scrollToTop}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Our Services</h3>
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.name}>
                    <Link 
                      to={service.href}
                      className="text-foreground/80 hover:text-foreground transition-colors"
                      onClick={scrollToTop}
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 justify-center md:justify-start">
                  <MapPin className="h-5 w-5 text-foreground/70 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground/80 text-sm text-left">
                    Unit 7, Ensign yard<br />
                    670 Ampress Ln<br />
                    Lymington SO41 8QY
                  </span>
                </li>
                <li className="flex items-center gap-3 justify-center md:justify-start">
                  <Phone className="h-5 w-5 text-foreground/70 flex-shrink-0" />
                  <a 
                    href="tel:01590698691"
                    className="text-foreground/80 hover:text-foreground transition-colors text-sm"
                  >
                    01590 698 691 / 0754 696 5111
                  </a>
                </li>
                <li className="flex items-center gap-3 justify-center md:justify-start">
                  <Mail className="h-5 w-5 text-foreground/70 flex-shrink-0" />
                  <a 
                    href="mailto:info@revitalisehub.co.uk"
                    className="text-foreground/80 hover:text-foreground transition-colors text-sm"
                  >
                    info@revitalisehub.co.uk
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Google Maps Banner */}
        <div className="border-t border-foreground/20 py-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-center">Find Us</h3>
          </div>
          <div className="w-full h-64 rounded-lg overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps?q=Revitalise+Hub+Ensign+Yard+Lymington&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Revitalise Hub Location - Unit 7, Ensign yard, 670 Ampress Ln, Lymington SO41 8QY"
            />
          </div>
        </div>
        <div className="border-t border-foreground/20 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-foreground/70 text-sm">
              © 2024 Revitalise Hub. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link 
                to="/privacy-policy" 
                className="text-foreground/70 hover:text-foreground transition-colors"
                onClick={scrollToTop}
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms-conditions" 
                className="text-foreground/70 hover:text-foreground transition-colors"
                onClick={scrollToTop}
              >
                Terms & Conditions
              </Link>
              <Link 
                to="/cookie-policy" 
                className="text-foreground/70 hover:text-foreground transition-colors"
                onClick={scrollToTop}
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
