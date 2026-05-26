import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Trophy, Check, X, ArrowRight, Sparkles, Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  time_limit_seconds: number | null;
  image_url: string | null;
  explanation: string | null;
  quiz_options: { id: string; option_text: string; is_correct: boolean; sort_order: number }[];
};

const QuizPlayPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stage, setStage] = useState<"intro" | "playing" | "done">("intro");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: qz } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();
      if (!qz) return;
      setQuiz(qz);
      const { data: qs } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", id)
        .order("sort_order");
      const qIds = (qs || []).map((x: any) => x.id);
      const { data: opts } = qIds.length
        ? await supabase.from("quiz_options").select("*").in("question_id", qIds)
        : { data: [] as any[] };
      const byQ: Record<string, any[]> = {};
      (opts || []).forEach((o: any) => {
        (byQ[o.question_id] ||= []).push(o);
      });
      let merged: Question[] = (qs || []).map((q: any) => ({ ...q, quiz_options: byQ[q.id] || [] }));
      if (qz.shuffle_questions) merged = [...merged].sort(() => Math.random() - 0.5);
      setQuestions(merged);
      setMaxScore(merged.reduce((s, q) => s + q.points, 0));
    })();
  }, [id]);

  // Per-question timer
  useEffect(() => {
    if (stage !== "playing" || showFeedback) return;
    const q = questions[current];
    if (!q?.time_limit_seconds) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(q.time_limit_seconds);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        if (t <= 1) {
          clearInterval(interval);
          handleAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, stage, showFeedback, questions]);

  const startQuiz = async () => {
    if (!user) {
      toast.error("Please sign in to take the quiz");
      navigate("/login");
      return;
    }
    if (!quiz || !questions.length) return;
    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({ quiz_id: quiz.id, user_id: user.id, max_score: maxScore })
      .select()
      .single();
    if (error || !data) {
      toast.error("Could not start attempt");
      return;
    }
    setAttemptId(data.id);
    startTime.current = Date.now();
    setStage("playing");
  };

  const handleAnswer = async (optionId: string | null) => {
    if (showFeedback) return;
    const q = questions[current];
    const opt = q.quiz_options.find((o) => o.id === optionId);
    const correct = !!opt?.is_correct;
    const points = correct ? q.points : 0;
    setSelected(optionId);
    setShowFeedback(true);
    setScore((s) => s + points);
    if (attemptId) {
      await supabase.from("quiz_attempt_answers").insert({
        attempt_id: attemptId,
        question_id: q.id,
        selected_option_id: optionId,
        is_correct: correct,
        points_earned: points,
      });
    }
  };

  const next = async () => {
    if (current + 1 >= questions.length) {
      // finish
      const finalScore = score;
      const pct = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;
      const passed = pct >= (quiz?.passing_score ?? 60);
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
      if (attemptId) {
        await supabase
          .from("quiz_attempts")
          .update({
            score: finalScore,
            percentage: pct,
            passed,
            time_taken_seconds: timeTaken,
            completed_at: new Date().toISOString(),
          })
          .eq("id", attemptId);
      }
      // fetch leaderboard
      const { data: lb } = await supabase
        .from("quiz_attempts")
        .select("id,user_id,score,percentage,time_taken_seconds,completed_at")
        .eq("quiz_id", quiz.id)
        .not("completed_at", "is", null)
        .order("percentage", { ascending: false })
        .order("time_taken_seconds", { ascending: true })
        .limit(10);
      setLeaderboard(lb || []);
      setStage("done");
    } else {
      setSelected(null);
      setShowFeedback(false);
      setCurrent((c) => c + 1);
    }
  };

  if (!quiz) {
    return (
      <Layout>
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="h-64 rounded-2xl bg-muted/30 animate-pulse" />
        </div>
      </Layout>
    );
  }

  const q = questions[current];
  const progress = questions.length ? ((current + (showFeedback ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* INTRO */}
          {stage === "intro" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-[0_20px_60px_-10px_hsl(var(--accent)/0.4)]">
                <Brain className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-4">{quiz.title}</h1>
              {quiz.description && <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{quiz.description}</p>}
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                <div className="rounded-xl bg-muted/30 p-4 ring-1 ring-border/60">
                  <Brain className="w-5 h-5 mx-auto mb-2 text-accent" />
                  <div className="text-2xl font-bold">{questions.length}</div>
                  <div className="text-xs text-muted-foreground">Questions</div>
                </div>
                <div className="rounded-xl bg-muted/30 p-4 ring-1 ring-border/60">
                  <Trophy className="w-5 h-5 mx-auto mb-2 text-accent" />
                  <div className="text-2xl font-bold">{maxScore}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="rounded-xl bg-muted/30 p-4 ring-1 ring-border/60">
                  <Clock className="w-5 h-5 mx-auto mb-2 text-accent" />
                  <div className="text-2xl font-bold">{quiz.passing_score || 60}%</div>
                  <div className="text-xs text-muted-foreground">To pass</div>
                </div>
              </div>
              <Button size="lg" onClick={startQuiz} className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full px-10 shadow-[0_8px_30px_hsl(var(--primary)/0.3)]">
                <Sparkles className="w-4 h-4 mr-2" /> Start Quiz
              </Button>
            </motion.div>
          )}

          {/* PLAYING */}
          {stage === "playing" && q && (
            <div>
              {/* Progress + timer */}
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-muted-foreground">Question {current + 1} / {questions.length}</span>
                {timeLeft !== null && (
                  <span className={`inline-flex items-center gap-1.5 font-bold tabular-nums ${timeLeft <= 5 ? "text-destructive animate-pulse" : "text-foreground"}`}>
                    <Clock className="w-4 h-4" /> {timeLeft}s
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden mb-8">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl bg-card ring-1 ring-border/60 p-6 md:p-10 mb-6"
                >
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 leading-tight">{q.question_text}</h2>
                  {q.image_url && <img src={q.image_url} alt="" className="w-full rounded-xl mb-6 max-h-64 object-cover" />}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.quiz_options.sort((a, b) => a.sort_order - b.sort_order).map((opt, i) => {
                      const isSelected = selected === opt.id;
                      const isCorrect = opt.is_correct;
                      const showState = showFeedback;
                      const colors = ["from-red-500/20 to-red-500/5", "from-blue-500/20 to-blue-500/5", "from-yellow-500/20 to-yellow-500/5", "from-green-500/20 to-green-500/5"];
                      return (
                        <motion.button
                          key={opt.id}
                          whileHover={!showFeedback ? { scale: 1.02 } : {}}
                          whileTap={!showFeedback ? { scale: 0.98 } : {}}
                          onClick={() => handleAnswer(opt.id)}
                          disabled={showFeedback}
                          className={`relative text-left p-5 rounded-2xl ring-2 transition-all bg-gradient-to-br ${colors[i % 4]} ${
                            showState
                              ? isCorrect
                                ? "ring-green-500 bg-green-500/20"
                                : isSelected
                                ? "ring-destructive bg-destructive/20"
                                : "ring-border/40 opacity-60"
                              : "ring-border/60 hover:ring-accent"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center font-bold text-sm">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="font-medium pt-1">{opt.option_text}</span>
                            {showState && isCorrect && <Check className="ml-auto w-5 h-5 text-green-500 shrink-0" />}
                            {showState && isSelected && !isCorrect && <X className="ml-auto w-5 h-5 text-destructive shrink-0" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {showFeedback && q.explanation && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-muted/40 text-sm">
                      <strong className="text-accent">Explanation: </strong>{q.explanation}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {showFeedback && (
                <div className="flex justify-end">
                  <Button onClick={next} size="lg" className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    {current + 1 >= questions.length ? "Finish" : "Next"} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* DONE */}
          {stage === "done" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              {(() => {
                const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
                const passed = pct >= (quiz?.passing_score ?? 60);
                return (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-6 shadow-[0_20px_60px_-10px_hsl(var(--accent)/0.5)] ${
                        passed ? "bg-gradient-to-br from-green-400 to-emerald-600" : "bg-gradient-to-br from-orange-400 to-red-500"
                      }`}
                    >
                      {passed ? <Trophy className="w-14 h-14 text-white" /> : <Brain className="w-14 h-14 text-white" />}
                    </motion.div>
                    <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-2">
                      {passed ? "Congratulations!" : "Keep Practicing!"}
                    </h1>
                    <p className="text-muted-foreground mb-6">{passed ? "You crushed it." : `You need ${quiz.passing_score || 60}% to pass.`}</p>
                    <div className="inline-block rounded-2xl bg-card ring-1 ring-border/60 px-10 py-6 mb-8">
                      <div className="text-6xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{Math.round(pct)}%</div>
                      <div className="text-sm text-muted-foreground mt-1">{score} / {maxScore} points</div>
                    </div>
                  </>
                );
              })()}

              {leaderboard.length > 0 && (
                <div className="max-w-md mx-auto rounded-2xl bg-card ring-1 ring-border/60 p-6 mb-6 text-left">
                  <h3 className="font-display font-bold flex items-center gap-2 mb-4"><Medal className="w-5 h-5 text-accent" /> Top Scores</h3>
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((row, i) => (
                      <div key={row.id} className={`flex items-center gap-3 p-2 rounded-lg ${row.id === attemptId ? "bg-accent/10 ring-1 ring-accent/40" : ""}`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-yellow-500 text-white" : i === 1 ? "bg-gray-400 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-muted text-foreground"}`}>{i + 1}</span>
                        <span className="flex-1 text-sm truncate">{row.user_id === user?.id ? "You" : `Student ${row.user_id.slice(0, 6)}`}</span>
                        <span className="font-bold tabular-nums">{Math.round(row.percentage)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Link to="/quizzes"><Button variant="outline" className="rounded-full">More Quizzes</Button></Link>
                <Button onClick={() => window.location.reload()} className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground">Try Again</Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QuizPlayPage;