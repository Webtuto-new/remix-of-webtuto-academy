import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Trash2, Check, GripVertical, Sparkles, FileText, Settings, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { parseQuizPaste, SAMPLE_PASTE, ParsedQuestion } from "@/lib/quizParser";

export type EditableQuestion = {
  id?: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "short_answer";
  points: number;
  negative_marks: number;
  time_limit_seconds: number;
  explanation?: string;
  correct_answer_text?: string;
  sort_order: number;
  options: { id?: string; option_text: string; is_correct: boolean; sort_order: number }[];
};

interface Props {
  quiz: any;
  onClose: () => void;
  scope?: "admin" | "teacher";
  teacherId?: string | null;
}

const emptyMcq = (sort_order: number): EditableQuestion => ({
  question_text: "",
  question_type: "mcq",
  points: 1,
  negative_marks: 0,
  time_limit_seconds: 30,
  explanation: "",
  sort_order,
  options: [
    { option_text: "", is_correct: true, sort_order: 0 },
    { option_text: "", is_correct: false, sort_order: 1 },
    { option_text: "", is_correct: false, sort_order: 2 },
    { option_text: "", is_correct: false, sort_order: 3 },
  ],
});

const emptyTF = (sort_order: number): EditableQuestion => ({
  question_text: "",
  question_type: "true_false",
  points: 1,
  negative_marks: 0,
  time_limit_seconds: 20,
  explanation: "",
  sort_order,
  options: [
    { option_text: "True", is_correct: true, sort_order: 0 },
    { option_text: "False", is_correct: false, sort_order: 1 },
  ],
});

const emptyShort = (sort_order: number): EditableQuestion => ({
  question_text: "",
  question_type: "short_answer",
  points: 1,
  negative_marks: 0,
  time_limit_seconds: 60,
  explanation: "",
  correct_answer_text: "",
  sort_order,
  options: [],
});

export default function QuizBuilderDialog({ quiz, onClose, scope = "admin", teacherId }: Props) {
  const [meta, setMeta] = useState({
    title: quiz.title || "",
    description: quiz.description || "",
    quiz_mode: quiz.quiz_mode || "self_paced",
    difficulty: quiz.difficulty || "medium",
    syllabus: quiz.syllabus || "",
    chapter: quiz.chapter || "",
    lesson: quiz.lesson || "",
    passing_score: quiz.passing_score ?? 60,
    time_limit_seconds: quiz.time_limit_seconds ?? 0,
    max_attempts: quiz.max_attempts ?? 0,
    negative_marks_per_question: quiz.negative_marks_per_question ?? 0,
    shuffle_questions: !!quiz.shuffle_questions,
    shuffle_options: quiz.shuffle_options ?? true,
    show_correct_answers: quiz.show_correct_answers ?? true,
    show_score_immediately: quiz.show_score_immediately ?? true,
    allow_review: quiz.allow_review ?? true,
    show_leaderboard: quiz.show_leaderboard ?? true,
    require_password: !!quiz.require_password,
    available_from: quiz.available_from ? quiz.available_from.slice(0, 16) : "",
    available_until: quiz.available_until ? quiz.available_until.slice(0, 16) : "",
    status: quiz.status || "draft",
    curriculum_id: quiz.curriculum_id || "",
    grade_id: quiz.grade_id || "",
    subject_id: quiz.subject_id || "",
    class_id: quiz.class_id || "",
    teacher_id: quiz.teacher_id || teacherId || "",
  });

  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [previewParsed, setPreviewParsed] = useState<ParsedQuestion[]>([]);

  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: qs }, { data: cu }, { data: gr }, { data: su }, { data: cl }, { data: te }] = await Promise.all([
        supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("sort_order"),
        supabase.from("curriculums").select("id,name").eq("is_active", true).order("sort_order"),
        supabase.from("grades").select("id,name,curriculum_id").eq("is_active", true).order("sort_order"),
        supabase.from("subjects").select("id,name,grade_id").eq("is_active", true).order("sort_order"),
        supabase.from("classes").select("id,title").eq("is_active", true).order("title").limit(500),
        scope === "admin" ? supabase.from("teachers").select("id,name").eq("is_active", true).order("name") : Promise.resolve({ data: [] as any[] }),
      ]);
      setCurriculums(cu || []);
      setGrades(gr || []);
      setSubjects(su || []);
      setClasses(cl || []);
      setTeachers(te || []);

      const qIds = (qs || []).map((q: any) => q.id);
      const { data: opts } = qIds.length
        ? await supabase.from("quiz_options").select("*").in("question_id", qIds).order("sort_order")
        : { data: [] as any[] };
      const byQ: Record<string, any[]> = {};
      (opts || []).forEach((o: any) => ((byQ[o.question_id] ||= []).push(o)));
      setQuestions(
        (qs || []).map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: (q.question_type as any) || "mcq",
          points: q.points || 1,
          negative_marks: q.negative_marks || 0,
          time_limit_seconds: q.time_limit_seconds ?? 30,
          explanation: q.explanation || "",
          correct_answer_text: q.correct_answer_text || "",
          sort_order: q.sort_order || 0,
          options: (byQ[q.id] || []).map((o: any) => ({
            id: o.id,
            option_text: o.option_text,
            is_correct: o.is_correct,
            sort_order: o.sort_order,
          })),
        }))
      );
      setLoading(false);
    })();
  }, [quiz.id, scope]);

  const filteredGrades = grades.filter((g) => !meta.curriculum_id || g.curriculum_id === meta.curriculum_id);
  const filteredSubjects = subjects.filter((s) => !meta.grade_id || s.grade_id === meta.grade_id);

  const addQ = (type: "mcq" | "true_false" | "short_answer") => {
    const factory = type === "true_false" ? emptyTF : type === "short_answer" ? emptyShort : emptyMcq;
    setQuestions((qs) => [...qs, factory(qs.length)]);
  };

  const removeQ = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  const patchQ = (i: number, p: Partial<EditableQuestion>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...p } : q)));
  const patchOpt = (qi: number, oi: number, p: any) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...p } : o)) } : q)));
  const setCorrect = (qi: number, oi: number) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oi })) } : q)));

  const doParse = () => {
    const parsed = parseQuizPaste(pasteText);
    if (!parsed.length) {
      toast.error("Couldn't detect any questions. Check the format.");
      return;
    }
    setPreviewParsed(parsed);
    toast.success(`Parsed ${parsed.length} questions`);
  };

  const commitParsed = () => {
    if (!previewParsed.length) return;
    setQuestions((existing) => [
      ...existing,
      ...previewParsed.map((p, idx) => ({
        question_text: p.question_text,
        question_type: p.question_type,
        points: p.points,
        negative_marks: 0,
        time_limit_seconds: 30,
        explanation: p.explanation || "",
        correct_answer_text: p.correct_answer_text || "",
        sort_order: existing.length + idx,
        options: p.options.map((o, j) => ({ option_text: o.text, is_correct: o.is_correct, sort_order: j })),
      })),
    ]);
    setPasteText("");
    setPreviewParsed([]);
    toast.success("Questions added — switch to Questions tab to fine-tune.");
  };

  const save = async () => {
    if (!meta.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const update: any = {
        title: meta.title,
        description: meta.description,
        quiz_mode: meta.quiz_mode,
        difficulty: meta.difficulty,
        syllabus: meta.syllabus || null,
        chapter: meta.chapter || null,
        lesson: meta.lesson || null,
        passing_score: meta.passing_score,
        time_limit_seconds: meta.time_limit_seconds || null,
        max_attempts: meta.max_attempts || null,
        negative_marks_per_question: meta.negative_marks_per_question || 0,
        shuffle_questions: meta.shuffle_questions,
        shuffle_options: meta.shuffle_options,
        show_correct_answers: meta.show_correct_answers,
        show_score_immediately: meta.show_score_immediately,
        allow_review: meta.allow_review,
        show_leaderboard: meta.show_leaderboard,
        require_password: meta.require_password,
        available_from: meta.available_from ? new Date(meta.available_from).toISOString() : null,
        available_until: meta.available_until ? new Date(meta.available_until).toISOString() : null,
        status: meta.status,
        is_published: meta.status === "published",
        curriculum_id: meta.curriculum_id || null,
        grade_id: meta.grade_id || null,
        subject_id: meta.subject_id || null,
        class_id: meta.class_id || null,
        teacher_id: meta.teacher_id || null,
      };

      // Auto-generate join code when becoming a live quiz
      if (meta.quiz_mode === "live" && !quiz.join_code) {
        const { data: code } = await supabase.rpc("generate_quiz_join_code");
        if (code) update.join_code = code;
      }

      const { error: metaErr } = await supabase.from("quizzes").update(update).eq("id", quiz.id);
      if (metaErr) throw metaErr;

      // Wipe + reinsert questions/options
      const { data: existing } = await supabase.from("quiz_questions").select("id").eq("quiz_id", quiz.id);
      const existingIds = (existing || []).map((r: any) => r.id);
      if (existingIds.length) {
        await supabase.from("quiz_options").delete().in("question_id", existingIds);
        await supabase.from("quiz_questions").delete().eq("quiz_id", quiz.id);
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim()) continue;
        const { data: qRow, error: qErr } = await supabase
          .from("quiz_questions")
          .insert({
            quiz_id: quiz.id,
            question_text: q.question_text,
            question_type: q.question_type,
            points: q.points,
            negative_marks: q.negative_marks,
            time_limit_seconds: q.time_limit_seconds,
            explanation: q.explanation,
            correct_answer_text: q.correct_answer_text || null,
            sort_order: i,
          })
          .select()
          .single();
        if (qErr || !qRow) {
          toast.error(`Question ${i + 1}: ${qErr?.message}`);
          continue;
        }
        const validOpts = q.options.filter((o) => o.option_text.trim());
        if (validOpts.length) {
          await supabase.from("quiz_options").insert(
            validOpts.map((o, j) => ({ question_id: qRow.id, option_text: o.option_text, is_correct: o.is_correct, sort_order: j }))
          );
        }
      }
      toast.success("Quiz saved");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Quiz Builder
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="settings" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="settings"><Settings className="w-3.5 h-3.5 mr-1.5" /> Settings</TabsTrigger>
            <TabsTrigger value="questions"><FileText className="w-3.5 h-3.5 mr-1.5" /> Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="import"><Wand2 className="w-3.5 h-3.5 mr-1.5" /> Bulk Import</TabsTrigger>
          </TabsList>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-5 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="e.g. Algebra Mastery — Chapter 3" />
              </div>
              <div>
                <Label>Quiz Mode</Label>
                <Select value={meta.quiz_mode} onValueChange={(v) => setMeta({ ...meta, quiz_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_paced">Self-Paced</SelectItem>
                    <SelectItem value="live">Live Quiz</SelectItem>
                    <SelectItem value="published_grade">Published Grade Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} placeholder="A short summary students will see before starting." />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label>Curriculum</Label>
                <Select value={meta.curriculum_id} onValueChange={(v) => setMeta({ ...meta, curriculum_id: v, grade_id: "", subject_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{curriculums.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grade</Label>
                <Select value={meta.grade_id} onValueChange={(v) => setMeta({ ...meta, grade_id: v, subject_id: "" })} disabled={!meta.curriculum_id}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{filteredGrades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select value={meta.subject_id} onValueChange={(v) => setMeta({ ...meta, subject_id: v })} disabled={!meta.grade_id}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{filteredSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Syllabus</Label>
                <Select value={meta.syllabus || "none"} onValueChange={(v) => setMeta({ ...meta, syllabus: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Cambridge">Cambridge</SelectItem>
                    <SelectItem value="Edexcel">Edexcel</SelectItem>
                    <SelectItem value="National">National</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label>Chapter</Label>
                <Input value={meta.chapter} onChange={(e) => setMeta({ ...meta, chapter: e.target.value })} placeholder="e.g. Chapter 3" />
              </div>
              <div>
                <Label>Lesson / Module</Label>
                <Input value={meta.lesson} onChange={(e) => setMeta({ ...meta, lesson: e.target.value })} placeholder="e.g. Lesson 2" />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={meta.difficulty} onValueChange={(v) => setMeta({ ...meta, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label>Pass mark (%)</Label><Input type="number" value={meta.passing_score} onChange={(e) => setMeta({ ...meta, passing_score: Number(e.target.value) })} /></div>
              <div><Label>Total time (sec, 0 = none)</Label><Input type="number" value={meta.time_limit_seconds} onChange={(e) => setMeta({ ...meta, time_limit_seconds: Number(e.target.value) })} /></div>
              <div><Label>Max attempts (0 = unlimited)</Label><Input type="number" value={meta.max_attempts} onChange={(e) => setMeta({ ...meta, max_attempts: Number(e.target.value) })} /></div>
              <div><Label>Negative marks / Q</Label><Input type="number" step="0.25" value={meta.negative_marks_per_question} onChange={(e) => setMeta({ ...meta, negative_marks_per_question: Number(e.target.value) })} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Available from</Label><Input type="datetime-local" value={meta.available_from} onChange={(e) => setMeta({ ...meta, available_from: e.target.value })} /></div>
              <div><Label>Available until</Label><Input type="datetime-local" value={meta.available_until} onChange={(e) => setMeta({ ...meta, available_until: e.target.value })} /></div>
            </div>

            {scope === "admin" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Assign to tutor</Label>
                  <Select value={meta.teacher_id || "none"} onValueChange={(v) => setMeta({ ...meta, teacher_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Link to class</Label>
                  <Select value={meta.class_id || "none"} onValueChange={(v) => setMeta({ ...meta, class_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card/40">
              <div className="text-sm font-semibold text-foreground">Behaviour</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <label className="flex items-center gap-2"><Switch checked={meta.shuffle_questions} onCheckedChange={(v) => setMeta({ ...meta, shuffle_questions: v })} /> Shuffle questions</label>
                <label className="flex items-center gap-2"><Switch checked={meta.shuffle_options} onCheckedChange={(v) => setMeta({ ...meta, shuffle_options: v })} /> Shuffle answer order</label>
                <label className="flex items-center gap-2"><Switch checked={meta.show_correct_answers} onCheckedChange={(v) => setMeta({ ...meta, show_correct_answers: v })} /> Show correct answers</label>
                <label className="flex items-center gap-2"><Switch checked={meta.show_score_immediately} onCheckedChange={(v) => setMeta({ ...meta, show_score_immediately: v })} /> Show score immediately</label>
                <label className="flex items-center gap-2"><Switch checked={meta.allow_review} onCheckedChange={(v) => setMeta({ ...meta, allow_review: v })} /> Allow review</label>
                <label className="flex items-center gap-2"><Switch checked={meta.show_leaderboard} onCheckedChange={(v) => setMeta({ ...meta, show_leaderboard: v })} /> Show leaderboard</label>
                {meta.quiz_mode === "live" && (
                  <label className="flex items-center gap-2 col-span-full"><Switch checked={meta.require_password} onCheckedChange={(v) => setMeta({ ...meta, require_password: v })} /> Require password to join (Live)</label>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Select value={meta.status} onValueChange={(v) => setMeta({ ...meta, status: v })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* QUESTIONS TAB */}
          <TabsContent value="questions" className="space-y-3 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => addQ("mcq")} className="gap-1"><Plus className="w-3 h-3" /> MCQ</Button>
              <Button size="sm" variant="outline" onClick={() => addQ("true_false")} className="gap-1"><Plus className="w-3 h-3" /> True/False</Button>
              <Button size="sm" variant="outline" onClick={() => addQ("short_answer")} className="gap-1"><Plus className="w-3 h-3" /> Short Answer</Button>
            </div>

            {loading ? (
              <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />)}</div>
            ) : questions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10 rounded-xl bg-muted/20">
                No questions yet. Use the buttons above, or jump to <strong>Bulk Import</strong>.
              </div>
            ) : (
              questions.map((q, i) => (
                <div key={i} className="rounded-xl ring-1 ring-border p-4 space-y-3 bg-card/40">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-3" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Question {i + 1}</span>
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider text-[10px]">{q.question_type.replace("_", " ")}</span>
                      </div>
                      <Textarea value={q.question_text} onChange={(e) => patchQ(i, { question_text: e.target.value })} placeholder="Question text" />
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeQ(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>

                  {q.question_type !== "short_answer" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                      {q.options.map((o, oi) => (
                        <div key={oi} className={`flex items-center gap-2 rounded-lg p-2 ring-1 ${o.is_correct ? "ring-green-500 bg-green-500/5" : "ring-border"}`}>
                          <button type="button" onClick={() => setCorrect(i, oi)} className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${o.is_correct ? "bg-green-500 text-white" : "bg-muted"}`}>
                            {o.is_correct ? <Check className="w-3 h-3" /> : <span className="text-xs">{String.fromCharCode(65 + oi)}</span>}
                          </button>
                          <Input value={o.option_text} onChange={(e) => patchOpt(i, oi, { option_text: e.target.value })} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1 h-8" />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.question_type === "short_answer" && (
                    <div className="ml-6">
                      <Label className="text-xs">Correct answer (case-insensitive match)</Label>
                      <Input value={q.correct_answer_text || ""} onChange={(e) => patchQ(i, { correct_answer_text: e.target.value })} placeholder="e.g. William Shakespeare" />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 ml-6">
                    <div><Label className="text-xs">Points</Label><Input type="number" value={q.points} onChange={(e) => patchQ(i, { points: Number(e.target.value) })} className="h-8" /></div>
                    <div><Label className="text-xs">Negative</Label><Input type="number" step="0.25" value={q.negative_marks} onChange={(e) => patchQ(i, { negative_marks: Number(e.target.value) })} className="h-8" /></div>
                    <div><Label className="text-xs">Time (sec)</Label><Input type="number" value={q.time_limit_seconds} onChange={(e) => patchQ(i, { time_limit_seconds: Number(e.target.value) })} className="h-8" /></div>
                  </div>

                  <div className="ml-6"><Label className="text-xs">Explanation (optional)</Label><Textarea value={q.explanation} onChange={(e) => patchQ(i, { explanation: e.target.value })} placeholder="Shown after answer" rows={2} /></div>
                </div>
              ))
            )}
          </TabsContent>

          {/* BULK IMPORT TAB */}
          <TabsContent value="import" className="space-y-3 pt-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm space-y-2">
              <div className="font-semibold flex items-center gap-2"><Wand2 className="w-4 h-4 text-primary" /> Paste from ChatGPT, docs, or spreadsheets</div>
              <p className="text-xs text-muted-foreground">
                Supports MCQ, True/False, and short-answer. Separate questions with a blank line. Mark answers with <code className="px-1 py-0.5 bg-background/60 rounded">Correct Answer: B</code>. Add optional <code className="px-1 py-0.5 bg-background/60 rounded">Explanation: …</code>.
              </p>
              <Button size="sm" variant="ghost" onClick={() => setPasteText(SAMPLE_PASTE)} className="h-7 text-xs">Load sample</Button>
            </div>
            <Textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={10} placeholder="Paste your questions here…" className="font-mono text-xs" />
            <div className="flex items-center gap-2">
              <Button onClick={doParse} variant="outline" className="gap-1"><Sparkles className="w-3.5 h-3.5" /> Parse</Button>
              {previewParsed.length > 0 && (
                <Button onClick={commitParsed} variant="premium" className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add {previewParsed.length} questions
                </Button>
              )}
            </div>
            {previewParsed.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto rounded-xl border border-border/60 p-3">
                {previewParsed.map((p, i) => (
                  <div key={i} className="text-xs rounded-lg bg-muted/30 p-2.5">
                    <div className="font-semibold mb-1">{i + 1}. {p.question_text}</div>
                    {p.question_type !== "short_answer" ? (
                      <ul className="space-y-0.5">
                        {p.options.map((o, j) => (
                          <li key={j} className={o.is_correct ? "text-emerald-400 font-medium" : "text-muted-foreground"}>
                            {String.fromCharCode(65 + j)}) {o.text} {o.is_correct && "✓"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-emerald-400">Answer: {p.correct_answer_text}</div>
                    )}
                    {p.explanation && <div className="text-muted-foreground italic mt-1">{p.explanation}</div>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} variant="premium">{saving ? "Saving…" : "Save Quiz"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}