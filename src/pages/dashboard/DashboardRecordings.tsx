import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const DashboardRecordings = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("enrollments").select("*, recordings(*)").eq("user_id", user.id).not("recording_id", "is", null)
      .then(({ data }) => setEnrollments(data || []));
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient">My Recordings</h1>
      {enrollments.length === 0 ? (
        <EmptyState
          icon={Play}
          title="No recordings yet"
          description="Purchase a recording to start your on-demand library."
          action={<Link to="/recordings"><Button variant="premium" size="sm">Browse Recordings</Button></Link>}
        />
      ) : (
        <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map(e => (
            <motion.div
              key={e.id}
              variants={fadeUp}
              className="group glass-strong rounded-2xl overflow-hidden transition-all hover:ring-glow hover:-translate-y-1"
            >
              {e.recordings?.thumbnail_url ? (
                <div className="relative aspect-video overflow-hidden">
                  <img src={e.recordings.thumbnail_url} alt={e.recordings?.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center">
                  <Play className="w-10 h-10 text-primary/40" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1">{e.recordings?.title || "Recording"}</h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{e.recordings?.description?.substring(0, 80) || ""}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                    e.status === "active" ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-muted text-muted-foreground"
                  }`}>{e.status}</span>
                  <Link to={`/recording/${e.recording_id}`}>
                    <Button variant="premium" size="sm" className="gap-1"><Play className="w-3 h-3" /> Watch</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardRecordings;
