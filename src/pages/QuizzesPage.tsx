import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Clock, Trophy, Sparkles, ArrowRight, Search, Filter, Medal, Crown, Award } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const QuizzesPage = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [curriculumFilter, setCurriculumFilter] = useState<string>("all");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: qz } = await supabase
        .from("quizzes")
        .select("*, curriculums(name), grades(name), subjects(name), teachers(name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      const list = qz || [];
      const ids = list.map((q: any) => q.id);
      let counts: Record<string, number> = {};
      if (ids.length) {
        const { data: qs } = await supabase
          .from("quiz_questions")
          .select("quiz_id")
          .in("quiz_id", ids);
        (qs || []).forEach((r: any) => (counts[r.quiz_id] = (counts[r.quiz_id] || 0) + 1));
      }
      setQuizzes(list.map((q: any) => ({ ...q, _qCount: counts[q.id] || 0 })));
      setLoading(false);

      // Top players leaderboard — aggregate best scores per user
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("user_id, percentage, score")
        .not("completed_at", "is", null)
        .order("percentage", { ascending: false })
        .limit(200);
      const agg: Record<string, { total: number; best: number; count: number }> = {};
      (attempts || []).forEach((a: any) => {
        const u = a.user_id;
        if (!u) return;
        agg[u] = agg[u] || { total: 0, best: 0, count: 0 };
        agg[u].total += Number(a.score) || 0;
        agg[u].best = Math.max(agg[u].best, Number(a.percentage) || 0);
        agg[u].count += 1;
      });
      const topIds = Object.entries(agg)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5);
      if (topIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", topIds.map(([id]) => id));
        setLeaderboard(
          topIds.map(([id, s]) => ({
            ...s,
            profile: profs?.find((p: any) => p.id === id),
          }))
        );
      }
    })();
  }, []);

  const curriculums = Array.from(
    new Set(quizzes.map((q) => q.curriculums?.name).filter(Boolean))
  ) as string[];

  const filtered = quizzes.filter((q) => {
    const matchQ =
      !query ||
      q.title.toLowerCase().includes(query.toLowerCase()) ||
      (q.subjects?.name || "").toLowerCase().includes(query.toLowerCase());
    const matchC = curriculumFilter === "all" || q.curriculums?.name === curriculumFilter;
    return matchQ && matchC;
  });

  return (
    <Layout>
      <SEOHead title="Quizzes — Webtuto" description="Test your knowledge with interactive quizzes. Compete on the leaderboard." path="/quizzes" />
      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full bg-accent/20 blur-[140px]" />
        <div className="container mx-auto px-4 sm:px-8 relative">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-accent uppercase mb-4">
            <Sparkles className="w-4 h-4" /> Test Your Knowledge
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight">Quizzes</h1>
          <p className="text-lg text-muted-foreground max-w-xl mt-4">
            Race the clock, top the leaderboard, and prove your mastery.
          </p>
        </div>
      </section>

      {/* Top Players Leaderboard */}
      {leaderboard.length > 0 && (
        <section className="container mx-auto px-4 sm:px-8 mb-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-accent/15 via-primary/10 to-transparent border border-accent/30 p-6 md:p-8">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl md:text-2xl font-bold">Top Players</h2>
              <Badge variant="outline" className="ml-2 text-[10px]">All-time</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {leaderboard.map((p, i) => {
                const rankIcon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Award : null;
                const rankColor = i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-muted-foreground";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`relative rounded-2xl bg-card/60 backdrop-blur border border-border/40 p-4 flex items-center gap-3 ${
                      i === 0 ? "md:scale-105 ring-2 ring-accent/40" : ""
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        {p.profile?.avatar_url ? (
                          <img src={p.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display font-bold text-lg">
                            {(p.profile?.full_name || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {rankIcon && (() => {
                        const Icon = rankIcon;
                        return (
                          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center ${rankColor}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        );
                      })()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">#{i + 1}</div>
                      <div className="font-semibold text-sm truncate">
                        {p.profile?.full_name || "Anonymous"}
                      </div>
                      <div className="text-xs text-accent font-bold">{p.total} pts · {p.count} quizzes</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="container mx-auto px-4 sm:px-8 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search quizzes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setCurriculumFilter("all")}
              className={`px-4 h-11 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                curriculumFilter === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "border-border/60 hover:border-foreground/50"
              }`}
            >
              All
            </button>
            {curriculums.map((c) => (
              <button
                key={c}
                onClick={() => setCurriculumFilter(c)}
                className={`px-4 h-11 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                  curriculumFilter === c
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 hover:border-foreground/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-8 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No quizzes match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((q, i) => {
              const qCount = q._qCount ?? 0;
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/quiz/${q.id}`}
                    className="group relative block h-full rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-muted/30 ring-1 ring-border/60 hover:ring-2 hover:ring-accent/60 p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--accent)/0.4)]"
                  >
                    {q.is_live && (
                      <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> LIVE
                      </span>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Brain className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2 line-clamp-2">{q.title}</h3>
                    {q.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{q.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                      <span className="inline-flex items-center gap-1"><Brain className="w-3 h-3" /> {qCount} questions</span>
                      {q.time_limit_seconds && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.ceil(q.time_limit_seconds / 60)} min</span>}
                      {q.passing_score && <span className="inline-flex items-center gap-1"><Trophy className="w-3 h-3" /> {q.passing_score}% to pass</span>}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">{q.subjects?.name || q.grades?.name || q.curriculums?.name || "General"}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-accent group-hover:translate-x-1 transition-transform">
                        Start <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default QuizzesPage;