import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Trophy, TrendingDown, Target, AlertTriangle } from "lucide-react";

const TeacherQuizAnalytics = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;
    (async () => {
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle();
      setQuiz(q);
      const { data: qs } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("sort_order");
      setQuestions(qs || []);
      const { data: at } = await supabase.from("quiz_attempts").select("*").eq("quiz_id", quizId).not("completed_at", "is", null).order("percentage", { ascending: false });
      setAttempts(at || []);
      const aIds = (at || []).map((a: any) => a.id);
      if (aIds.length) {
        const { data: ans } = await supabase.from("quiz_attempt_answers").select("*").in("attempt_id", aIds);
        setAnswers(ans || []);
      }
      const userIds = Array.from(new Set((at || []).map((a: any) => a.user_id)));
      if (userIds.length) {
        const { data: pf } = await supabase.from("profiles").select("id,full_name,email").in("id", userIds);
        const map: Record<string, any> = {};
        (pf || []).forEach((p: any) => { map[p.id] = p; });
        setProfiles(map);
      }
      setLoading(false);
    })();
  }, [quizId]);

  const totalAttempts = attempts.length;
  const avgPct = totalAttempts ? Math.round(attempts.reduce((s, a) => s + Number(a.percentage || 0), 0) / totalAttempts) : 0;
  const passRate = totalAttempts ? Math.round((attempts.filter((a) => a.passed).length / totalAttempts) * 100) : 0;
  const avgTime = totalAttempts ? Math.round(attempts.reduce((s, a) => s + (a.time_taken_seconds || 0), 0) / totalAttempts) : 0;

  // Per-question accuracy
  const qStats = questions.map((q) => {
    const qAns = answers.filter((a) => a.question_id === q.id);
    const correct = qAns.filter((a) => a.is_correct).length;
    const acc = qAns.length ? Math.round((correct / qAns.length) * 100) : 0;
    return { ...q, total: qAns.length, correct, acc };
  });
  const weakest = [...qStats].filter((q) => q.total > 0).sort((a, b) => a.acc - b.acc).slice(0, 5);

  // Weak students (failed or below 50%)
  const weakStudents = attempts.filter((a) => Number(a.percentage) < 50).slice(0, 10);

  if (loading) return <div className="p-8"><div className="h-64 rounded-2xl bg-muted/30 animate-pulse" /></div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/teacher/quiz-center"><Button variant="ghost" size="sm" className="rounded-full mb-2"><ArrowLeft className="w-4 h-4 mr-1" /> Quiz Center</Button></Link>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">{quiz?.title} — Analytics</h1>
          <p className="text-muted-foreground text-sm">Insights from {totalAttempts} completed attempts</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: "Attempts", value: totalAttempts, color: "from-blue-500/20 to-blue-500/5" },
          { icon: Target, label: "Avg Score", value: `${avgPct}%`, color: "from-purple-500/20 to-purple-500/5" },
          { icon: Trophy, label: "Pass Rate", value: `${passRate}%`, color: "from-green-500/20 to-green-500/5" },
          { icon: TrendingDown, label: "Avg Time", value: `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`, color: "from-orange-500/20 to-orange-500/5" },
        ].map((k, i) => (
          <div key={i} className={`rounded-2xl ring-1 ring-border/60 p-4 bg-gradient-to-br ${k.color}`}>
            <k.icon className="w-5 h-5 text-accent mb-2" />
            <div className="text-2xl font-extrabold tabular-nums">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl bg-card ring-1 ring-border/60 p-5">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Hardest Questions</h3>
          <div className="space-y-3">
            {weakest.length === 0 && <p className="text-sm text-muted-foreground">Not enough data yet.</p>}
            {weakest.map((q, i) => (
              <div key={q.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 pr-2">{i + 1}. {q.question_text}</span>
                  <span className="tabular-nums font-bold">{q.acc}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${q.acc < 40 ? "bg-destructive" : q.acc < 70 ? "bg-orange-500" : "bg-green-500"}`} style={{ width: `${q.acc}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border/60 p-5">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-destructive" /> Students Needing Help</h3>
          <div className="space-y-2">
            {weakStudents.length === 0 && <p className="text-sm text-muted-foreground">No struggling students yet.</p>}
            {weakStudents.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                <div className="truncate">
                  <div className="font-medium truncate">{profiles[a.user_id]?.full_name || "Student"}</div>
                  <div className="text-xs text-muted-foreground truncate">{profiles[a.user_id]?.email}</div>
                </div>
                <span className="font-bold text-destructive tabular-nums">{Math.round(Number(a.percentage))}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-border/60 p-5">
        <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-accent" /> Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border/60">
              <tr><th className="text-left py-2">#</th><th className="text-left py-2">Student</th><th className="text-right py-2">Score</th><th className="text-right py-2">%</th><th className="text-right py-2">Time</th><th className="text-right py-2">Date</th></tr>
            </thead>
            <tbody>
              {attempts.slice(0, 50).map((a, i) => (
                <tr key={a.id} className="border-b border-border/30">
                  <td className="py-2 font-bold">{i + 1}</td>
                  <td className="py-2">{profiles[a.user_id]?.full_name || "Student"}</td>
                  <td className="py-2 text-right tabular-nums">{a.score}/{a.max_score}</td>
                  <td className="py-2 text-right tabular-nums font-bold">{Math.round(Number(a.percentage))}%</td>
                  <td className="py-2 text-right tabular-nums">{Math.floor((a.time_taken_seconds || 0) / 60)}m</td>
                  <td className="py-2 text-right text-xs text-muted-foreground">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherQuizAnalytics;