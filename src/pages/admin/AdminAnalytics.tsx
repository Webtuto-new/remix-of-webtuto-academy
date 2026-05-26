import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, CreditCard, BookOpen, Video, FileText, Eye } from "lucide-react";
import AdminPageHeader from "@/components/premium/AdminPageHeader";
import { SkeletonStat } from "@/components/premium/SkeletonCard";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";

const AdminAnalytics = () => {
  const [data, setData] = useState({ totalRevenue: 0, monthlyRevenue: 0, totalStudents: 0, totalEnrollments: 0, topClasses: [] as any[] });
  const [activity, setActivity] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState({ recordings: 0, notes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const [paymentsRes, studentsRes, enrollmentsRes, topRes] = await Promise.all([
        supabase.from("payments").select("amount, created_at").eq("payment_status", "completed"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("class_id, classes(title)").not("class_id", "is", null),
      ]);

      const payments = paymentsRes.data || [];
      const totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const monthlyRevenue = payments
        .filter((p: any) => new Date(p.created_at) >= thisMonth)
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      const classCounts: Record<string, { title: string; count: number }> = {};
      (topRes.data || []).forEach((e: any) => {
        if (e.class_id) {
          if (!classCounts[e.class_id]) classCounts[e.class_id] = { title: e.classes?.title || "Unknown", count: 0 };
          classCounts[e.class_id].count++;
        }
      });
      const topClasses = Object.values(classCounts).sort((a, b) => b.count - a.count).slice(0, 5);

      setData({ totalRevenue, monthlyRevenue, totalStudents: studentsRes.count || 0, totalEnrollments: enrollmentsRes.count || 0, topClasses });
      setLoading(false);
    };

    const fetchActivity = async () => {
      const { data: acts } = await supabase.from("student_activity" as any).select("*, profiles:user_id(full_name, email, admission_number)").order("created_at", { ascending: false }).limit(50) as any;
      setActivity(acts || []);
      const recordings = (acts || []).filter((a: any) => a.activity_type === "recording_view").length;
      const notes = (acts || []).filter((a: any) => a.activity_type === "note_download").length;
      setActivityStats({ recordings, notes });
    };

    fetchAnalytics();
    fetchActivity();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={BarChart3}
        eyebrow="Insights"
        title="Platform Analytics"
        description="Revenue trends, enrollments, and live student activity across the academy."
        accent="emerald"
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={viewportOnce}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: CreditCard, label: "Total Revenue", value: `LKR ${data.totalRevenue.toLocaleString()}`, tint: "from-emerald-500/25 to-emerald-500/5", color: "text-emerald-400" },
            { icon: TrendingUp, label: "This Month", value: `LKR ${data.monthlyRevenue.toLocaleString()}`, tint: "from-accent/25 to-accent/5", color: "text-accent" },
            { icon: Users, label: "Total Students", value: data.totalStudents, tint: "from-primary/25 to-primary/5", color: "text-primary" },
            { icon: BookOpen, label: "Total Enrollments", value: data.totalEnrollments, tint: "from-secondary/25 to-secondary/5", color: "text-secondary" },
          ].map((c) => (
            <motion.div key={c.label} variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl glass-strong border border-white/10 p-5 transition-all hover:-translate-y-1 hover:ring-glow">
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
      )}

      {/* Student Activity Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-strong border-white/10 hover:ring-glow transition-all"><CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gradient">{activityStats.recordings}</p>
            <p className="text-xs text-muted-foreground">Recording Views</p>
          </div>
        </CardContent></Card>
        <Card className="glass-strong border-white/10 hover:ring-glow transition-all"><CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gradient">{activityStats.notes}</p>
            <p className="text-xs text-muted-foreground">Note Downloads</p>
          </div>
        </CardContent></Card>
      </div>

      <Card className="glass-strong border-white/10">
        <CardHeader><CardTitle className="text-lg">Top Classes by Enrollments</CardTitle></CardHeader>
        <CardContent>
          {data.topClasses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No enrollment data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topClasses.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                    <span className="text-sm font-medium text-foreground">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: `${(c.count / data.topClasses[0].count) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-foreground w-8 text-right">{c.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Student Activity Log */}
      <Card className="glass-strong border-white/10">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Eye className="w-5 h-5" /> Recent Student Activity</CardTitle></CardHeader>
        <CardContent className="p-0">
          {activity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">No activity tracked yet. Activity will appear here when students view recordings or download notes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Student</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Resource</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                </tr></thead>
                <tbody>
                  {activity.map((a: any) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="p-3">
                        <p className="font-medium text-foreground">{a.profiles?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{a.profiles?.admission_number || a.profiles?.email}</p>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          a.activity_type === "recording_view" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                        }`}>
                          {a.activity_type === "recording_view" ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {a.activity_type === "recording_view" ? "Viewed Recording" : "Downloaded Notes"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{a.resource_title || "—"}</td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(a.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
