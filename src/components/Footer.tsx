import { Link } from "react-router-dom";
import { Instagram, Facebook, Phone, Mail, MapPin, Snowflake, Flame } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/our-hub" },
    { name: "Benefits", href: "/about" },
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
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-orange-400"></div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-8 left-8">
          <Snowflake className="w-16 h-16 animate-pulse" />
        </div>
        <div className="absolute top-16 right-12">
          <Flame className="w-12 h-12 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute bottom-12 left-16">
          <Flame className="w-14 h-14 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="absolute bottom-8 right-8">
          <Snowflake className="w-10 h-10 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      <div className="relative z-10">
        {/* Main footer content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Brand Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Snowflake className="w-8 h-8 text-cyan-400" />
                  <Flame className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-light tracking-wide">Revitalise</h3>
                  <p className="text-lg font-light text-slate-300">Hub</p>
                </div>
              </div>
              
              <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
                Your premier destination for thermal therapy and wellness. Experience the power of ice and heat for optimal health and recovery.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-700 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links - Hidden on mobile, compact on tablet+ */}
            <div className="hidden md:block">
              <h4 className="text-lg font-semibold mb-6 text-white relative">
                Quick Links
                <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
              </h4>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-slate-300 hover:text-white transition-colors duration-200 text-sm lg:text-base hover:translate-x-1 transform transition-transform"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Our Services - Hidden on mobile, compact on tablet+ */}
            <div className="hidden md:block">
              <h4 className="text-lg font-semibold mb-6 text-white relative">
                Our Services
                <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full"></div>
              </h4>
              <ul className="space-y-3">
                {services.map((service) => (
                  <li key={service.name}>
                    <Link
                      to={service.href}
                      className="text-slate-300 hover:text-white transition-colors duration-200 text-sm lg:text-base hover:translate-x-1 transform transition-transform"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white relative">
                Contact
                <div className="absolute bottom-0 left-0 w-12 h-0.5 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full"></div>
              </h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-slate-300 text-sm lg:text-base">
                    <p>Unit 7, Ensign yard</p>
                    <p>670 Ampress Ln</p>
                    <p>Lymington SO41 8QY</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <a 
                    href="tel:01590698691" 
                    className="text-slate-300 hover:text-white transition-colors text-sm lg:text-base"
                  >
                    01590 698 691 / 0754 696 5111
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <a 
                    href="mailto:info@revitalisehub.co.uk" 
                    className="text-slate-300 hover:text-white transition-colors text-sm lg:text-base break-all"
                  >
                    info@revitalisehub.co.uk
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Quick Links - Only show on mobile as horizontal buttons */}
          <div className="md:hidden mt-8 pt-8 border-t border-slate-700">
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-full text-sm text-slate-300 hover:text-white transition-all duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-slate-700 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-slate-400 text-sm">
                © {currentYear} Revitalise Hub. All rights reserved.
              </p>
              
              <div className="flex flex-wrap gap-4 md:gap-6">
                <Link
                  to="/privacy-policy"
                  className="text-slate-400 hover:text-white text-sm transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms-conditions"
                  className="text-slate-400 hover:text-white text-sm transition-colors duration-200"
                >
                  Terms & Conditions
                </Link>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white text-sm transition-colors duration-200"
                >
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};