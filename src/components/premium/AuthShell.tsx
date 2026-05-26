import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthShell = ({ title, subtitle, children, footer }: Props) => {
  return (
    <div className="min-h-screen w-full bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-mesh opacity-90 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full bg-primary/15 blur-[140px] animate-float-blob" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] rounded-full bg-secondary/15 blur-[120px] animate-float-blob" style={{ animationDelay: "-5s" }} />

      <div className="relative grid lg:grid-cols-2 min-h-screen">
        {/* Brand side */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 relative">
          <Link to="/" className="inline-flex items-center gap-2 w-fit">
            <img src={logo} alt="Webtuto.LK" className="h-9 w-auto" />
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 max-w-md"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="w-3.5 h-3.5" /> Premium learning
            </span>
            <h2 className="font-display text-4xl xl:text-5xl font-bold leading-[1.05] text-foreground">
              Learn smarter.<br />
              <span className="text-gradient">Achieve more.</span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Live classes, expert tutors, and cinematic lessons — for National, Cambridge & Edexcel syllabuses.
            </p>
          </motion.div>
          <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Webtuto.LK</div>
        </div>

        {/* Form side */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
              <img src={logo} alt="Webtuto.LK" className="h-8 w-auto" />
            </Link>
            <div className="glass-strong rounded-2xl p-7 sm:p-9 gradient-border">
              <div className="mb-6">
                <h1 className="font-display text-2xl sm:text-[26px] font-bold text-foreground">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
              </div>
              {children}
              {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;