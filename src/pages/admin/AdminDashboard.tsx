import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, CreditCard, GraduationCap, FileText, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, classes: 0, teachers: 0, payments: 0, applications: 0 });

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
  }, []);

  const cards = [
    { label: "Total Students", value: stats.students, icon: Users, tint: "from-primary/25 to-primary/5", color: "text-primary" },
    { label: "Total Classes", value: stats.classes, icon: BookOpen, tint: "from-secondary/25 to-secondary/5", color: "text-secondary" },
    { label: "Teachers", value: stats.teachers, icon: GraduationCap, tint: "from-accent/25 to-accent/5", color: "text-accent" },
    { label: "Payments", value: stats.payments, icon: CreditCard, tint: "from-emerald-500/25 to-emerald-500/5", color: "text-emerald-400" },
    { label: "Pending Apps", value: stats.applications, icon: FileText, tint: "from-destructive/25 to-destructive/5", color: "text-destructive" },
  ];

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
    </div>
  );
};

export default AdminDashboard;
