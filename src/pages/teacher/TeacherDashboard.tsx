import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Users, Calendar, DollarSign, Sparkles, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [stats, setStats] = useState({ classes: 0, students: 0, sessions: 0, earnings: 0 });
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    // Get teacher record by user_id
    const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).single();
    if (!t) return;
    setTeacher(t);

    const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", t.id);
    const classIds = (classes || []).map(c => c.id);

    let students = 0, sessions = 0;
    if (classIds.length > 0) {
      const [enrollRes, sessionRes] = await Promise.all([
        supabase.from("enrollments").select("id", { count: "exact" }).in("class_id", classIds).eq("status", "active"),
        supabase.from("class_sessions").select("id", { count: "exact" }).in("class_id", classIds),
      ]);
      students = enrollRes.count || 0;
      sessions = sessionRes.count || 0;

      // Upcoming sessions
      const { data: upcoming } = await supabase.from("class_sessions")
        .select("*, classes:class_id(title)")
        .in("class_id", classIds)
        .gte("session_date", new Date().toISOString().split("T")[0])
        .order("session_date")
        .limit(5);
      setUpcomingSessions(upcoming || []);
    }

    const { data: payouts } = await supabase.from("teacher_payouts").select("amount").eq("teacher_id", t.id);
    const earnings = (payouts || []).reduce((s, p) => s + Number(p.amount), 0);

    setStats({ classes: classIds.length, students, sessions, earnings });
  };

  const statCards = [
    { label: "My Classes", value: stats.classes, icon: BookOpen, tint: "from-primary/25 to-primary/5", color: "text-primary" },
    { label: "Active Students", value: stats.students, icon: Users, tint: "from-secondary/25 to-secondary/5", color: "text-secondary" },
    { label: "Total Sessions", value: stats.sessions, icon: Calendar, tint: "from-accent/25 to-accent/5", color: "text-accent" },
    { label: "Earnings (LKR)", value: stats.earnings.toLocaleString(), icon: DollarSign, tint: "from-emerald-500/25 to-emerald-500/5", color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl glass-strong p-6 md:p-8 ring-glow">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Teacher overview
          </span>
          <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground mt-3 tracking-tight">
            {teacher?.name ? <>Hi, <span className="text-gradient">{teacher.name.split(" ")[0]}</span></> : "Teacher Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">Manage your classes, students, and earnings in one place.</p>
        </div>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <motion.div key={s.label} variants={fadeUp}
            className="group relative overflow-hidden rounded-2xl glass-strong p-5 transition-all hover:-translate-y-1 hover:ring-glow">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.tint} opacity-60 pointer-events-none`} />
            <div className="relative">
              <div className={`w-11 h-11 rounded-xl bg-card/80 flex items-center justify-center ring-1 ring-border/60 ${s.color} mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.45 }}
        className="glass-strong rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Upcoming Sessions</h2>
          <span className="text-xs text-muted-foreground">{upcomingSessions.length} scheduled</span>
        </div>
        {upcomingSessions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming sessions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-3 bg-card/60 hover:bg-card border border-border/60 rounded-xl transition-all">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.classes?.title} · {s.session_date} · {s.start_time}–{s.end_time}</p>
                </div>
                {s.zoom_link && (
                  <a href={s.zoom_link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:gap-2 transition-all shrink-0">
                    Join <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default TeacherDashboard;
