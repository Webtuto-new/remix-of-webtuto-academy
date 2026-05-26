import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="relative bg-card/40 backdrop-blur-sm border-t border-border/60 mt-20 overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
      <div className="relative">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="inline-block mb-4 group">
              <img src={logo} alt="Webtuto.LK" className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sri Lanka's premier online learning platform. National & London syllabus classes with expert tutors.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Platform</h4>
            <div className="space-y-2">
              {[
                { label: "Classes", path: "/classes" },
                { label: "Recordings", path: "/recordings" },
                { label: "Bundles", path: "/bundles" },
                { label: "Seminars", path: "/seminars" },
                { label: "Workshops", path: "/workshops" },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/0 group-hover:bg-primary transition-all duration-200" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Support</h4>
            <div className="space-y-2">
              {[
                { label: "How To Use", path: "/how-to-use" },
                { label: "Become a Tutor", path: "/tutor-application" },
                { label: "Contact", path: "/contact" },
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-all duration-200 hover:translate-x-1"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/0 group-hover:bg-primary transition-all duration-200" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Get in Touch</h4>
            <div className="space-y-3">
              <a
                href="mailto:admin@webtuto.lk"
                className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-200"
              >
                <Mail className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                admin@webtuto.lk
              </a>
              <a
                href="https://wa.me/94728028444"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-200"
              >
                <Phone className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                0728 028 444
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Webtuto.LK — All rights reserved.</span>
          <span className="text-xs">Sri Lanka's #1 Online Learning Platform</span>
        </div>
      </div>
      </div>
    </footer>
  );
};

export default Footer;
