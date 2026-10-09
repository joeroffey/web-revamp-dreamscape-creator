
import { Instagram, Facebook, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { FACEBOOK_URL, INSTAGRAM_URL, LOGO_SRC, OPENING_HOURS } from "@/lib/site";
import { LocalBusinessSchema } from "@/components/LocalBusinessSchema";

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Our Hub", href: "/our-hub" },
    { name: "Your Visit", href: "/your-visit" },
    { name: "Events", href: "/events" },
    { name: "Journal", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ];

  const services = [
    { name: "Book a Session", href: "/booking" },
    { name: "Contrast Therapy", href: "/booking" },
    { name: "Red Light Therapy", href: "/red-light-therapy" },
    { name: "Membership Plans", href: "/memberships" },
    { name: "Fitness & Recovery", href: "/fitness-recovery" },
    { name: "Gift Cards", href: "/gift-cards" },
  ];

  return (
    <footer className="text-foreground" style={{ backgroundColor: 'hsl(var(--footer-background))' }}>
      <LocalBusinessSchema />
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex flex-col items-center w-fit">
                <Link to="/" className="mb-4">
                  <img
                    src={LOGO_SRC}
                    alt="Revitalise Hub Logo"
                    width={480}
                    height={465}
                    loading="lazy"
                    decoding="async"
                    className="h-32 w-auto"
                  />
                </Link>
                <div className="flex gap-3">
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Revitalise Hub on Instagram"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/25 bg-transparent hover:bg-foreground hover:text-background transition-colors"
                  >
                    <Instagram className="h-[18px] w-[18px]" />
                  </a>
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Revitalise Hub on Facebook"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/25 bg-transparent hover:bg-foreground hover:text-background transition-colors"
                  >
                    <Facebook className="h-[18px] w-[18px]" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xs font-medium tracking-[0.25em] uppercase text-foreground/70 mb-6">Quick Links</h3>
              <ul className="space-y-3.5">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href}
                      className="text-sm text-foreground/80 hover:text-foreground transition-colors"
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
              <h3 className="text-xs font-medium tracking-[0.25em] uppercase text-foreground/70 mb-6">Our Services</h3>
              <ul className="space-y-3.5">
                {services.map((service) => (
                  <li key={service.name}>
                    <Link 
                      to={service.href}
                      className="text-sm text-foreground/80 hover:text-foreground transition-colors"
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
              <h3 className="text-xs font-medium tracking-[0.25em] uppercase text-foreground/70 mb-6">Contact</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-foreground/60 mt-[3px] flex-shrink-0" />
                  <address className="not-italic text-foreground/80 text-sm">
                    Revitalise Hub<br />
                    Unit 7, Ensign Yard<br />
                    670 Ampress Lane<br />
                    Lymington SO41 8QY
                  </address>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-foreground/60 flex-shrink-0" />
                  <a 
                    href="tel:+441590698691"
                    className="text-foreground/80 hover:text-foreground transition-colors text-sm"
                  >
                    01590 698691
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-foreground/60 flex-shrink-0" />
                  <a 
                    href="mailto:info@revitalisehub.co.uk"
                    className="text-foreground/80 hover:text-foreground transition-colors text-sm"
                  >
                    info@revitalisehub.co.uk
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-foreground/60 mt-[3px] flex-shrink-0" />
                  <dl className="text-foreground/80 text-sm grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
                    {OPENING_HOURS.map((row) => (
                      <div key={row.days} className="contents">
                        <dt>{row.days}</dt>
                        <dd>{row.hours}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Google Maps Banner */}
        <div className="border-t border-foreground/15 py-10">
          <div className="mb-5">
            <h3 className="text-xs font-medium tracking-[0.25em] uppercase text-foreground/70 text-center">Find Us</h3>
          </div>
          <div className="w-full h-64 rounded-2xl overflow-hidden border border-foreground/15">
            <iframe
              src="https://www.google.com/maps?q=Revitalise+Hub+Ensign+Yard+Lymington&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Revitalise Hub location: Unit 7, Ensign Yard, 670 Ampress Lane, Lymington SO41 8QY"
            />
          </div>
        </div>
        <div className="border-t border-foreground/15 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-foreground/70 text-xs tracking-wide">
              © {new Date().getFullYear()} Revitalise Hub. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs tracking-wide">
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
