import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HelpTipProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Inline "ⓘ" help marker for admin/teacher panel sections.
 * - Desktop: hover tooltip
 * - Mobile: tap popover (since hover doesn't work on touch)
 */
const HelpTip = ({ title, children, className = "" }: HelpTipProps) => {
  return (
    <>
      {/* Desktop: hover tooltip */}
      <span className={`hidden sm:inline-flex ${className}`}>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={title || "What is this?"}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
              {title && <div className="font-semibold mb-1">{title}</div>}
              <div className="text-muted-foreground">{children}</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>

      {/* Mobile: tap popover */}
      <span className={`inline-flex sm:hidden ${className}`}>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={title || "What is this?"}
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground hover:text-primary bg-muted/40 active:bg-primary/10"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="max-w-[280px] text-xs leading-relaxed">
            {title && <div className="font-semibold mb-1 text-foreground">{title}</div>}
            <div className="text-muted-foreground">{children}</div>
          </PopoverContent>
        </Popover>
      </span>
    </>
  );
};

export default HelpTip;