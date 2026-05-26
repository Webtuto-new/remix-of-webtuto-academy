import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Brain, Copy, Search, Radio, BookOpen, GraduationCap, Sparkles, PlayCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import QuizBuilderDialog from "@/components/quiz/QuizBuilderDialog";
import { QuizModeBadge, DifficultyChip, QuizStatusBadge } from "@/components/quiz/QuizModeBadge";

export default function TeacherQuizCenter() {
  const { user } = useAuth();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMode, setNewMode] = useState("self_paced");
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: t } = await supabase.from("teachers").select("id").eq("user_id", user.id).maybeSingle();
      setTeacherId(t?.id || null);
    })();
  }, [user]);

  const load = async () => {
    if (!teacherId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("quizzes")
      .select("*, curriculums(name), grades(name), subjects(name)")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });
    setQuizzes(data || []);
    setLoading(false);
  };
  useEffect(() => { if (teacherId) load(); }, [teacherId]);

  const createQuiz = async () => {
    if (!newTitle.trim() || !teacherId) return;
    const { data, error } = await supabase
      .from("quizzes")
      .insert({ title: newTitle, description: newDesc, quiz_mode: newMode, teacher_id: teacherId, created_by: user?.id, status: "draft" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    toast.success("Quiz created — opening builder…");
    setNewTitle(""); setNewDesc(""); setNewMode("self_paced");
    setCreateOpen(false);
    await load();
    setEditing(data);
  };

  const deleteQuiz = async (q: any) => {
    if (!confirm(`Delete "${q.title}"?`)) return;
    const { data: attempts } = await supabase.from("quiz_attempts").select("id").eq("quiz_id", q.id);
    if (attempts?.length) await supabase.from("quiz_attempt_answers").delete().in("attempt_id", attempts.map((a: any) => a.id));
    await supabase.from("quiz_attempts").delete().eq("quiz_id", q.id);
    const { data: qs } = await supabase.from("quiz_questions").select("id").eq("quiz_id", q.id);
    if (qs?.length) {
      await supabase.from("quiz_options").delete().in("question_id", qs.map((r: any) => r.id));
      await supabase.from("quiz_questions").delete().eq("quiz_id", q.id);
    }
    const { error } = await supabase.from("quizzes").delete().eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const togglePublish = async (q: any) => {
    const next = q.status === "published" ? "draft" : "published";
    await supabase.from("quizzes").update({ status: next, is_published: next === "published" }).eq("id", q.id);
    load();
  };

  const startLive = async (q: any) => {
    if (!user) return;
    let joinCode = q.join_code;
    if (!joinCode) {
      const { data: code } = await supabase.rpc("generate_quiz_join_code");
      joinCode = code as string;
      await supabase.from("quizzes").update({ join_code: joinCode }).eq("id", q.id);
    }
    const { data: session, error } = await supabase
      .from("quiz_live_sessions")
      .insert({ quiz_id: q.id, host_user_id: user.id, join_code: joinCode, status: "waiting" })
      .select().single();
    if (error) return toast.error(error.message);
    window.location.href = `/teacher/quiz-center/live/${session.id}`;
  };

  const filtered = quizzes.filter((q) => {
    const matchTab =
      tab === "all" ||
      (tab === "live" && q.quiz_mode === "live") ||
      (tab === "self_paced" && q.quiz_mode === "self_paced") ||
      (tab === "published_grade" && q.quiz_mode === "published_grade") ||
      (tab === "draft" && q.status === "draft");
    const matchQ = !query || q.title?.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQ;
  });

  const counts = {
    all: quizzes.length,
    live: quizzes.filter((q) => q.quiz_mode === "live").length,
    self_paced: quizzes.filter((q) => q.quiz_mode === "self_paced").length,
    published_grade: quizzes.filter((q) => q.quiz_mode === "published_grade").length,
    draft: quizzes.filter((q) => q.status === "draft").length,
  };

  if (!teacherId) {
    return <div className="rounded-xl bg-card ring-1 ring-border p-8 text-center text-muted-foreground">Teacher profile not found. Please contact admin.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-primary uppercase mb-2">
            <Brain className="w-3.5 h-3.5" /> Master Quiz Center
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold">My Quizzes</h1>
          <p className="text-sm text-muted-foreground mt-1">Build live, self-paced, and grade quizzes for your students.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="premium" className="gap-1.5"><Plus className="w-4 h-4" /> New Quiz</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Create Quiz</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Algebra Quick Check" /></div>
              <div><Label>Description</Label><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional" /></div>
              <div>
                <Label>Quiz Mode</Label>
                <Select value={newMode} onValueChange={setNewMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_paced">Self-Paced</SelectItem>
                    <SelectItem value="live">Live Quiz</SelectItem>
                    <SelectItem value="published_grade">Published Grade Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={createQuiz} variant="premium">Create &amp; Open Builder</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total" value={counts.all} icon={Brain} />
        <KPI label="Live" value={counts.live} icon={Radio} />
        <KPI label="Self-Paced" value={counts.self_paced} icon={BookOpen} />
        <KPI label="Grade" value={counts.published_grade} icon={GraduationCap} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="live">Live ({counts.live})</TabsTrigger>
            <TabsTrigger value="self_paced">Self-Paced ({counts.self_paced})</TabsTrigger>
            <TabsTrigger value="published_grade">Grade ({counts.published_grade})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({counts.draft})</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} />
        </Tabs>
        <div className="relative md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quizzes…" className="pl-9 h-10" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-xl bg-muted/30 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-muted/20">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No quizzes yet. Click "New Quiz" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((q) => (
            <div key={q.id} className="rounded-xl bg-card ring-1 ring-border p-5 space-y-3 hover:ring-primary/30 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display font-bold truncate">{q.title}</h3>
                  {q.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{q.description}</p>}
                </div>
                <QuizStatusBadge status={q.status || (q.is_published ? "published" : "draft")} />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <QuizModeBadge mode={q.quiz_mode || "self_paced"} />
                <DifficultyChip difficulty={q.difficulty} />
                {q.join_code && q.quiz_mode === "live" && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary ring-1 ring-primary/30">{q.join_code}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {q.subjects?.name && <div>{q.curriculums?.name} · {q.grades?.name} · {q.subjects?.name}</div>}
                <div>Pass: {q.passing_score}% {q.time_limit_seconds && `· ${Math.ceil(q.time_limit_seconds / 60)} min`}</div>
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t border-border/40">
                {q.quiz_mode === "live" ? (
                  <Button size="sm" variant="premium" onClick={() => startLive(q)} className="flex-1 h-8 text-xs gap-1">
                    <PlayCircle className="w-3.5 h-3.5" /> Start Live
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => togglePublish(q)} className="flex-1 h-8 text-xs">
                    {q.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setEditing(q)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                <Link to={`/teacher/quiz-center/${q.id}/analytics`}><Button size="sm" variant="ghost" title="Analytics"><BarChart3 className="w-3.5 h-3.5" /></Button></Link>
                <Button size="sm" variant="ghost" onClick={() => deleteQuiz(q)} title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <QuizBuilderDialog quiz={editing} onClose={() => { setEditing(null); load(); }} scope="teacher" teacherId={teacherId} />}
    </div>
  );
}

const KPI = ({ label, value, icon: Icon }: any) => (
  <div className="rounded-xl bg-card ring-1 ring-border p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  </div>
);