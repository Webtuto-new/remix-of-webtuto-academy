import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, CheckCircle2, XCircle, Clock, Award, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function DashboardQuizHistory() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const { data: a } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      const list = a || [];
      const ids = Array.from(new Set(list.map((x: any) => x.quiz_id).filter(Boolean)));
      let quizMap: Record<string, any> = {};
      if (ids.length) {
        const { data: qz } = await supabase
          .from("quizzes")
          .select("id, title, quiz_mode, difficulty, subjects(name), grades(name), curriculums(name)")
          .in("id", ids);
        (qz || []).forEach((q: any) => (quizMap[q.id] = q));
      }
      setAttempts(list.map((x: any) => ({ ...x, quiz: quizMap[x.quiz_id] })));
      setLoading(false);
    })();
  }, [user]);

  const filtered = attempts.filter((a) => {
    const matchTab =
      tab === "all" ||
      (tab === "passed" && a.passed) ||
      (tab === "failed" && !a.passed && a.status !== "in_progress") ||
      (tab === "in_progress" && a.status === "in_progress");
    const matchQ = !query || (a.quiz?.title || "").toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQ;
  });

  const stats = {
    total: attempts.length,
    passed: attempts.filter((a) => a.passed).length,
    avgScore: attempts.length ? Math.round(attempts.reduce((s, a) => s + (Number(a.percentage) || 0), 0) / attempts.length) : 0,
    bestScore: attempts.reduce((m, a) => Math.max(m, Number(a.percentage) || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-primary uppercase mb-2">
          <Brain className="w-3.5 h-3.5" /> Quiz History
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold">Your Attempts</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your progress, review past quizzes, and celebrate your wins.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Attempts" value={stats.total} icon={Brain} />
        <StatCard label="Passed" value={stats.passed} icon={CheckCircle2} />
        <StatCard label="Avg Score" value={`${stats.avgScore}%`} icon={Clock} />
        <StatCard label="Best Score" value={`${stats.bestScore}%`} icon={Award} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="passed">Passed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} />
        </Tabs>
        <div className="relative md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quizzes…" className="pl-9 h-10" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-muted/20">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-3">No attempts yet.</p>
          <Link to="/quizzes" className="text-primary text-sm font-semibold hover:underline">Browse Quizzes →</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Link
              key={a.id}
              to={`/quiz/${a.quiz_id}`}
              className="block rounded-xl bg-card ring-1 ring-border p-4 hover:ring-primary/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.passed ? "bg-emerald-500/15 text-emerald-500" : a.status === "in_progress" ? "bg-amber-500/15 text-amber-500" : "bg-destructive/15 text-destructive"
                }`}>
                  {a.passed ? <CheckCircle2 className="w-6 h-6" /> : a.status === "in_progress" ? <Clock className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{a.quiz?.title || "Quiz"}</h3>
                    {a.quiz?.quiz_mode && <Badge variant="outline" className="text-[10px]">{a.quiz.quiz_mode.replace("_", " ")}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.quiz?.subjects?.name && <>{a.quiz.subjects.name} · </>}
                    {new Date(a.created_at).toLocaleDateString()} · Attempt #{a.attempt_number || 1}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-2xl font-bold tabular-nums ${a.passed ? "text-emerald-500" : "text-foreground"}`}>{Math.round(Number(a.percentage) || 0)}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.score}/{a.max_score} pts</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value, icon: Icon }: any) => (
  <div className="rounded-xl bg-card ring-1 ring-border p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  </div>
);