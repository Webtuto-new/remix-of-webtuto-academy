import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, CreditCard, Calendar, ExternalLink, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";

const DashboardOverview = () => {
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendTestEmail = async () => {
    if (!user?.email) return;
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: user.email,
          subject: "🎓 Welcome to Webtuto Academy!",
          html: `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;"><div style="text-align: center; margin-bottom: 32px;"><h1 style="font-family: 'DM Serif Display', Georgia, serif; font-size: 28px; color: #1a2340; margin: 0;">Welcome to Webtuto Academy</h1></div><p style="font-size: 16px; color: #555; line-height: 1.6;">Hi ${profile?.full_name || "there"}! 👋</p><p style="font-size: 16px; color: #555; line-height: 1.6;">This is a test email from <strong>Webtuto Academy</strong> — Sri Lanka's #1 online learning platform. If you're seeing this, your email system is working perfectly!</p><div style="text-align: center; margin: 32px 0;"><a href="https://edu.webtuto.lk" style="background: #1a3a7a; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Visit Webtuto Academy</a></div><p style="font-size: 14px; color: #999; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">© 2026 Webtuto Academy. All rights reserved.</p></div>`,
        },
      });
      if (error) throw error;
      toast({ title: "Test email sent!", description: `Check your inbox at ${user.email}` });
    } catch (err: any) {
      toast({ title: "Failed to send email", description: err.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    // Fetch enrollments
    supabase.from("enrollments").select("*, classes(*)").eq("user_id", user.id).eq("status", "active")
      .then(({ data }) => setEnrollments(data || []));
    // Fetch payments
    supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setPayments(data || []));
  }, [user]);

  const stats = [
    { icon: BookOpen, label: "Active Classes", value: enrollments.filter(e => e.class_id).length, tint: "from-primary/25 to-primary/5", iconColor: "text-primary" },
    { icon: Play, label: "Recordings", value: enrollments.filter(e => e.recording_id).length, tint: "from-secondary/25 to-secondary/5", iconColor: "text-secondary" },
    { icon: CreditCard, label: "Total Payments", value: payments.length, tint: "from-accent/25 to-accent/5", iconColor: "text-accent" },
    { icon: Calendar, label: "Upcoming", value: upcomingSessions.length, tint: "from-primary/25 to-secondary/5", iconColor: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl glass-strong p-6 md:p-8 ring-glow">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> Your learning dashboard
            </span>
            <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground mt-3 tracking-tight">
              Welcome back, <span className="text-gradient">{profile?.full_name?.split(" ")[0] || "Student"}</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">Pick up where you left off or explore something new today.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/classes"><Button variant="premium" size="sm">Browse classes</Button></Link>
            {isAdmin && (
              <Button onClick={handleSendTestEmail} disabled={sendingEmail} variant="glass" size="sm" className="gap-2">
                <Mail className="w-4 h-4" />
                {sendingEmail ? "Sending..." : "Test email"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}
            className="group relative overflow-hidden rounded-2xl glass-strong p-5 transition-all hover:-translate-y-1 hover:ring-glow">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.tint} opacity-60 pointer-events-none`} />
            <div className="relative flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-card/80 flex items-center justify-center ring-1 ring-border/60 ${stat.iconColor}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick panels */}
      <div className="grid md:grid-cols-2 gap-5">
        <motion.section initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.45 }}
          className="glass-strong rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">My Classes</h2>
            <Link to="/dashboard/classes" className="text-xs text-primary font-semibold hover:gap-2 transition-all inline-flex items-center gap-1">View all <ExternalLink className="w-3 h-3" /></Link>
          </div>
          {enrollments.filter(e => e.class_id).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="mb-3 text-sm">No classes enrolled yet.</p>
              <Link to="/classes"><Button size="sm" variant="premium">Browse Classes</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {enrollments.filter(e => e.class_id).slice(0, 5).map((e) => (
                <Link key={e.id} to={`/class/${e.class_id}`}
                  className="flex items-center justify-between p-3 bg-card/60 hover:bg-card border border-border/60 hover:border-primary/40 rounded-xl transition-all group">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{e.classes?.title || "Class"}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.expires_at ? `Expires ${new Date(e.expires_at).toLocaleDateString()}` : "Active"}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.45, delay: 0.05 }}
          className="glass-strong rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Payments</h2>
            <Link to="/dashboard/payments" className="text-xs text-primary font-semibold hover:gap-2 transition-all inline-flex items-center gap-1">View all <ExternalLink className="w-3 h-3" /></Link>
          </div>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No payments yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-card/60 border border-border/60 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-foreground">LKR {Number(p.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${
                    p.payment_status === "completed" ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-muted text-muted-foreground"
                  }`}>
                    {p.payment_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* Profile card */}
      <motion.section initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportOnce} transition={{ duration: 0.45 }}
        className="glass-strong rounded-2xl p-5 space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Profile Information</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            ["Admission No", profile?.admission_number],
            ["Email", profile?.email],
            ["Phone", profile?.phone],
            ["Address", profile?.address],
          ].map(([label, value]) => (
            <div key={label as string} className="p-3 rounded-xl bg-card/60 border border-border/60">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
              <p className="font-medium text-foreground truncate">{value || "—"}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default DashboardOverview;
