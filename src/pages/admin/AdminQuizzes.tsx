import AdminQuizCenter from "./AdminQuizCenter";
const AdminQuizzes = () => <AdminQuizCenter />;
export default AdminQuizzes;

// Legacy QuizEditor + helpers kept below for reference / future reuse.

// ============ EDITOR DIALOG ============
const QuizEditor = ({ quiz, onClose }: { quiz: Quiz; onClose: () => void }) => {
  const [meta, setMeta] = useState({
    title: quiz.title,
    description: quiz.description || "",
    passing_score: quiz.passing_score ?? 60,
    time_limit_seconds: quiz.time_limit_seconds ?? 0,
    shuffle_questions: !!quiz.shuffle_questions,
    show_correct_answers: !!quiz.show_correct_answers,
    is_live: !!quiz.is_live,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: qs } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("sort_order");
      const qIds = (qs || []).map((q: any) => q.id);
      const { data: opts } = qIds.length
        ? await supabase.from("quiz_options").select("*").in("question_id", qIds).order("sort_order")
        : { data: [] as any[] };
      const byQ: Record<string, any[]> = {};
      (opts || []).forEach((o: any) => ((byQ[o.question_id] ||= []).push({ id: o.id, option_text: o.option_text, is_correct: o.is_correct, sort_order: o.sort_order })));
      setQuestions((qs || []).map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        points: q.points,
        time_limit_seconds: q.time_limit_seconds ?? 30,
        explanation: q.explanation || "",
        sort_order: q.sort_order,
        options: byQ[q.id] || [],
      })));
      setLoading(false);
    })();
  }, [quiz.id]);

  const addQuestion = () => {
    setQuestions((qs) => [
      ...qs,
      {
        question_text: "",
        points: 1,
        time_limit_seconds: 30,
        explanation: "",
        sort_order: qs.length,
        options: [
          { option_text: "", is_correct: true, sort_order: 0 },
          { option_text: "", is_correct: false, sort_order: 1 },
          { option_text: "", is_correct: false, sort_order: 2 },
          { option_text: "", is_correct: false, sort_order: 3 },
        ],
      },
    ]);
  };

  const removeQuestion = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const setQ = (i: number, patch: Partial<Question>) => setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const setOpt = (qi: number, oi: number, patch: any) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : q)));

  const setCorrect = (qi: number, oi: number) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oi })) } : q)));

  const save = async () => {
    // update meta
    const { error: metaErr } = await supabase
      .from("quizzes")
      .update({
        title: meta.title,
        description: meta.description,
        passing_score: meta.passing_score,
        time_limit_seconds: meta.time_limit_seconds || null,
        shuffle_questions: meta.shuffle_questions,
        show_correct_answers: meta.show_correct_answers,
        is_live: meta.is_live,
      })
      .eq("id", quiz.id);
    if (metaErr) return toast.error(metaErr.message);

    // wipe & re-insert questions/options for simplicity
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
          question_type: "mcq",
          points: q.points,
          time_limit_seconds: q.time_limit_seconds,
          explanation: q.explanation,
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
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Quiz</DialogTitle></DialogHeader>

        {/* META */}
        <div className="space-y-4 pb-6 border-b">
          <div><Label>Title</Label><Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Passing score (%)</Label><Input type="number" value={meta.passing_score} onChange={(e) => setMeta({ ...meta, passing_score: Number(e.target.value) })} /></div>
            <div><Label>Total time limit (seconds, 0 = none)</Label><Input type="number" value={meta.time_limit_seconds} onChange={(e) => setMeta({ ...meta, time_limit_seconds: Number(e.target.value) })} /></div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={meta.shuffle_questions} onCheckedChange={(v) => setMeta({ ...meta, shuffle_questions: v })} /> Shuffle questions</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={meta.show_correct_answers} onCheckedChange={(v) => setMeta({ ...meta, show_correct_answers: v })} /> Show answers after</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={meta.is_live} onCheckedChange={(v) => setMeta({ ...meta, is_live: v })} /> Live quiz</label>
          </div>
        </div>

        {/* QUESTIONS */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Questions ({questions.length})</h3>
            <Button size="sm" variant="outline" onClick={addQuestion} className="gap-1"><Plus className="w-3 h-3" /> Add</Button>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />)}</div>
          ) : questions.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8 rounded-lg bg-muted/20">No questions yet. Click <strong>Add</strong> to start.</div>
          ) : (
            questions.map((q, i) => (
              <div key={i} className="rounded-xl ring-1 ring-border p-4 space-y-3 bg-muted/10">
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-3" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>Question {i + 1}</span></div>
                    <Textarea value={q.question_text} onChange={(e) => setQ(i, { question_text: e.target.value })} placeholder="Question text" />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeQuestion(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                  {q.options.map((o, oi) => (
                    <div key={oi} className={`flex items-center gap-2 rounded-lg p-2 ring-1 ${o.is_correct ? "ring-green-500 bg-green-500/5" : "ring-border"}`}>
                      <button type="button" onClick={() => setCorrect(i, oi)} className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${o.is_correct ? "bg-green-500 text-white" : "bg-muted"}`}>
                        {o.is_correct ? <Check className="w-3 h-3" /> : <span className="text-xs">{String.fromCharCode(65 + oi)}</span>}
                      </button>
                      <Input value={o.option_text} onChange={(e) => setOpt(i, oi, { option_text: e.target.value })} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1 h-8" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 ml-6">
                  <div><Label className="text-xs">Points</Label><Input type="number" value={q.points} onChange={(e) => setQ(i, { points: Number(e.target.value) })} className="h-8" /></div>
                  <div><Label className="text-xs">Time limit (sec)</Label><Input type="number" value={q.time_limit_seconds} onChange={(e) => setQ(i, { time_limit_seconds: Number(e.target.value) })} className="h-8" /></div>
                </div>
                <div className="ml-6"><Label className="text-xs">Explanation (optional)</Label><Textarea value={q.explanation} onChange={(e) => setQ(i, { explanation: e.target.value })} placeholder="Shown after answer" rows={2} /></div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save Quiz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// (default export above)