import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Clock, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const QuizzesPage = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("quizzes")
      .select("*, curriculums(name), grades(name), subjects(name), teachers(name), quiz_questions(count)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setQuizzes(data || []);
        setLoading(false);
      });
  }, []);

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

      <section className="container mx-auto px-4 sm:px-8 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20">
            <Brain className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No quizzes published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((q, i) => {
              const qCount = q.quiz_questions?.[0]?.count ?? 0;
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