import { Mail, Phone, Facebook } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "figma:asset/ab58eeaa257e876782c9f32bf8bd702e735f6d24.png";

export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={logoImage} alt="PERIFIX Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl text-primary">PERIFIX</span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              A visual troubleshooting guide designed to help non-ICT users solve common peripheral device connectivity issues quickly and easily.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/troubleshooting" className="block text-muted-foreground hover:text-primary transition-colors">
                Troubleshooting
              </Link>
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
              <Link to="/faqs" className="block text-muted-foreground hover:text-primary transition-colors">
                FAQs
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span>perifix@support.com</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Facebook className="w-5 h-5 text-primary flex-shrink-0" />
                <span>@PerifixSupport</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>© 2025 PERIFIX. All rights reserved. Built for educational research purposes.</p>
        </div>
      </div>
    </footer>
  );
}