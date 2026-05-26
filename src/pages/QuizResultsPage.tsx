import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Check, X, Trophy, Clock, ArrowLeft, FileDown, Brain } from "lucide-react";
import { motion } from "framer-motion";

type AnswerRow = {
  id: string;
  question_id: string;
  selected_option_id: string | null;
  answer_text: string | null;
  is_correct: boolean;
  points_earned: number;
};

const QuizResultsPage = () => {
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [optionsByQ, setOptionsByQ] = useState<Record<string, any[]>>({});
  const [answersByQ, setAnswersByQ] = useState<Record<string, AnswerRow>>({});

  useEffect(() => {
    if (!attemptId) return;
    (async () => {
      const { data: a } = await supabase.from("quiz_attempts").select("*").eq("id", attemptId).maybeSingle();
      if (!a) { setLoading(false); return; }
      setAttempt(a);
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", a.quiz_id).maybeSingle();
      setQuiz(q);
      const { data: qs } = await supabase.from("quiz_questions").select("*").eq("quiz_id", a.quiz_id).order("sort_order");
      setQuestions(qs || []);
      const qIds = (qs || []).map((x: any) => x.id);
      if (qIds.length) {
        const { data: opts } = await supabase.from("quiz_options").select("*").in("question_id", qIds);
        const byQ: Record<string, any[]> = {};
        (opts || []).forEach((o: any) => (byQ[o.question_id] ||= []).push(o));
        setOptionsByQ(byQ);
      }
      const { data: ans } = await supabase.from("quiz_attempt_answers").select("*").eq("attempt_id", attemptId);
      const byA: Record<string, AnswerRow> = {};
      (ans || []).forEach((r: any) => { byA[r.question_id] = r; });
      setAnswersByQ(byA);
      setLoading(false);
    })();
  }, [attemptId]);

  const exportPdf = () => window.print();

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 pt-28 pb-16">
          <div className="h-64 rounded-2xl bg-muted/30 animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!attempt) {
    return (
      <Layout>
        <div className="container mx-auto px-4 pt-28 pb-16 text-center">
          <p className="text-muted-foreground">Attempt not found.</p>
          <Link to="/dashboard/quiz-history"><Button variant="outline" className="mt-4 rounded-full">Back to history</Button></Link>
        </div>
      </Layout>
    );
  }

  const pct = Math.round(Number(attempt.percentage || 0));
  const passed = attempt.passed;

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-12 print:pt-4">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Link to="/dashboard/quiz-history">
              <Button variant="ghost" size="sm" className="rounded-full"><ArrowLeft className="w-4 h-4 mr-1" /> History</Button>
            </Link>
            <Button onClick={exportPdf} variant="outline" size="sm" className="rounded-full"><FileDown className="w-4 h-4 mr-2" /> Export PDF</Button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-card ring-1 ring-border/60 p-6 md:p-10 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 ${passed ? "bg-gradient-to-br from-green-400 to-emerald-600" : "bg-gradient-to-br from-orange-400 to-red-500"}`}>
                {passed ? <Trophy className="w-12 h-12 text-white" /> : <Brain className="w-12 h-12 text-white" />}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-3xl md:text-4xl font-extrabold">{quiz?.title || "Quiz"}</h1>
                <p className="text-muted-foreground text-sm mt-1">Completed {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : "—"}</p>
              </div>
              <div className="text-center md:text-right">
                <div className="text-5xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{pct}%</div>
                <div className="text-xs text-muted-foreground mt-1">{attempt.score} / {attempt.max_score} pts</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="rounded-xl bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Status</div><div className={`font-bold ${passed ? "text-green-500" : "text-destructive"}`}>{passed ? "Passed" : "Failed"}</div></div>
              <div className="rounded-xl bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground">Questions</div><div className="font-bold">{questions.length}</div></div>
              <div className="rounded-xl bg-muted/30 p-3 text-center"><div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Time</div><div className="font-bold tabular-nums">{Math.floor((attempt.time_taken_seconds || 0) / 60)}m {(attempt.time_taken_seconds || 0) % 60}s</div></div>
            </div>
          </motion.div>

          <h2 className="font-display text-xl font-bold mb-4">Answer Review</h2>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const ans = answersByQ[q.id];
              const opts = (optionsByQ[q.id] || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
              const correct = ans?.is_correct;
              return (
                <div key={q.id} className={`rounded-2xl ring-1 p-5 ${correct ? "ring-green-500/40 bg-green-500/5" : ans ? "ring-destructive/40 bg-destructive/5" : "ring-border/60 bg-muted/20"}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="shrink-0 w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                    <h3 className="font-semibold flex-1">{q.question_text}</h3>
                    {ans && (correct ? <Check className="w-5 h-5 text-green-500 shrink-0" /> : <X className="w-5 h-5 text-destructive shrink-0" />)}
                  </div>
                  {q.question_type === "short_answer" ? (
                    <div className="space-y-2 text-sm pl-11">
                      <div><span className="text-muted-foreground">Your answer: </span><span className="font-medium">{ans?.answer_text || "—"}</span></div>
                      <div><span className="text-muted-foreground">Correct: </span><span className="font-medium text-green-500">{q.correct_answer_text}</span></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-11">
                      {opts.map((o: any, i: number) => {
                        const isSel = ans?.selected_option_id === o.id;
                        const isCorrect = o.is_correct;
                        return (
                          <div key={o.id} className={`p-3 rounded-lg ring-1 text-sm flex items-center gap-2 ${isCorrect ? "ring-green-500/60 bg-green-500/10" : isSel ? "ring-destructive/60 bg-destructive/10" : "ring-border/50"}`}>
                            <span className="w-6 h-6 rounded bg-foreground/10 flex items-center justify-center text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                            <span className="flex-1">{o.option_text}</span>
                            {isCorrect && <Check className="w-4 h-4 text-green-500" />}
                            {isSel && !isCorrect && <X className="w-4 h-4 text-destructive" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {q.explanation && (
                    <div className="mt-3 ml-11 p-3 rounded-lg bg-muted/40 text-sm">
                      <strong className="text-accent">Explanation: </strong>{q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuizResultsPage;