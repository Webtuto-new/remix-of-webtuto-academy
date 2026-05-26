import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Radio, Clock, Check, X, Trophy, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function LiveQuizParticipantPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const lastQuestionId = useRef<string | null>(null);

  const loadSession = async () => {
    if (!sessionId) return;
    const { data: s } = await supabase.from("quiz_live_sessions").select("*").eq("id", sessionId).maybeSingle();
    if (!s) return;
    setSession(s);
    if (!quiz) {
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", s.quiz_id).maybeSingle();
      setQuiz(q);
      const { data: qs } = await supabase.from("quiz_questions").select("points").eq("quiz_id", s.quiz_id);
      setMaxScore((qs || []).reduce((sum: number, x: any) => sum + (x.points || 1), 0));
    }
    if (s.current_question_id && s.current_question_id !== lastQuestionId.current) {
      lastQuestionId.current = s.current_question_id;
      setSelected(null);
      setAnswered(false);
      const { data: q } = await supabase.from("quiz_questions").select("*").eq("id", s.current_question_id).maybeSingle();
      setQuestion(q);
      const { data: opts } = await supabase.from("quiz_options").select("*").eq("question_id", s.current_question_id).order("sort_order");
      setOptions(opts || []);
      if (q?.time_limit_seconds) setTimeLeft(q.time_limit_seconds);
    }
    if (s.status === "ended") {
      // Finalize attempt
      if (attemptId) {
        const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
        await supabase.from("quiz_attempts").update({
          score, percentage: pct, passed: pct >= (quiz?.passing_score ?? 60),
          completed_at: new Date().toISOString(), status: "submitted",
        }).eq("id", attemptId);
      }
    }
  };

  const loadParticipants = async () => {
    if (!sessionId) return;
    const { count } = await supabase.from("quiz_live_participants").select("id", { count: "exact", head: true }).eq("live_session_id", sessionId);
    setParticipantCount(count || 0);
  };

  useEffect(() => {
    if (!user || !sessionId) return;
    (async () => {
      // Ensure participant row + attempt row
      await supabase.from("quiz_live_participants").upsert(
        { live_session_id: sessionId, user_id: user.id, status: "waiting" } as any,
        { onConflict: "live_session_id,user_id" } as any
      );
      await loadSession();
      const { data: s } = await supabase.from("quiz_live_sessions").select("quiz_id").eq("id", sessionId).maybeSingle();
      if (s) {
        const { data: a } = await supabase.from("quiz_attempts")
          .insert({ quiz_id: s.quiz_id, user_id: user.id, max_score: 0, live_session_id: sessionId, status: "in_progress" } as any)
          .select().single();
        if (a) setAttemptId(a.id);
      }
      await loadParticipants();
    })();
    const channel = supabase.channel(`live-participant-${sessionId}`)
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "quiz_live_sessions", filter: `id=eq.${sessionId}` }, () => loadSession())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "quiz_live_participants", filter: `live_session_id=eq.${sessionId}` }, () => loadParticipants())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sessionId]);

  // Per-question countdown
  useEffect(() => {
    if (timeLeft === null || answered) return;
    if (timeLeft <= 0) { submitAnswer(null); return; }
    const t = setTimeout(() => setTimeLeft((x) => (x !== null ? x - 1 : null)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, answered]);

  const submitAnswer = async (optionId: string | null) => {
    if (answered || !question) return;
    const opt = options.find((o) => o.id === optionId);
    const correct = !!opt?.is_correct;
    const points = correct ? (question.points || 1) : 0;
    setSelected(optionId);
    setAnswered(true);
    setScore((s) => s + points);
    if (attemptId) {
      await supabase.from("quiz_attempt_answers").insert({
        attempt_id: attemptId,
        question_id: question.id,
        selected_option_id: optionId,
        is_correct: correct,
        points_earned: points,
      });
    }
  };

  if (!session) {
    return <Layout><div className="container mx-auto pt-32 pb-20 text-center text-muted-foreground">Loading session…</div></Layout>;
  }

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-destructive">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Live
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" /> {participantCount}
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-2">{quiz?.title}</h1>
          <p className="text-sm text-muted-foreground mb-8">Code: <span className="font-mono font-bold tracking-wider">{session.join_code}</span></p>

          {/* Waiting */}
          {session.status === "waiting" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-card ring-1 ring-border p-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary-foreground animate-pulse" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Waiting for host…</h2>
              <p className="text-muted-foreground text-sm">Your tutor will start the quiz shortly.</p>
            </motion.div>
          )}

          {session.status === "paused" && (
            <div className="rounded-3xl bg-card ring-1 ring-border p-10 text-center">
              <h2 className="font-display text-2xl font-bold">Paused</h2>
              <p className="text-muted-foreground text-sm mt-2">Wait for the host to resume.</p>
            </div>
          )}

          {/* Active question */}
          {(session.status === "active" || (session.status === "paused" && answered)) && question && (
            <div>
              {timeLeft !== null && !answered && (
                <div className="flex items-center justify-end gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 font-bold tabular-nums ${timeLeft <= 5 ? "text-destructive animate-pulse" : ""}`}>
                    <Clock className="w-4 h-4" /> {timeLeft}s
                  </span>
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="rounded-3xl bg-card ring-1 ring-border p-6 md:p-10"
                >
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-6 leading-tight">{question.question_text}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {options.map((opt, i) => {
                      const isSelected = selected === opt.id;
                      const isCorrect = opt.is_correct;
                      return (
                        <motion.button
                          key={opt.id}
                          whileHover={!answered ? { scale: 1.02 } : {}}
                          whileTap={!answered ? { scale: 0.98 } : {}}
                          onClick={() => submitAnswer(opt.id)}
                          disabled={answered}
                          className={`relative text-left p-5 rounded-2xl ring-2 transition-all ${
                            answered
                              ? isCorrect
                                ? "ring-emerald-500 bg-emerald-500/10"
                                : isSelected
                                ? "ring-destructive bg-destructive/10"
                                : "ring-border/40 opacity-60"
                              : "ring-border/60 hover:ring-primary bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="shrink-0 w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center font-bold text-sm">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="font-medium pt-1 flex-1">{opt.option_text}</span>
                            {answered && isCorrect && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}
                            {answered && isSelected && !isCorrect && <X className="w-5 h-5 text-destructive shrink-0" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  {answered && (
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                      Answer locked in. Waiting for the host to advance…
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Ended */}
          {session.status === "ended" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
                <Trophy className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl font-extrabold mb-2">Session Ended</h2>
              <div className="inline-block rounded-2xl bg-card ring-1 ring-border px-10 py-6 my-6">
                <div className="text-5xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {maxScore > 0 ? Math.round((score / maxScore) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">{score} / {maxScore} points</div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/dashboard/quiz-history")} className="rounded-full">View History</Button>
                <Button onClick={() => navigate("/quizzes")} variant="premium" className="rounded-full">More Quizzes</Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}