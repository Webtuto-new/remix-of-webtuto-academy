import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ChevronRight, Video, ArrowLeft, User, UserPlus, Search, FileText, Users } from "lucide-react";
import EnrolledStudentsDialog from "@/components/EnrolledStudentsDialog";
import { Badge } from "@/components/ui/badge";
import ThumbnailUpload from "@/components/ThumbnailUpload";
import FileOrLinkInput from "@/components/FileOrLinkInput";
import LessonModuleManager from "@/components/lessons/LessonModuleManager";
import { addDays } from "date-fns";

const AdminRecordings = () => {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [recOpen, setRecOpen] = useState(false);
  const [vidOpen, setVidOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<any>(null);
  const [editingVid, setEditingVid] = useState<any>(null);
  const [recForm, setRecForm] = useState({ title: "", description: "", thumbnail_url: "", price: "", access_duration_days: "365", teacher_id: "", free_preview_url: "", recording_type: "" });
  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", file_url: "", file_type: "pdf" });
  const [vidForm, setVidForm] = useState({ title: "", video_url: "", episode_number: "", duration_minutes: "", chapter_name: "", session_date: "" });
  const { toast } = useToast();

  // Manual enrollment state
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollRecordingId, setEnrollRecordingId] = useState("");
  const [enrollRecordingName, setEnrollRecordingName] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [enrollDays, setEnrollDays] = useState("365");
  const [enrolling, setEnrolling] = useState(false);
  const [studentsDialog, setStudentsDialog] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" });

  const fetchRecordings = async () => {
    const { data } = await supabase.from("recordings").select("*, teachers(name)").order("created_at", { ascending: false });
    setRecordings(data || []);
  };

  const fetchVideos = async (recordingId: string) => {
    const { data } = await supabase.from("recording_videos" as any).select("*").eq("recording_id", recordingId).order("episode_number");
    setVideos(data || []);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase.from("teachers").select("id, name").eq("is_active", true).order("name");
    setTeachers(data || []);
  };

  useEffect(() => { fetchRecordings(); fetchTeachers(); }, []);

  useEffect(() => {
    if (selectedRecording) {
      fetchVideos(selectedRecording.id);
      fetchNotes(selectedRecording.id);
    } else {
      setVideos([]);
      setNotes([]);
    }
  }, [selectedRecording]);

  const fetchNotes = async (recordingId: string) => {
    const { data } = await supabase.from("recording_notes" as any).select("*").eq("recording_id", recordingId).order("created_at");
    setNotes(data || []);
  };

  const handleAddNote = async () => {
    if (!selectedRecording || !noteForm.title || !noteForm.file_url) {
      toast({ title: "Title and file are required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("recording_notes" as any).insert({
      recording_id: selectedRecording.id,
      title: noteForm.title,
      file_url: noteForm.file_url,
      file_type: noteForm.file_type,
    } as any);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Note added!" });
      setNoteOpen(false);
      setNoteForm({ title: "", file_url: "", file_type: "pdf" });
      fetchNotes(selectedRecording.id);
    }
  };

  const deleteNote = async (id: string) => {
    await supabase.from("recording_notes" as any).delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchNotes(selectedRecording.id);
  };

  // Recording CRUD
  const handleSaveRecording = async () => {
    const payload: any = {
      title: recForm.title,
      description: recForm.description || null,
      video_url: "collection",
      thumbnail_url: recForm.thumbnail_url || null,
      price: parseFloat(recForm.price) || 0,
      access_duration_days: parseInt(recForm.access_duration_days) || 365,
      teacher_id: recForm.teacher_id || null,
      free_preview_url: recForm.free_preview_url || null,
      recording_type: recForm.recording_type || null,
    };
    let error;
    if (editingRec) {
      const { video_url, ...updatePayload } = payload;
      ({ error } = await supabase.from("recordings").update(updatePayload).eq("id", editingRec.id));
    } else {
      ({ error } = await supabase.from("recordings").insert(payload));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editingRec ? "Updated!" : "Created!" });
      setRecOpen(false);
      setEditingRec(null);
      setRecForm({ title: "", description: "", thumbnail_url: "", price: "", access_duration_days: "365", teacher_id: "", free_preview_url: "", recording_type: "" });
      fetchRecordings();
    }
  };

  const openEditRecording = (r: any) => {
    setEditingRec(r);
    setRecForm({
      title: r.title,
      description: r.description || "",
      thumbnail_url: r.thumbnail_url || "",
      price: r.price?.toString() || "",
      access_duration_days: r.access_duration_days?.toString() || "365",
      teacher_id: r.teacher_id || "",
      free_preview_url: (r as any).free_preview_url || "",
      recording_type: (r as any).recording_type || "",
    });
    setRecOpen(true);
  };

  const deleteRecording = async (id: string) => {
    const { data: enrollments } = await supabase.from("enrollments").select("id").eq("recording_id", id);
    const enrollmentIds = (enrollments || []).map(e => e.id);
    if (enrollmentIds.length > 0) {
      await supabase.from("payments").delete().in("enrollment_id", enrollmentIds);
    }
    await supabase.from("enrollments").delete().eq("recording_id", id);
    const { error } = await supabase.from("recordings").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); if (selectedRecording?.id === id) setSelectedRecording(null); fetchRecordings(); }
  };

  // Video CRUD
  const handleSaveVideo = async () => {
    if (!selectedRecording) return;
    const payload: any = {
      title: vidForm.title,
      video_url: vidForm.video_url,
      episode_number: parseInt(vidForm.episode_number) || null,
      duration_minutes: parseInt(vidForm.duration_minutes) || null,
      recording_id: selectedRecording.id,
      chapter_name: vidForm.chapter_name || null,
      session_date: vidForm.session_date || null,
    };
    let error;
    if (editingVid) {
      const { recording_id, ...updatePayload } = payload;
      ({ error } = await supabase.from("recording_videos" as any).update(updatePayload).eq("id", editingVid.id));
    } else {
      ({ error } = await supabase.from("recording_videos" as any).insert(payload));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editingVid ? "Updated!" : "Added!" });
      setVidOpen(false);
      setEditingVid(null);
      setVidForm({ title: "", video_url: "", episode_number: "", duration_minutes: "", chapter_name: "", session_date: "" });
      fetchVideos(selectedRecording.id);
    }
  };

  const openEditVideo = (v: any) => {
    setEditingVid(v);
    setVidForm({
      title: v.title,
      video_url: v.video_url,
      episode_number: v.episode_number?.toString() || "",
      duration_minutes: v.duration_minutes?.toString() || "",
      chapter_name: v.chapter_name || "",
      session_date: v.session_date || "",
    });
    setVidOpen(true);
  };

  const toggleVideoActive = async (v: any) => {
    await supabase.from("recording_videos" as any).update({ is_active: !v.is_active }).eq("id", v.id);
    fetchVideos(selectedRecording.id);
  };

  const openEnrollDialog = (recId: string, recName: string) => {
    setEnrollRecordingId(recId);
    setEnrollRecordingName(recName);
    setStudentSearch("");
    setStudentResults([]);
    setEnrollDays("365");
    setEnrollOpen(true);
  };

  const searchStudentsRec = async (q: string) => {
    setStudentSearch(q);
    if (q.length < 2) { setStudentResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, full_name, email, admission_number")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,admission_number.ilike.%${q}%`)
      .limit(10);
    setStudentResults(data || []);
  };

  const handleManualEnrollRec = async (studentId: string) => {
    setEnrolling(true);
    try {
      const { data: existing } = await supabase.from("enrollments")
        .select("id").eq("user_id", studentId).eq("recording_id", enrollRecordingId).eq("status", "active").maybeSingle();
      if (existing) {
        toast({ title: "Already enrolled", description: "This student already has access to this recording", variant: "destructive" });
        setEnrolling(false);
        return;
      }
      const expiresAt = addDays(new Date(), parseInt(enrollDays) || 365).toISOString();
      const { error } = await supabase.from("enrollments").insert({
        user_id: studentId, recording_id: enrollRecordingId, status: "active", expires_at: expiresAt,
      });
      if (error) throw error;
      toast({ title: "Student enrolled successfully!" });
      setEnrollOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  const deleteVideo = async (id: string) => {
    const { error } = await supabase.from("recording_videos" as any).delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchVideos(selectedRecording.id); }
  };

  // Detail view for a selected recording
  if (selectedRecording) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedRecording(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-gradient">{selectedRecording.title}</h1>
            <p className="text-sm text-muted-foreground">LKR {selectedRecording.price} · {videos.length} lessons</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Lessons</h2>
          <Dialog open={vidOpen} onOpenChange={(v) => { setVidOpen(v); if (!v) setEditingVid(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-3 h-3" /> Add Lesson</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingVid ? "Edit" : "Add"} Lesson</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={vidForm.title} onChange={(e) => setVidForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Lesson 1 - Introduction" /></div>
                <FileOrLinkInput value={vidForm.video_url || null} onChange={(url) => setVidForm(f => ({ ...f, video_url: url || "" }))} bucket="videos" folder="recordings" accept="video/*" label="Video" linkPlaceholder="https://youtube.com/watch?v=... or direct video URL" uploadHint="Drag & drop a video file (up to 500MB)" previewType="video" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Lesson #</Label><Input type="number" value={vidForm.episode_number} onChange={(e) => setVidForm(f => ({ ...f, episode_number: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={vidForm.duration_minutes} onChange={(e) => setVidForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Chapter (optional)</Label><Input value={vidForm.chapter_name} onChange={(e) => setVidForm(f => ({ ...f, chapter_name: e.target.value }))} placeholder="e.g. Algebra Basics" /></div>
                  <div className="space-y-2"><Label>Session Date (optional)</Label><Input type="date" value={vidForm.session_date} onChange={(e) => setVidForm(f => ({ ...f, session_date: e.target.value }))} /></div>
                </div>
                <Button onClick={handleSaveVideo} className="w-full">{editingVid ? "Update" : "Add"} Lesson</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-strong border-white/10">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground w-12">#</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground hidden sm:table-cell">Duration</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground">Active</th>
                    <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((v: any) => (
                    <tr key={v.id} className={`border-b border-border last:border-0 ${!v.is_active ? "opacity-50" : ""}`}>
                      <td className="p-3 sm:p-4 text-muted-foreground">{v.episode_number || "—"}</td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">{v.title}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-muted-foreground hidden sm:table-cell">{v.duration_minutes ? `${v.duration_minutes}min` : "—"}</td>
                      <td className="p-3 sm:p-4">
                        <Switch checked={v.is_active} onCheckedChange={() => toggleVideoActive(v)} />
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditVideo(v)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteVideo(v.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {videos.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No lessons yet. Click "Add Lesson" to get started.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Notes Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Notes & Materials ({notes.length})</h2>
          <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-3 h-3" /> Add Note</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Note / Material</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={noteForm.title} onChange={(e) => setNoteForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 1 Notes" /></div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={noteForm.file_type} onChange={(e) => setNoteForm(f => ({ ...f, file_type: e.target.value }))}>
                    <option value="pdf">PDF</option>
                    <option value="doc">Document</option>
                    <option value="image">Image</option>
                    <option value="link">External Link</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <FileOrLinkInput
                  value={noteForm.file_url || null}
                  onChange={(url) => setNoteForm(f => ({ ...f, file_url: url || "" }))}
                  bucket="thumbnails"
                  folder="recording-notes"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png,.zip"
                  label="File"
                  linkPlaceholder="https://drive.google.com/... or any URL"
                  uploadHint="Drag & drop a file (PDF, Doc, etc.)"
                />
                <Button onClick={handleAddNote} className="w-full">Add Note</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-strong border-white/10">
          <CardContent className="p-0">
            {notes.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No notes yet. Add PDFs, documents, or other materials for students.</p>
            ) : (
              <div className="divide-y divide-border">
                {notes.map((n: any) => (
                  <div key={n.id} className="flex items-center gap-3 p-4">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.file_type?.toUpperCase()} · {new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                    <a href={n.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline shrink-0">Open</a>
                    <Button variant="ghost" size="sm" onClick={() => deleteNote(n.id)} className="text-destructive shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgraded Lesson / Module system */}
        <div className="pt-2">
          <LessonModuleManager parent={{ kind: "recording", id: selectedRecording.id }} />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gradient">Manage Recordings</h1>
        <Dialog open={recOpen} onOpenChange={(v) => { setRecOpen(v); if (!v) setEditingRec(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-1 w-full sm:w-auto"><Plus className="w-4 h-4" /> Add Recording</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingRec ? "Edit" : "New"} Recording</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <ThumbnailUpload value={recForm.thumbnail_url || null} onChange={(url) => setRecForm(f => ({ ...f, thumbnail_url: url || "" }))} title={recForm.title} folder="recordings" />
              <div className="space-y-2"><Label>Title</Label><Input value={recForm.title} onChange={(e) => setRecForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Physics Grade 11 - Complete Course" /></div>
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={recForm.teacher_id} onValueChange={(v) => setRecForm(f => ({ ...f, teacher_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Description</Label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} value={recForm.description} onChange={(e) => setRecForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price (LKR)</Label><Input type="number" value={recForm.price} onChange={(e) => setRecForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Access (days)</Label><Input type="number" value={recForm.access_duration_days} onChange={(e) => setRecForm(f => ({ ...f, access_duration_days: e.target.value }))} /></div>
              </div>
              <div className="space-y-2">
                <Label>Free Preview Video (optional)</Label>
                <Input value={recForm.free_preview_url} onChange={(e) => setRecForm(f => ({ ...f, free_preview_url: e.target.value }))} placeholder="https://youtube.com/watch?v=... (free sample for non-buyers)" />
                <p className="text-xs text-muted-foreground">Users who haven't purchased can watch this preview video</p>
              </div>
              <div className="space-y-2">
                <Label>Type Label (optional)</Label>
                <Input value={recForm.recording_type} onChange={(e) => setRecForm(f => ({ ...f, recording_type: e.target.value }))} placeholder="e.g. Workshop, Course, Masterclass (leave blank for 'Recording')" />
                <p className="text-xs text-muted-foreground">Custom label shown as a badge — leave empty to show "Recording"</p>
              </div>
              <Button onClick={handleSaveRecording} className="w-full">{editingRec ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recordings.map(r => (
          <Card key={r.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedRecording(r)}>
            {r.thumbnail_url && (
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className={`${r.thumbnail_url ? "pt-4" : "pt-6"} pb-4`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Badge variant="outline" className="text-[10px] mb-1">{(r as any).recording_type || "Recording"}</Badge>
                  <h3 className="font-semibold text-foreground truncate">{r.title}</h3>
                  {r.teachers?.name && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" /> {r.teachers.name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">LKR {r.price}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setStudentsDialog({ open: true, id: r.id, title: r.title }); }} title="View Students">
                    <Users className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEnrollDialog(r.id, r.title); }} title="Enroll Student">
                    <UserPlus className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditRecording(r); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteRecording(r.id); }} className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Video className="w-3 h-3" />
                <span>Click to manage lessons</span>
                <ChevronRight className="w-3 h-3 ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
        {recordings.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No recordings yet. Create one to get started.
          </div>
        )}
      </div>

      {/* Manual Enrollment Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enroll Student — {enrollRecordingName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Name, email, or admission #..." value={studentSearch} onChange={(e) => searchStudentsRec(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Access Duration (days)</Label>
              <Input type="number" value={enrollDays} onChange={(e) => setEnrollDays(e.target.value)} />
            </div>
            {studentResults.length > 0 && (
              <div className="border border-border rounded-md max-h-48 overflow-y-auto divide-y divide-border">
                {studentResults.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.full_name || "No name"}</p>
                      <p className="text-xs text-muted-foreground">{s.email} · {s.admission_number || "—"}</p>
                    </div>
                    <Button size="sm" disabled={enrolling} onClick={() => handleManualEnrollRec(s.id)}>
                      <UserPlus className="w-3 h-3 mr-1" /> Enroll
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {studentSearch.length >= 2 && studentResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <EnrolledStudentsDialog
        open={studentsDialog.open}
        onOpenChange={(v) => setStudentsDialog(s => ({ ...s, open: v }))}
        title={studentsDialog.title}
        resourceType="recording"
        resourceId={studentsDialog.id}
      />
    </div>
  );
};

export default AdminRecordings;