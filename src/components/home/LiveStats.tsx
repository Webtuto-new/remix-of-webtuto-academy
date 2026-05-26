import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Play, GraduationCap, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Stat = { label: string; value: number; icon: any; suffix?: string };

const useCountUp = (target: number, duration = 1400) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

const StatCard = ({ s, i }: { s: Stat; i: number }) => {
  const v = useCountUp(s.value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-md ring-1 ring-foreground/10 hover:ring-primary/40 transition-all group"
    >
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-primary/15 blur-2xl opacity-60 group-hover:opacity-100 transition" />
      <div className="relative flex items-center gap-4">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-accent/15 ring-1 ring-foreground/10 flex items-center justify-center">
          <s.icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground leading-none tracking-tight">
            {v.toLocaleString()}
            {s.suffix && <span className="text-primary">{s.suffix}</span>}
          </div>
          <div className="text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-muted-foreground mt-1.5">
            {s.label}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const LiveStats = () => {
  const [stats, setStats] = useState<Stat[] | null>(null);

  useEffect(() => {
    (async () => {
      const [students, tutors, classes, lessons] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("classes").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("recordings").select("id", { count: "exact", head: true }),
      ]);
      setStats([
        { label: "Active Students", value: Math.max(50, students.count || 0), icon: Users, suffix: "+" },
        { label: "Expert Tutors", value: tutors.count || 0, icon: GraduationCap },
        { label: "Live Classes", value: classes.count || 0, icon: Play },
        { label: "Recorded Lessons", value: lessons.count || 0, icon: BookOpen, suffix: "+" },
      ]);
    })();
  }, []);

  if (!stats) return null;

  return (
    <section className="relative py-10 sm:py-14">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {stats.map((s, i) => (
            <StatCard key={s.label} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveStats;