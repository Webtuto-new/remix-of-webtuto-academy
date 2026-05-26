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