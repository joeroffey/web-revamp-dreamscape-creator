import { Button } from "@/components/ui/button";
import { Snowflake, Flame, Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "Services", href: "#services" },
    { name: "Benefits", href: "#benefits" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  const services = [
    { name: "Ice Bath Therapy", href: "#services" },
    { name: "Sauna Sessions", href: "#services" },
    { name: "Contrast Therapy", href: "#services" },
    { name: "Membership Plans", href: "#services" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center space-x-3 mb-6">
                <div className="flex items-center space-x-2">
                  <Snowflake className="h-8 w-8 text-accent-light" />
                  <Flame className="h-8 w-8 text-wellness-heat" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold">Revitalise</span>
                  <span className="text-sm text-primary-foreground/70 -mt-1">Hub</span>
                </div>
              </Link>
              <p className="text-primary-foreground/80 mb-6 leading-relaxed">
                Your premier destination for thermal therapy and wellness. 
                Experience the power of ice and heat for optimal health and recovery.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="icon" className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10">
                  <Instagram className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10">
                  <Facebook className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                    >
                      {link.name}
                    </a>
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
                    <a 
                      href={service.href}
                      className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                    >
                      {service.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-6">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary-foreground/70 mt-0.5 flex-shrink-0" />
                  <span className="text-primary-foreground/80 text-sm">
                    123 Wellness Street<br />
                    City, County, Postcode
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary-foreground/70 flex-shrink-0" />
                  <a 
                    href="tel:+441234567890"
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                  >
                    +44 (0) 123 456 7890
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary-foreground/70 flex-shrink-0" />
                  <a 
                    href="mailto:hello@revitalisehub.co.uk"
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                  >
                    hello@revitalisehub.co.uk
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/70 text-sm">
              © 2024 Revitalise Hub. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link to="/privacy-policy" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-conditions" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Terms & Conditions
              </Link>
              <a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};