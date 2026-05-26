import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Users, DollarSign, Pencil, Trash2, Eye, Plus } from "lucide-react";

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

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">Teacher not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/teachers")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        <h1 className="font-display text-2xl font-bold text-gradient">{teacher.name}</h1>
        {teacher.user_id && <Badge variant="outline" className="text-xs">Has Login</Badge>}
      </div>

      {/* Teacher Info */}
      <Card className="glass-strong border-white/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {teacher.avatar_url ? (
              <img src={teacher.avatar_url} alt={teacher.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">{teacher.name.charAt(0)}</div>
            )}
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-foreground text-lg">{teacher.name}</p>
              {teacher.qualifications && <p className="text-sm text-muted-foreground">{teacher.qualifications}</p>}
              {teacher.bio && <p className="text-sm text-muted-foreground mt-2">{teacher.bio}</p>}
              <Badge variant={teacher.is_active ? "default" : "secondary"} className="mt-2">{teacher.is_active ? "Active" : "Inactive"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Classes", value: stats.totalClasses, icon: BookOpen, color: "text-primary" },
          { label: "Students", value: stats.totalStudents, icon: Users, color: "text-secondary" },
          { label: "Sessions", value: stats.totalSessions, icon: BookOpen, color: "text-accent-foreground" },
          { label: "Earnings (LKR)", value: stats.totalEarnings.toLocaleString(), icon: DollarSign, color: "text-primary" },
        ].map(s => (
          <Card className="glass-strong border-white/10 hover:ring-glow transition-all" key={s.label}>
            <CardContent className="p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-bold text-gradient">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Classes */}
      <Card className="glass-strong border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Classes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Curriculum</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Grade</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Subject</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
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
                        <Button variant="ghost" size="sm" asChild><Link to={`/class/${c.id}`}><Eye className="w-4 h-4" /></Link></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteClass(c.id)}><Trash2 className="w-4 h-4" /></Button>
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
