import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Brain, Copy, Search, Radio, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/premium/AdminPageHeader";
import QuizBuilderDialog from "@/components/quiz/QuizBuilderDialog";
import { QuizModeBadge, DifficultyChip, QuizStatusBadge } from "@/components/quiz/QuizModeBadge";

export default function AdminQuizCenter() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMode, setNewMode] = useState("self_paced");
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quizzes")
      .select("*, teachers(name), curriculums(name), grades(name), subjects(name)")
      .order("created_at", { ascending: false });
    setQuizzes(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createQuiz = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase
      .from("quizzes")
      .insert({ title: newTitle, description: newDesc, quiz_mode: newMode, created_by: user?.id, status: "draft" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    toast.success("Quiz created — opening builder…");
    setNewTitle(""); setNewDesc(""); setNewMode("self_paced");
    setCreateOpen(false);
    await load();
    setEditing(data);
  };

  const duplicateQuiz = async (q: any) => {
    const { data: newQ, error } = await supabase
      .from("quizzes")
      .insert({
        ...Object.fromEntries(Object.entries(q).filter(([k]) => !["id","created_at","updated_at","join_code","teachers","curriculums","grades","subjects"].includes(k))),
        title: `${q.title} (Copy)`,
        status: "draft",
        is_published: false,
        created_by: user?.id,
      })
      .select()
      .single();
    if (error || !newQ) return toast.error(error?.message || "Duplicate failed");
    const { data: qs } = await supabase.from("quiz_questions").select("*").eq("quiz_id", q.id).order("sort_order");
    for (const oldQ of qs || []) {
      const { data: newQq } = await supabase.from("quiz_questions").insert({
        quiz_id: newQ.id,
        question_text: oldQ.question_text, question_type: oldQ.question_type, points: oldQ.points,
        negative_marks: oldQ.negative_marks, time_limit_seconds: oldQ.time_limit_seconds,
        explanation: oldQ.explanation, correct_answer_text: oldQ.correct_answer_text, sort_order: oldQ.sort_order,
      }).select().single();
      if (!newQq) continue;
      const { data: oldOpts } = await supabase.from("quiz_options").select("*").eq("question_id", oldQ.id);
      if (oldOpts?.length) {
        await supabase.from("quiz_options").insert(oldOpts.map((o: any) => ({
          question_id: newQq.id, option_text: o.option_text, is_correct: o.is_correct, sort_order: o.sort_order,
        })));
      }
    }
    toast.success("Duplicated");
    load();
  };

  const deleteQuiz = async (q: any) => {
    if (!confirm(`Delete "${q.title}"? This removes its questions, options, and all attempts.`)) return;
    const { data: attempts } = await supabase.from("quiz_attempts").select("id").eq("quiz_id", q.id);
    if (attempts?.length) {
      await supabase.from("quiz_attempt_answers").delete().in("attempt_id", attempts.map((a: any) => a.id));
    }
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Brain}
        eyebrow="Master Quiz Center"
        title="Quizzes"
        description="Build live, self-paced, and grade-published quizzes — with bulk import, leaderboards, and rich analytics."
        accent="secondary"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="premium" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> New Quiz</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Create Quiz</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Photosynthesis Basics" /></div>
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
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total" value={counts.all} icon={Brain} tint="primary" />
        <KPI label="Live" value={counts.live} icon={Radio} tint="destructive" />
        <KPI label="Self-Paced" value={counts.self_paced} icon={BookOpen} tint="primary" />
        <KPI label="Grade Quizzes" value={counts.published_grade} icon={GraduationCap} tint="accent" />
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
          <p className="text-muted-foreground">No quizzes here yet.</p>
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
                {q.teachers?.name && <div>Tutor: {q.teachers.name}</div>}
                <div>Pass: {q.passing_score}% {q.time_limit_seconds && `· ${Math.ceil(q.time_limit_seconds / 60)} min`}</div>
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t border-border/40">
                <Button size="sm" variant="outline" onClick={() => togglePublish(q)} className="flex-1 h-8 text-xs">
                  {q.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(q)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => duplicateQuiz(q)} title="Duplicate"><Copy className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteQuiz(q)} title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <QuizBuilderDialog quiz={editing} onClose={() => { setEditing(null); load(); }} scope="admin" />}
    </div>
  );
}

const KPI = ({ label, value, icon: Icon, tint }: any) => (
  <div className="rounded-xl bg-card ring-1 ring-border p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${tint}/15 text-${tint}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  </div>
);