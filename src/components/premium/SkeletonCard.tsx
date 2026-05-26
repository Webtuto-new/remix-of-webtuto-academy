import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

/**
 * Glassmorphic skeleton placeholder with shimmer effect.
 * Use during async loads in dashboards to keep the premium feel.
 */
const SkeletonCard = ({ className, lines = 3 }: SkeletonCardProps) => (
  <div
    className={cn(
      "glass-strong border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden",
      "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r",
      "before:from-transparent before:via-white/5 before:to-transparent",
      "before:animate-[shimmer_1.8s_infinite]",
      className,
    )}
  >
    <div className="h-4 w-1/3 rounded-md bg-muted/40" />
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-3 rounded-md bg-muted/30"
        style={{ width: `${90 - i * 12}%` }}
      />
    ))}
  </div>
);

export default SkeletonCard;

const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:animate-[shimmer_1.8s_infinite]";

/** Single skeleton row for admin tables. */
export const SkeletonRow = ({
  cols = 5,
  className,
}: {
  cols?: number;
  className?: string;
}) => (
  <div
    className={cn(
      "grid gap-4 items-center px-4 py-3 border-b border-white/5",
      shimmer,
      className,
    )}
    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
  >
    {Array.from({ length: cols }).map((_, i) => (
      <div
        key={i}
        className="h-3 rounded-md bg-muted/30"
        style={{ width: `${60 + ((i * 17) % 35)}%` }}
      />
    ))}
  </div>
);

/** Stat-card skeleton with value + label. */
export const SkeletonStat = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "glass-strong border-white/10 rounded-2xl p-5 space-y-3",
      shimmer,
      className,
    )}
  >
    <div className="flex items-center justify-between">
      <div className="h-3 w-20 rounded-md bg-muted/30" />
      <div className="h-8 w-8 rounded-lg bg-muted/30" />
    </div>
    <div className="h-8 w-24 rounded-md bg-muted/40" />
    <div className="h-2 w-16 rounded-md bg-muted/20" />
  </div>
);