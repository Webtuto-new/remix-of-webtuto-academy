import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ChevronRight, Copy, BookOpen } from "lucide-react";
import AdminPageHeader from "@/components/premium/AdminPageHeader";

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminCurriculum = () => {
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ type: string; editing: any } | null>(null);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [bulkDialog, setBulkDialog] = useState(false);
  const { toast } = useToast();

  const fetchAll = async () => {
    const [c, g, s] = await Promise.all([
      supabase.from("curriculums").select("*").order("sort_order"),
      supabase.from("grades").select("*").order("sort_order"),
      supabase.from("subjects").select("*").order("sort_order"),
    ]);
    setCurriculums(c.data || []);
    setGrades(g.data || []);
    setSubjects(s.data || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredGrades = grades.filter(g => g.curriculum_id === selectedCurriculum);
  const filteredSubjects = subjects.filter(s => s.grade_id === selectedGrade);

  // Get all unique subject names across the system
  const allSubjectNames = [...new Set(subjects.map(s => s.name))].sort();

  // Subjects already in current grade
  const currentGradeSubjectNames = filteredSubjects.map(s => s.name);

  const handleSave = async () => {
    if (!dialog) return;
    const { type, editing } = dialog;

    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    const slug = form.slug.trim() || generateSlug(form.name);
    let error;

    if (type === "curriculum") {
      const payload = { name: form.name.trim(), slug };
      if (editing) {
        ({ error } = await supabase.from("curriculums").update(payload).eq("id", editing.id));
      } else {
        ({ error } = await supabase.from("curriculums").insert(payload));
      }
    } else if (type === "grade") {
      if (!selectedCurriculum) {
        toast({ title: "Select a curriculum first", variant: "destructive" });
        return;
      }
      const payload = { name: form.name.trim(), slug, curriculum_id: selectedCurriculum };
      if (editing) {
        ({ error } = await supabase.from("grades").update({ name: form.name.trim(), slug }).eq("id", editing.id));
      } else {
        ({ error } = await supabase.from("grades").insert(payload));
      }
    } else if (type === "subject") {
      if (!selectedGrade) {
        toast({ title: "Select a grade first", variant: "destructive" });
        return;
      }
      const payload = { name: form.name.trim(), slug, grade_id: selectedGrade };
      if (editing) {
        ({ error } = await supabase.from("subjects").update({ name: form.name.trim(), slug }).eq("id", editing.id));
      } else {
        ({ error } = await supabase.from("subjects").insert(payload));
      }
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Updated!" : "Created!" });
      setDialog(null);
      setForm({ name: "", slug: "" });
      fetchAll();
    }
  };

  const toggleActive = async (table: string, id: string, current: boolean) => {
    const { error } = await supabase.from(table as any).update({ is_active: !current }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (table === "curriculums") setCurriculums(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
      else if (table === "grades") setGrades(prev => prev.map(g => g.id === id ? { ...g, is_active: !current } : g));
      else if (table === "subjects") setSubjects(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    }
  };

  const handleDelete = async (table: string, id: string) => {
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      if (table === "curriculums" && selectedCurriculum === id) { setSelectedCurriculum(null); setSelectedGrade(null); }
      if (table === "grades" && selectedGrade === id) setSelectedGrade(null);
      fetchAll();
    }
  };

  const openDialog = (type: string, editing?: any) => {
    setDialog({ type, editing: editing || null });
    setForm(editing ? { name: editing.name, slug: editing.slug } : { name: "", slug: "" });
  };

  // Toggle an existing subject name ON for the current grade (create it) or OFF (delete it)
  const toggleSubjectForGrade = async (subjectName: string) => {
    if (!selectedGrade) return;
    const existing = filteredSubjects.find(s => s.name === subjectName);
    if (existing) {
      // Toggle active instead of delete for safety
      await toggleActive("subjects", existing.id, existing.is_active);
    } else {
      // Create this subject for the current grade
      const slug = generateSlug(subjectName);
      const { error } = await supabase.from("subjects").insert({
        name: subjectName,
        slug,
        grade_id: selectedGrade,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `"${subjectName}" added to this grade` });
        fetchAll();
      }
    }
  };

  // Bulk add: copy all subjects from one grade to another
  const [copyFromGradeId, setCopyFromGradeId] = useState("");
  const handleBulkCopy = async () => {
    if (!selectedGrade || !copyFromGradeId) return;
    const sourceSubjects = subjects.filter(s => s.grade_id === copyFromGradeId && s.is_active);
    const existingNames = currentGradeSubjectNames.map(n => n.toLowerCase());
    const toAdd = sourceSubjects.filter(s => !existingNames.includes(s.name.toLowerCase()));
    if (toAdd.length === 0) {
      toast({ title: "All subjects already exist in this grade" });
      setBulkDialog(false);
      return;
    }
    const inserts = toAdd.map(s => ({
      name: s.name,
      slug: s.slug,
      grade_id: selectedGrade!,
    }));
    const { error } = await supabase.from("subjects").insert(inserts);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${inserts.length} subjects copied!` });
      setBulkDialog(false);
      fetchAll();
    }
  };

  const selectedCurriculumName = curriculums.find(c => c.id === selectedCurriculum)?.name;
  const selectedGradeName = grades.find(g => g.id === selectedGrade)?.name;

  // All grades across all curriculums (for copy from)
  const allOtherGrades = grades.filter(g => g.id !== selectedGrade);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={BookOpen}
        eyebrow="Academic structure"
        title="Curriculum Management"
        description="Manage curriculums, grades, and subjects across the entire catalog."
        accent="primary"
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <span className={selectedCurriculum ? "cursor-pointer hover:text-foreground" : "text-foreground font-medium"} onClick={() => { setSelectedCurriculum(null); setSelectedGrade(null); }}>
          Curriculums
        </span>
        {selectedCurriculum && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className={selectedGrade ? "cursor-pointer hover:text-foreground" : "text-foreground font-medium"} onClick={() => setSelectedGrade(null)}>
              {selectedCurriculumName}
            </span>
          </>
        )}
        {selectedGrade && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{selectedGradeName}</span>
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.editing ? "Edit" : "Add"} {dialog?.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm(f => ({
                    ...f,
                    name,
                    slug: dialog?.editing ? f.slug : generateSlug(name),
                  }));
                }}
                placeholder={`e.g. ${dialog?.type === "curriculum" ? "National Syllabus" : dialog?.type === "grade" ? "Grade 8" : "Mathematics"}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug <span className="text-muted-foreground text-xs">(auto-generated)</span></Label>
              <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
            <Button onClick={handleSave} className="w-full">
              {dialog?.editing ? "Update" : "Create"} {dialog?.type}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Copy Dialog */}
      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Subjects from Another Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a grade to copy all its subjects into <strong>{selectedGradeName}</strong>. Existing subjects won't be duplicated.
            </p>
            <div className="space-y-2">
              <Label>Copy from</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={copyFromGradeId}
                onChange={(e) => setCopyFromGradeId(e.target.value)}
              >
                <option value="">Select a grade...</option>
                {allOtherGrades.map(g => {
                  const curr = curriculums.find(c => c.id === g.curriculum_id);
                  const subCount = subjects.filter(s => s.grade_id === g.id).length;
                  return (
                    <option key={g.id} value={g.id}>
                      {curr?.name} → {g.name} ({subCount} subjects)
                    </option>
                  );
                })}
              </select>
            </div>
            <Button onClick={handleBulkCopy} disabled={!copyFromGradeId} className="w-full gap-1">
              <Copy className="w-4 h-4" /> Copy Subjects
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Curriculums */}
        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Curriculums</CardTitle>
            <Button size="sm" onClick={() => openDialog("curriculum")} className="gap-1">
              <Plus className="w-3 h-3" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {curriculums.map(c => (
              <div
                key={c.id}
                onClick={() => { setSelectedCurriculum(c.id); setSelectedGrade(null); }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCurriculum === c.id ? "bg-primary/10 border border-primary/20" : "bg-muted hover:bg-muted/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={() => toggleActive("curriculums", c.id, c.is_active)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <span className={`text-sm font-medium ${c.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>{c.name}</span>
                    <p className="text-xs text-muted-foreground">{grades.filter(g => g.curriculum_id === c.id).length} grades</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDialog("curriculum", c); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete("curriculums", c.id); }} className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {curriculums.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No curriculums yet</p>}
          </CardContent>
        </Card>

        {/* Grades */}
        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Grades</CardTitle>
            {selectedCurriculum && (
              <Button size="sm" onClick={() => openDialog("grade")} className="gap-1">
                <Plus className="w-3 h-3" /> Add
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedCurriculum ? (
              <p className="text-sm text-muted-foreground text-center py-4">← Select a curriculum</p>
            ) : filteredGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No grades yet. Click Add to create one.</p>
            ) : (
              filteredGrades.map(g => (
                <div
                  key={g.id}
                  onClick={() => setSelectedGrade(g.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedGrade === g.id ? "bg-primary/10 border border-primary/20" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={g.is_active}
                      onCheckedChange={() => toggleActive("grades", g.id, g.is_active)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <span className={`text-sm font-medium ${g.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>{g.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {subjects.filter(s => s.grade_id === g.id && s.is_active).length}/{subjects.filter(s => s.grade_id === g.id).length} subjects active
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDialog("grade", g); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete("grades", g.id); }} className="text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Subjects</CardTitle>
            {selectedGrade && (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => { setCopyFromGradeId(""); setBulkDialog(true); }} className="gap-1 text-xs">
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button size="sm" onClick={() => openDialog("subject")} className="gap-1">
                  <Plus className="w-3 h-3" /> New
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {!selectedGrade ? (
              <p className="text-sm text-muted-foreground text-center py-4">← Select a grade</p>
            ) : (
              <>
                {/* Quick toggle: existing subjects from other grades */}
                {allSubjectNames.length > 0 && (
                  <div className="mb-3 p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
                    <p className="text-xs font-medium text-foreground">Quick add from existing subjects:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allSubjectNames.map(name => {
                        const existsInGrade = filteredSubjects.find(s => s.name === name);
                        const isActive = existsInGrade?.is_active;
                        return (
                          <button
                            key={name}
                            onClick={() => toggleSubjectForGrade(name)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                              existsInGrade && isActive
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : existsInGrade && !isActive
                                ? "bg-muted border-border text-muted-foreground line-through"
                                : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                            }`}
                            type="button"
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredSubjects.length === 0 && allSubjectNames.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No subjects yet. Click New to create one.</p>
                )}

                {filteredSubjects.length > 0 && (
                  <div className="space-y-2">
                    {filteredSubjects.map(s => (
                      <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${s.is_active ? "bg-muted" : "bg-muted/40"}`}>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={s.is_active}
                            onCheckedChange={() => toggleActive("subjects", s.id, s.is_active)}
                          />
                          <span className={`text-sm font-medium ${s.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>{s.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDialog("subject", s)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("subjects", s.id)} className="text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCurriculum;
