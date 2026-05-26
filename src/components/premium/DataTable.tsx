import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SkeletonRow } from "./SkeletonCard";
import EmptyState from "./EmptyState";
import { Inbox } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[] | undefined | null;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  rowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  className?: string;
  skeletonRows?: number;
}

/**
 * Unified premium admin table — glassmorphic shell, animated rows,
 * built-in loading + empty states. Use across admin pages for consistency.
 */
function DataTable<T>({
  columns,
  rows,
  loading,
  emptyTitle = "No records yet",
  emptyDescription = "Items will appear here once added.",
  emptyIcon,
  rowKey,
  onRowClick,
  className,
  skeletonRows = 6,
}: DataTableProps<T>) {
  const gridCols = columns
    .map((c) => c.className?.match(/w-\[[^\]]+\]|w-\d+\/\d+|flex-\d+/)?.[0] ?? "minmax(0,1fr)")
    .join(" ");

  return (
    <div
      className={cn(
        "glass-strong border border-white/10 rounded-2xl overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div
        className="hidden md:grid gap-4 px-4 py-3 border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-muted-foreground font-medium"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}
      >
        {columns.map((c) => (
          <div key={c.key} className={cn("truncate", c.className)}>
            {c.header}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="divide-y divide-white/5">
        {loading ? (
          Array.from({ length: skeletonRows }).map((_, i) => (
            <SkeletonRow key={i} cols={columns.length} />
          ))
        ) : !rows || rows.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={emptyIcon ?? <Inbox className="h-6 w-6" />}
              title={emptyTitle}
              description={emptyDescription}
            />
          </div>
        ) : (
          rows.map((row, i) => (
            <motion.div
              key={rowKey ? rowKey(row, i) : i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.025, 0.3) }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "grid gap-4 px-4 py-3 items-center text-sm transition-colors",
                "hover:bg-white/[0.04]",
                onRowClick && "cursor-pointer",
              )}
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))`,
              }}
            >
              {columns.map((c) => (
                <div key={c.key} className={cn("min-w-0 truncate", c.className)}>
                  {c.render(row, i)}
                </div>
              ))}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default DataTable;