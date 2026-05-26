import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Users, DollarSign, Trash2, Eye, GraduationCap, Sparkles } from "lucide-react";
import { SkeletonStat } from "@/components/premium/SkeletonCard";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";

const AdminTeacherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalEarnings: 0, totalClasses: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    const [teacherRes, classesRes] = await Promise.all([
      supabase.from("teachers").select("*").eq("id", id!).single(),
      supabase.from("classes").select("*, curriculums:curriculum_id(name), grades:grade_id(name), subjects:subject_id(name)").eq("teacher_id", id!).order("created_at", { ascending: false }),
    ]);

    setTeacher(teacherRes.data);
    const cls = classesRes.data || [];
    setClasses(cls);

    // Fetch stats
    const classIds = cls.map(c => c.id);
    let totalStudents = 0;
    let totalSessions = 0;

    if (classIds.length > 0) {
      const [enrollRes, sessionRes] = await Promise.all([
        supabase.from("enrollments").select("id", { count: "exact" }).in("class_id", classIds).eq("status", "active"),
        supabase.from("class_sessions").select("id", { count: "exact" }).in("class_id", classIds),
      ]);
      totalStudents = enrollRes.count || 0;
      totalSessions = sessionRes.count || 0;
    }

    const payoutRes = await supabase.from("teacher_payouts").select("amount").eq("teacher_id", id!);
    const totalEarnings = (payoutRes.data || []).reduce((s, p) => s + Number(p.amount), 0);

    setStats({ totalStudents, totalEarnings, totalClasses: cls.length, totalSessions });
    setLoading(false);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Delete this class?")) return;
    const { error } = await supabase.from("classes").delete().eq("id", classId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Class deleted" }); fetchAll(); }
  };

  const toggleClassVisibility = async (cls: any) => {
    const { error } = await supabase.from("classes").update({ is_active: !cls.is_active }).eq("id", cls.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: cls.is_active ? "Class hidden" : "Class visible" }); fetchAll(); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl glass-strong border border-white/10 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
        <div className="h-64 rounded-2xl glass-strong border border-white/10 animate-pulse" />
      </div>
    );
  }
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">Teacher not found.</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/teachers")} className="hover:bg-card/60">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to teachers
      </Button>

      {/* Hero teacher card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl glass-strong border border-white/10 p-6 md:p-8 ring-glow"
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start gap-5">
          {teacher.avatar_url ? (
            <img src={teacher.avatar_url} alt={teacher.name}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/30 shadow-xl" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-foreground font-bold text-2xl ring-2 ring-primary/30">
              {teacher.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary/90">
              <Sparkles className="w-3 h-3" /> Teacher profile
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-1.5 tracking-tight">{teacher.name}</h1>
            {teacher.qualifications && <p className="text-sm text-muted-foreground mt-1">{teacher.qualifications}</p>}
            {teacher.bio && <p className="text-sm text-muted-foreground/90 mt-2 max-w-2xl">{teacher.bio}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant={teacher.is_active ? "default" : "secondary"} className="text-xs">
                {teacher.is_active ? "Active" : "Inactive"}
              </Badge>
              {teacher.user_id && (
                <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                  Has Login
                </Badge>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce}
        className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Classes", value: stats.totalClasses, icon: BookOpen, tint: "from-primary/25 to-primary/5", color: "text-primary" },
          { label: "Students", value: stats.totalStudents, icon: Users, tint: "from-secondary/25 to-secondary/5", color: "text-secondary" },
          { label: "Sessions", value: stats.totalSessions, icon: GraduationCap, tint: "from-accent/25 to-accent/5", color: "text-accent" },
          { label: "Earnings (LKR)", value: stats.totalEarnings.toLocaleString(), icon: DollarSign, tint: "from-emerald-500/25 to-emerald-500/5", color: "text-emerald-400" },
        ].map((s) => (
          <motion.div key={s.label} variants={fadeUp}
            className="group relative overflow-hidden rounded-2xl glass-strong border border-white/10 p-5 transition-all hover:-translate-y-1 hover:ring-glow">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.tint} opacity-60 pointer-events-none`} />
            <div className="relative">
              <div className={`w-11 h-11 rounded-xl bg-card/80 flex items-center justify-center ring-1 ring-border/60 ${s.color} mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gradient tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Classes */}
      <Card className="glass-strong border border-white/10 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Classes ({classes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Title</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Curriculum</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Grade</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Subject</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Price</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr></thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors">
                    <td className="p-4 font-medium text-foreground">{c.title}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{c.curriculums?.name || "—"}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{c.grades?.name || "—"}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{c.subjects?.name || "—"}</td>
                    <td className="p-4 text-muted-foreground">{c.currency} {c.price}</td>
                    <td className="p-4">
                      <Badge variant={c.is_active ? "default" : "secondary"} className="text-xs cursor-pointer" onClick={() => toggleClassVisibility(c)}>
                        {c.is_active ? "Visible" : "Hidden"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary"><Link to={`/class/${c.id}`}><Eye className="w-4 h-4" /></Link></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClass(c.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {classes.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No classes assigned to this teacher.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeacherProfile;
