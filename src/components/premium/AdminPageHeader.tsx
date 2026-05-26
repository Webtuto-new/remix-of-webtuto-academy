import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  accent?: "primary" | "destructive" | "accent" | "secondary" | "emerald";
}

const accentMap = {
  primary: { text: "text-primary", bg: "bg-primary/15", ring: "ring-primary/30", blob: "bg-primary/20" },
  destructive: { text: "text-destructive", bg: "bg-destructive/15", ring: "ring-destructive/30", blob: "bg-destructive/15" },
  accent: { text: "text-accent", bg: "bg-accent/15", ring: "ring-accent/30", blob: "bg-accent/20" },
  secondary: { text: "text-secondary", bg: "bg-secondary/15", ring: "ring-secondary/30", blob: "bg-secondary/20" },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/15", ring: "ring-emerald-500/30", blob: "bg-emerald-500/15" },
};

const AdminPageHeader = ({ icon: Icon, eyebrow, title, description, actions, accent = "primary" }: Props) => {
  const a = accentMap[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl glass-strong p-5 md:p-6 ring-glow"
    >
      <div className={`absolute -top-20 -right-20 w-72 h-72 rounded-full ${a.blob} blur-3xl pointer-events-none`} />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${a.bg} ${a.text} text-[11px] font-semibold tracking-wide uppercase`}>
            <Icon className="w-3.5 h-3.5" /> {eyebrow}
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-3 tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-sm mt-1.5">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </motion.div>
  );
};

export default AdminPageHeader;