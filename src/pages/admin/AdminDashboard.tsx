import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, CreditCard, GraduationCap, FileText, Shield, TrendingUp, Activity, ArrowUpRight, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, classes: 0, teachers: 0, payments: 0, applications: 0 });
  const [revenue, setRevenue] = useState({ total: 0, last30: 0, sparkline: [] as number[] });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [recentSignups, setRecentSignups] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("classes").select("id", { count: "exact", head: true }),
      supabase.from("teachers").select("id", { count: "exact", head: true }),
      supabase.from("payments").select("id", { count: "exact", head: true }),
      supabase.from("tutor_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]).then(([s, c, t, p, a]) => {
      setStats({
        students: s.count || 0,
        classes: c.count || 0,
        teachers: t.count || 0,
        payments: p.count || 0,
        applications: a.count || 0,
      });
    });

    // Revenue sparkline — last 30 days of approved payments
    supabase
      .from("payments")
      .select("amount, created_at, payment_status")
      .eq("payment_status", "approved")
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .then(({ data }) => {
        const days: number[] = Array(30).fill(0);
        let last30 = 0;
        (data || []).forEach((p: any) => {
          const d = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000);
          if (d >= 0 && d < 30) days[29 - d] += Number(p.amount || 0);
          last30 += Number(p.amount || 0);
        });
        supabase
          .from("payments")
          .select("amount")
          .eq("payment_status", "approved")
          .then(({ data: all }) => {
            const total = (all || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
            setRevenue({ total, last30, sparkline: days });
          });
      });

    supabase
      .from("payments")
      .select("id, amount, currency, payment_status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setRecentPayments(data || []));

    supabase
      .from("class_requests")
      .select("id, student_name, subject_text, grade_text, created_at, status")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setPendingRequests(data || []));

    supabase
      .from("profiles")
      .select("id, full_name, email, created_at, avatar_url")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentSignups(data || []));
  }, []);

  const cards = [
    { label: "Total Students", value: stats.students, icon: Users, tint: "from-primary/25 to-primary/5", color: "text-primary" },
    { label: "Total Classes", value: stats.classes, icon: BookOpen, tint: "from-secondary/25 to-secondary/5", color: "text-secondary" },
    { label: "Teachers", value: stats.teachers, icon: GraduationCap, tint: "from-accent/25 to-accent/5", color: "text-accent" },
    { label: "Payments", value: stats.payments, icon: CreditCard, tint: "from-emerald-500/25 to-emerald-500/5", color: "text-emerald-400" },
    { label: "Pending Apps", value: stats.applications, icon: FileText, tint: "from-destructive/25 to-destructive/5", color: "text-destructive" },
  ];

  const max = Math.max(1, ...revenue.sparkline);
  const points = revenue.sparkline
    .map((v, i) => `${(i / 29) * 100},${100 - (v / max) * 90 - 5}`)
    .join(" ");
  const fmt = (n: number) => `LKR ${Math.round(n).toLocaleString()}`;
  const timeAgo = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl glass-strong p-6 md:p-8 ring-glow">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-destructive/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-semibold tracking-wide">
            <Shield className="w-3.5 h-3.5" /> Control center
          </span>
          <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground mt-3 tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Platform health at a glance — students, classes, teachers, and revenue.</p>
        </div>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <motion.div key={c.label} variants={fadeUp}
            className="group relative overflow-hidden rounded-2xl glass-strong p-5 transition-all hover:-translate-y-1 hover:ring-glow">
            <div className={`absolute inset-0 bg-gradient-to-br ${c.tint} opacity-60 pointer-events-none`} />
            <div className="relative">
              <div className={`w-11 h-11 rounded-xl bg-card/80 flex items-center justify-center ring-1 ring-border/60 ${c.color} mb-3`}>
                <c.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gradient tracking-tight">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue + recent activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.5 }}
          className="lg:col-span-2 relative overflow-hidden rounded-2xl glass-strong p-6">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="relative flex items-start justify-between mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/90">
                <TrendingUp className="w-3.5 h-3.5" /> Revenue
              </span>
              <p className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 tracking-tight">{fmt(revenue.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-emerald-400 font-semibold">{fmt(revenue.last30)}</span> in last 30 days
              </p>
            </div>
            <Link to="/admin/payments" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="relative h-32">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={`0,100 ${points} 100,100`} fill="url(#revGrad)" />
              <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.5, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl glass-strong p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-destructive" /> Needs attention
            </h3>
          </div>
          <div className="space-y-2.5">
            <Link to="/admin/applications" className="flex items-center justify-between p-2.5 rounded-lg bg-card/60 hover:bg-card/90 transition-colors group">
              <span className="text-xs text-muted-foreground">Pending tutor apps</span>
              <span className="text-sm font-bold text-destructive">{stats.applications}</span>
            </Link>
            <Link to="/admin/class-requests" className="flex items-center justify-between p-2.5 rounded-lg bg-card/60 hover:bg-card/90 transition-colors">
              <span className="text-xs text-muted-foreground">Open class requests</span>
              <span className="text-sm font-bold text-accent">{pendingRequests.length}</span>
            </Link>
            <Link to="/admin/payments" className="flex items-center justify-between p-2.5 rounded-lg bg-card/60 hover:bg-card/90 transition-colors">
              <span className="text-xs text-muted-foreground">Pending payments</span>
              <span className="text-sm font-bold text-primary">{recentPayments.filter(p => p.payment_status === "pending").length}</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Activity panels */}
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl glass-strong p-5">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm mb-3">
            <Activity className="w-4 h-4 text-primary" /> Recent payments
          </h3>
          <div className="space-y-1.5">
            {recentPayments.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No payments yet</p>}
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-card/60 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{p.currency} {Number(p.amount).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(p.created_at)}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  p.payment_status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                  p.payment_status === "pending" ? "bg-accent/15 text-accent" :
                  "bg-destructive/15 text-destructive"
                }`}>{p.payment_status}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.5, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl glass-strong p-5">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm mb-3">
            <Clock className="w-4 h-4 text-accent" /> Class requests
          </h3>
          <div className="space-y-1.5">
            {pendingRequests.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No pending requests</p>}
            {pendingRequests.map((r) => (
              <Link key={r.id} to="/admin/class-requests" className="flex items-center justify-between p-2 rounded-lg hover:bg-card/60 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{r.student_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.subject_text || "—"} · {r.grade_text || "—"}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(r.created_at)}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl glass-strong p-5">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2 text-sm mb-3">
            <Users className="w-4 h-4 text-secondary" /> New signups
          </h3>
          <div className="space-y-1.5">
            {recentSignups.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No signups yet</p>}
            {recentSignups.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card/60 transition-colors">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-border/60" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-[10px] font-bold text-foreground">
                    {(u.full_name || u.email || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{u.full_name || "Unnamed"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(u.created_at)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
