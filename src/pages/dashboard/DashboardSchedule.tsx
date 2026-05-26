import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const DashboardSchedule = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    // Get enrolled class IDs then fetch upcoming sessions
    supabase.from("enrollments").select("class_id").eq("user_id", user.id).eq("status", "active")
      .then(async ({ data: enrollments }) => {
        if (!enrollments?.length) return;
        const classIds = enrollments.map(e => e.class_id).filter(Boolean);
        if (!classIds.length) return;
        const { data } = await supabase
          .from("class_sessions")
          .select("*, classes(title)")
          .in("class_id", classIds)
          .gte("session_date", new Date().toISOString().split("T")[0])
          .order("session_date", { ascending: true })
          .limit(20);
        setSessions(data || []);
      });
  }, [user]);

  const isJoinable = (session: any) => {
    const now = new Date();
    const sessionDate = new Date(`${session.session_date}T${session.start_time}`);
    const diff = (sessionDate.getTime() - now.getTime()) / (1000 * 60);
    return diff <= 15 && diff >= -session.end_time; // joinable 15 min before
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient">Schedule</h1>
      {sessions.length === 0 ? (
        <EmptyState icon={Calendar} title="No upcoming sessions" description="Your enrolled classes will show their next sessions here." />
      ) : (
        <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-3">
          {sessions.map((s) => {
            const joinable = isJoinable(s);
            return (
              <motion.div
                key={s.id}
                variants={fadeUp}
                className="glass-strong rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:ring-glow hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/25 to-secondary/15 text-primary ring-1 ring-primary/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{s.classes?.title}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{new Date(s.session_date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.start_time} - {s.end_time}</span>
                      {joinable && (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {s.zoom_link && (
                  <a href={s.zoom_link} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <Button variant="premium" size="sm" className="gap-1" disabled={!joinable}>
                      <ExternalLink className="w-3 h-3" /> Join Class
                    </Button>
                  </a>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardSchedule;
