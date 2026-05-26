import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Calendar } from "lucide-react";
import { EmptyState } from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const DashboardHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("attendance").select("*, class_sessions(*, classes(title))").eq("user_id", user.id).order("joined_at", { ascending: false })
      .then(({ data }) => setHistory(data || []));
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient">Class History</h1>
      {history.length === 0 ? (
        <EmptyState icon={Clock} title="No attendance yet" description="Sessions you've joined will appear here." />
      ) : (
        <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-3">
          {history.map(h => (
            <motion.div
              key={h.id}
              variants={fadeUp}
              className="glass-strong rounded-2xl p-4 flex items-center gap-4 transition-all hover:ring-glow hover:-translate-y-0.5"
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/25 to-secondary/15 text-primary ring-1 ring-primary/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{h.class_sessions?.classes?.title || "Class"}</p>
                <p className="text-sm text-muted-foreground truncate">{h.class_sessions?.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Joined: {new Date(h.joined_at).toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardHistory;
