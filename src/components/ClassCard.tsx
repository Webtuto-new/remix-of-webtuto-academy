import { Link } from "react-router-dom";
import { Clock, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export interface ClassCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  curriculum: string;
  grade: string;
  subject: string;
  teacherName: string;
  classType: string;
  price: number;
  originalPrice?: number;
  sessionCount?: number;
  duration?: string;
  isLive?: boolean;
  hasRecording?: boolean;
  description?: string;
}

const typeLabels: Record<string, string> = {
  monthly: "Monthly",
  hourly: "Hourly",
  seminar: "Seminar",
  workshop: "Workshop",
  bundle: "Bundle",
  recording: "Recording",
};

const ClassCard = ({
  id,
  title,
  thumbnail,
  curriculum,
  grade,
  subject,
  teacherName,
  classType,
  price,
  originalPrice,
  sessionCount,
  duration,
  isLive,
  hasRecording,
  description,
}: ClassCardProps) => {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
    <Link to={`/class/${id}`} className="block bg-card/70 backdrop-blur-sm rounded-2xl overflow-hidden card-elevated group hover:ring-2 hover:ring-primary/30 transition-all duration-300 h-full">
      {/* Thumbnail — auto-generate from title if none */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
            <span className="font-display font-bold text-lg text-foreground/70 text-center line-clamp-3">{title}</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isLive && (
            <span className="badge-live">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-live" />
              LIVE
            </span>
          )}
          {hasRecording && <span className="badge-recording">REC</span>}
        </div>
        {discount > 0 && (
          <span className="absolute top-3 right-3 badge-discount">-{discount}%</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-md border border-border bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">{curriculum}</span>
          <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">{grade}</span>
          <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">{typeLabels[classType] || classType}</span>
        </div>

        <h3 className="font-display font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground">{teacherName} · {subject}</p>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {sessionCount && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {sessionCount} sessions
            </span>
          )}
          {duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {duration}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-foreground">
              {classType === "hourly" ? `Rs. ${price.toLocaleString()}/hr` : `Rs. ${price.toLocaleString()}`}
            </span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                Rs. {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all duration-200">
            View <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
    </motion.div>
  );
};

export default ClassCard;
