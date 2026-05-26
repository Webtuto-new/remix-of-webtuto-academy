import { Radio, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "live" | "self_paced" | "published_grade" | string;

const META: Record<string, { label: string; icon: any; cls: string }> = {
  live: {
    label: "Live Quiz",
    icon: Radio,
    cls: "bg-destructive/15 text-destructive ring-destructive/30",
  },
  self_paced: {
    label: "Self-Paced",
    icon: BookOpen,
    cls: "bg-primary/15 text-primary ring-primary/30",
  },
  published_grade: {
    label: "Grade Quiz",
    icon: GraduationCap,
    cls: "bg-accent/15 text-accent ring-accent/30",
  },
};

export const QuizModeBadge = ({ mode, size = "sm" }: { mode: Mode; size?: "xs" | "sm" }) => {
  const m = META[mode] || META.self_paced;
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full ring-1 font-semibold",
        size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        m.cls
      )}
    >
      <Icon className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {m.label}
    </span>
  );
};

const DIFF: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
  hard: "bg-rose-500/15 text-rose-400 ring-rose-500/30",
};

export const DifficultyChip = ({ difficulty }: { difficulty?: string }) => {
  const d = (difficulty || "medium").toLowerCase();
  return (
    <span className={cn("inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ring-1", DIFF[d] || DIFF.medium)}>
      {d}
    </span>
  );
};

const STATUS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground ring-border",
  published: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  archived: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
};

export const QuizStatusBadge = ({ status }: { status?: string }) => {
  const s = (status || "draft").toLowerCase();
  return (
    <span className={cn("inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ring-1", STATUS[s] || STATUS.draft)}>
      {s}
    </span>
  );
};