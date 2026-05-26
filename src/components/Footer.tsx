import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowUp,
  Mail,
  Phone,
  MapPin,
  Globe,
  Zap,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Heart,
  ChevronRight,
} from "lucide-react";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import logo from "@/assets/logo.png";

const platformLinks = [
  { label: "Classes", path: "/classes" },
  { label: "Recordings", path: "/recordings" },
  { label: "Bundles", path: "/bundles" },
  { label: "Seminars", path: "/seminars" },
  { label: "Workshops", path: "/workshops" },
];

const supportLinks = [
  { label: "How To Use", path: "/how-to-use" },
  { label: "Become a Tutor", path: "/tutor-application" },
  { label: "Contact", path: "/contact" },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/webtuto.lk", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/webtuto.lk", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/webtuto.lk", label: "YouTube" },
  { icon: Linkedin, href: "https://linkedin.com/company/webtuto-lk", label: "LinkedIn" },
];

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const Footer = () => {
  return (
    <footer className="relative mt-24 overflow-hidden">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px">
        <div className="h-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>

      {/* CTA Banner */}
      <div className="relative">
        <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
        <div className="relative container mx-auto px-4 py-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={stagger}
            className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-card/80 via-card/60 to-primary/[0.03] backdrop-blur-xl px-6 py-8 md:px-10 md:py-10"
          >
            {/* Subtle glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <motion.div variants={fadeUp} className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                  <Zap className="w-3.5 h-3.5" />
                  Start Learning Today
                </div>
                <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  Ready to ace your exams?
                </h3>
                <p className="text-muted-foreground text-sm mt-1 max-w-md">
                  Join thousands of students across Sri Lanka on the nation's #1 online learning platform.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} className="flex items-center gap-3">
                <Link
                  to="/classes"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300"
                >
                  Browse Classes
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border/80 bg-card/50 text-foreground font-medium text-sm hover:bg-card/80 hover:border-primary/20 transition-all duration-300"
                >
                  Contact Us
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="relative border-t border-border/40 bg-card/30 backdrop-blur-md">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />

        <div className="relative container mx-auto px-4 py-14">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8"
          >
            {/* Brand Column */}
            <motion.div variants={fadeUp} className="lg:col-span-4">
              <Link to="/" className="inline-flex items-center gap-3 mb-5 group">
                <img
                  src={logo}
                  alt="Webtuto.LK"
                  className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Sri Lanka's premier online learning platform. National & London syllabus classes with expert tutors, interactive sessions, and flexible learning paths.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-2.5 mt-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="group relative w-9 h-9 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all duration-300"
                  >
                    <social.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Platform Links */}
            <motion.div variants={fadeUp} className="lg:col-span-2 lg:col-start-6">
              <h4 className="font-display font-semibold text-foreground text-sm tracking-wide uppercase mb-5">
                Platform
              </h4>
              <div className="space-y-3">
                {platformLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Support Links */}
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <h4 className="font-display font-semibold text-foreground text-sm tracking-wide uppercase mb-5">
                Support
              </h4>
              <div className="space-y-3">
                {supportLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-all duration-300" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Contact Column */}
            <motion.div variants={fadeUp} className="lg:col-span-3 lg:col-start-10">
              <h4 className="font-display font-semibold text-foreground text-sm tracking-wide uppercase mb-5">
                Get in Touch
              </h4>
              <div className="space-y-4">
                <a
                  href="mailto:admin@webtuto.lk"
                  className="group flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span className="pt-1.5">admin@webtuto.lk</span>
                </a>
                <a
                  href="https://wa.me/94728028444"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="pt-1.5">0728 028 444</span>
                </a>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="pt-1.5">Colombo, Sri Lanka</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="pt-1.5">edu.webtuto.lk</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="relative border-t border-border/40">
          <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {new Date().getFullYear()} Webtuto.LK</span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> in Sri Lanka
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground/70 hidden sm:inline">
                Sri Lanka's #1 Online Learning Platform
              </span>
              <motion.button
                onClick={scrollToTop}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className="group w-9 h-9 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all duration-300"
                aria-label="Back to top"
              >
                <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
