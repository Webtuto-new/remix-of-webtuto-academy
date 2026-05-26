import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, Square, Users, Copy, Radio } from "lucide-react";
import { toast } from "sonner";

export default function TeacherLiveQuizConsole() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const loadSession = async () => {
    if (!sessionId) return;
    const { data: s } = await supabase.from("quiz_live_sessions").select("*").eq("id", sessionId).maybeSingle();
    setSession(s);
    if (s) {
      const { data: q } = await supabase.from("quizzes").select("*").eq("id", s.quiz_id).maybeSingle();
      setQuiz(q);
      const { data: qs } = await supabase.from("quiz_questions").select("*, quiz_options(*)").eq("quiz_id", s.quiz_id).order("sort_order");
      setQuestions(qs || []);
      if (s.current_question_id && qs) {
        const idx = qs.findIndex((x: any) => x.id === s.current_question_id);
        if (idx >= 0) setCurrentIdx(idx);
      }
    }
  };

  const loadParticipants = async () => {
    if (!sessionId) return;
    const { data: p } = await supabase.from("quiz_live_participants").select("*").eq("live_session_id", sessionId);
    const ids = (p || []).map((x: any) => x.user_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
      setParticipants((p || []).map((x: any) => ({ ...x, profile: profs?.find((pr: any) => pr.id === x.user_id) })));
    } else {
      setParticipants([]);
    }
  };

  useEffect(() => {
    loadSession();
    loadParticipants();
    if (!sessionId) return;
    const channel = supabase
      .channel(`live-quiz-${sessionId}`)
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "quiz_live_participants", filter: `live_session_id=eq.${sessionId}` }, () => loadParticipants())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "quiz_live_sessions", filter: `id=eq.${sessionId}` }, () => loadSession())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const start = async () => {
    if (!questions.length) return toast.error("This quiz has no questions");
    await supabase.from("quiz_live_sessions").update({
      status: "active",
      started_at: new Date().toISOString(),
      current_question_id: questions[0].id,
      current_question_started_at: new Date().toISOString(),
    }).eq("id", sessionId);
    setCurrentIdx(0);
    toast.success("Live quiz started!");
  };

  const nextQuestion = async () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) return endSession();
    await supabase.from("quiz_live_sessions").update({
      current_question_id: questions[nextIdx].id,
      current_question_started_at: new Date().toISOString(),
      status: "active",
    }).eq("id", sessionId);
    setCurrentIdx(nextIdx);
  };

  const togglePause = async () => {
    const next = session?.status === "paused" ? "active" : "paused";
    await supabase.from("quiz_live_sessions").update({ status: next }).eq("id", sessionId);
  };

  const endSession = async () => {
    if (!confirm("End the live quiz?")) return;
    await supabase.from("quiz_live_sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", sessionId);
    toast.success("Session ended");
    navigate("/teacher/quiz-center");
  };

  if (!session) return <div className="text-center text-muted-foreground p-12">Loading…</div>;

  const currentQ = questions[currentIdx];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-primary uppercase">
        <Radio className="w-3.5 h-3.5 animate-pulse text-destructive" /> Live Console
      </div>
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold">{quiz?.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Status: <span className="font-semibold capitalize">{session.status}</span></p>
      </div>

      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/15 via-accent/10 to-transparent ring-1 ring-primary/30 p-6 md:p-8 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-3">Join Code</div>
        <button
          onClick={() => { navigator.clipboard.writeText(session.join_code); toast.success("Copied"); }}
          className="inline-flex items-center gap-3 group"
        >
          <span className="font-mono text-6xl md:text-8xl font-extrabold tracking-[0.2em] text-foreground group-hover:text-primary transition-colors">
            {session.join_code}
          </span>
          <Copy className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
        </button>
        <p className="text-xs text-muted-foreground mt-3">Students visit <span className="font-mono font-semibold">/quizzes/join</span> and enter this code.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {session.status === "waiting" && (
          <Button onClick={start} variant="premium" className="gap-1.5"><Play className="w-4 h-4" /> Start Quiz</Button>
        )}
        {(session.status === "active" || session.status === "paused") && (
          <>
            <Button onClick={togglePause} variant="outline" className="gap-1.5">
              {session.status === "paused" ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
            </Button>
            <Button onClick={nextQuestion} variant="premium" className="gap-1.5">
              <SkipForward className="w-4 h-4" /> {currentIdx + 1 >= questions.length ? "Finish" : "Next Question"}
            </Button>
          </>
        )}
        <Button onClick={endSession} variant="destructive" className="gap-1.5"><Square className="w-4 h-4" /> End</Button>
      </div>

      {currentQ && session.status !== "waiting" && (
        <div className="rounded-2xl bg-card ring-1 ring-border p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Question {currentIdx + 1} of {questions.length}
          </div>
          <h2 className="font-display text-xl md:text-2xl font-bold mb-4">{currentQ.question_text}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentQ.quiz_options?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((opt: any, i: number) => (
              <div key={opt.id} className={`p-3 rounded-lg ring-1 ${opt.is_correct ? "ring-emerald-500/40 bg-emerald-500/5" : "ring-border bg-muted/20"}`}>
                <span className="text-xs font-bold text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt.option_text}
                {opt.is_correct && <span className="text-[10px] ml-2 text-emerald-500 font-bold">✓ CORRECT</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-card ring-1 ring-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold">Participants</h3>
          <span className="text-xs text-muted-foreground">({participants.length})</span>
        </div>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Waiting for students to join…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg bg-muted/20 p-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(p.profile?.full_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="text-xs font-medium truncate">{p.profile?.full_name || "Anonymous"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}