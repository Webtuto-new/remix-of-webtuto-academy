import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Calendar, DollarSign, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-foreground",
  reviewing: "bg-blue-500/10 text-blue-500",
  tutor_assigned: "bg-purple-500/10 text-purple-500",
  replied: "bg-amber-500/10 text-amber-600",
  accepted: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  tutor_assigned: "Tutor Assigned",
  replied: "Replied",
  accepted: "Accepted",
  completed: "Completed",
  rejected: "Not Available",
};

const DashboardRequests = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [teachersById, setTeachersById] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("class_requests" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const list = (data as any[]) || [];
      setItems(list);
      const tIds = Array.from(new Set(list.map((r) => r.assigned_teacher_id).filter(Boolean)));
      if (tIds.length) {
        const { data: ts } = await supabase.from("teachers").select("id,name,avatar_url,bio").in("id", tIds);
        const map: Record<string, any> = {};
        (ts || []).forEach((t: any) => (map[t.id] = t));
        setTeachersById(map);
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-gradient">My Class Requests</h1>
          <p className="text-sm text-muted-foreground">Track the status of classes you've requested.</p>
        </div>
        <Link to="/request-class">
          <Button variant="premium" className="gap-2"><Plus className="w-4 h-4" /> New Request</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No requests yet"
          description="Tell us what you want to learn — we'll match you with a tutor."
          action={<Link to="/request-class"><Button variant="premium" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Request a Class</Button></Link>}
        />
      ) : (
        <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-3">
          {items.map((r) => {
            const tutor = r.assigned_teacher_id ? teachersById[r.assigned_teacher_id] : null;
            return (
              <motion.div
                key={r.id}
                variants={fadeUp}
                className="glass-strong rounded-2xl p-4 sm:p-5 space-y-3 transition-all hover:ring-glow"
              >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <p className="font-display font-semibold text-foreground">
                        {r.subject_text || "Subject TBD"} {r.grade_text && `· ${r.grade_text}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {format(new Date(r.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={STATUS_STYLES[r.status] || "bg-muted"}>{STATUS_LABEL[r.status] || r.status}</Badge>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> {r.class_type}</span>
                    {r.preferred_date && <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {r.preferred_date} {r.preferred_time || ""}</span>}
                    {r.budget != null && <span className="inline-flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Budget: {r.currency} {r.budget}</span>}
                  </div>

                  {r.message && (
                    <p className="text-sm text-foreground bg-muted/40 rounded-md p-3">{r.message}</p>
                  )}

                  {tutor && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/5">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {tutor.avatar_url ? <img src={tutor.avatar_url} className="w-full h-full object-cover" alt={tutor.name} /> : <GraduationCap className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Assigned Tutor</p>
                        <p className="text-sm font-semibold text-foreground truncate">{tutor.name}</p>
                      </div>
                      {r.proposed_price != null && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Proposed price</p>
                          <p className="text-sm font-semibold text-foreground">{r.currency} {r.proposed_price}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {r.admin_reply && (
                    <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                      <p className="text-xs font-semibold text-primary mb-1 inline-flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Admin Reply</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{r.admin_reply}</p>
                      {r.replied_at && <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(r.replied_at), "MMM d, yyyy h:mm a")}</p>}
                    </div>
                  )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardRequests;
