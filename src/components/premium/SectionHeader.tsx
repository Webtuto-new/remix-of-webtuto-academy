import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { fadeUp } from "@/lib/motion";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: { label: string; to: string };
}

export const SectionHeader = ({ eyebrow, title, description, align = "left", action }: Props) => {
  const isCenter = align === "center";
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={fadeUp}
      className={`flex flex-col gap-2 mb-8 ${isCenter ? "items-center text-center" : ""} ${
        action ? "sm:flex-row sm:items-end sm:justify-between" : ""
      }`}
    >
      <div className={`space-y-2 ${isCenter ? "max-w-2xl mx-auto" : ""}`}>
        {eyebrow && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            <span className="h-px w-6 bg-primary/40" />
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {description && <p className="text-muted-foreground text-base md:text-[17px] leading-relaxed">{description}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
        >
          {action.label} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </motion.div>
  );
};

export default SectionHeader;