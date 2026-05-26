import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Plus, Pencil, ArrowLeft, Trash2, FileText, Video, Disc3 } from "lucide-react";
import ThumbnailUpload from "@/components/ThumbnailUpload";
import FileOrLinkInput from "@/components/FileOrLinkInput";
import LessonModuleManager from "@/components/lessons/LessonModuleManager";
import EnrolledStudentsDialog from "@/components/EnrolledStudentsDialog";
import CreateStudentDialog from "@/components/CreateStudentDialog";
import EmptyState from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const TeacherRecordings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<any>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Dialogs
  const [recOpen, setRecOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<any>(null);
  const [vidOpen, setVidOpen] = useState(false);
  const [editingVid, setEditingVid] = useState<any>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [studentsDialog, setStudentsDialog] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" });
  const [enrollDialog, setEnrollDialog] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" });

  // Forms
  const [recForm, setRecForm] = useState({ title: "", description: "", thumbnail_url: "", price: "", access_duration_days: "365", free_preview_url: "", recording_type: "" });
  const [vidForm, setVidForm] = useState({ title: "", video_url: "", episode_number: "", duration_minutes: "", chapter_name: "", session_date: "" });
  const [noteForm, setNoteForm] = useState({ title: "", file_url: "", file_type: "pdf" });

  useEffect(() => {
    if (!user) return;
    loadTeacher();
  }, [user]);

  const loadTeacher = async () => {
    const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).single();
    if (!t) return;
    setTeacher(t);
    fetchRecordings(t.id);
  };

  const fetchRecordings = async (teacherId: string) => {
    const { data } = await supabase.from("recordings").select("*").eq("teacher_id", teacherId).order("created_at", { ascending: false });
    setRecordings(data || []);
  };

  const fetchVideos = async (recordingId: string) => {
    const { data } = await supabase.from("recording_videos" as any).select("*").eq("recording_id", recordingId).order("episode_number");
    setVideos(data || []);
  };

  const fetchNotes = async (recordingId: string) => {
    const { data } = await supabase.from("recording_notes" as any).select("*").eq("recording_id", recordingId).order("created_at");
    setNotes(data || []);
  };

  useEffect(() => {
    if (selectedRecording) {
      fetchVideos(selectedRecording.id);
      fetchNotes(selectedRecording.id);
    } else {
      setVideos([]);
      setNotes([]);
    }
  }, [selectedRecording]);

  // Recording CRUD
  const resetRecForm = () => setRecForm({ title: "", description: "", thumbnail_url: "", price: "", access_duration_days: "365", free_preview_url: "", recording_type: "" });

  const handleSaveRecording = async () => {
    if (!teacher) return;
    const payload: any = {
      title: recForm.title,
      description: recForm.description || null,
      video_url: "collection",
      thumbnail_url: recForm.thumbnail_url || null,
      price: parseFloat(recForm.price) || 0,
      access_duration_days: parseInt(recForm.access_duration_days) || 365,
      teacher_id: teacher.id,
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
      resetRecForm();
      fetchRecordings(teacher.id);
    }
  };

  const openEditRecording = (r: any) => {
    setEditingRec(r);
    setRecForm({
      title: r.title, description: r.description || "", thumbnail_url: r.thumbnail_url || "",
      price: r.price?.toString() || "", access_duration_days: r.access_duration_days?.toString() || "365",
      free_preview_url: r.free_preview_url || "", recording_type: r.recording_type || "",
    });
    setRecOpen(true);
  };

  // Video CRUD
  const handleSaveVideo = async () => {
    if (!selectedRecording) return;
    const payload: any = {
      title: vidForm.title, video_url: vidForm.video_url,
      episode_number: parseInt(vidForm.episode_number) || null,
      duration_minutes: parseInt(vidForm.duration_minutes) || null,
      recording_id: selectedRecording.id,
      chapter_name: vidForm.chapter_name || null,
      session_date: vidForm.session_date || null,
    };
    let error;
    if (editingVid) {
      const { recording_id, ...upd } = payload;
      ({ error } = await supabase.from("recording_videos" as any).update(upd).eq("id", editingVid.id));
    } else {
      ({ error } = await supabase.from("recording_videos" as any).insert(payload));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editingVid ? "Updated!" : "Added!" });
      setVidOpen(false); setEditingVid(null);
      setVidForm({ title: "", video_url: "", episode_number: "", duration_minutes: "", chapter_name: "", session_date: "" });
      fetchVideos(selectedRecording.id);
    }
  };

  const deleteVideo = async (id: string) => {
    await supabase.from("recording_videos" as any).delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchVideos(selectedRecording.id);
  };

  const toggleVideoActive = async (v: any) => {
    await supabase.from("recording_videos" as any).update({ is_active: !v.is_active }).eq("id", v.id);
    fetchVideos(selectedRecording.id);
  };

  // Notes CRUD
  const handleAddNote = async () => {
    if (!selectedRecording || !noteForm.title || !noteForm.file_url) {
      toast({ title: "Title and file are required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("recording_notes" as any).insert({
      recording_id: selectedRecording.id, title: noteForm.title, file_url: noteForm.file_url, file_type: noteForm.file_type,
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

  if (!teacher) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted/60 rounded-lg animate-pulse" />
      <div className="h-64 bg-muted/40 rounded-2xl animate-pulse" />
    </div>
  );

  // Detail view
  if (selectedRecording) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => setSelectedRecording(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-gradient">{selectedRecording.title}</h1>
            <p className="text-sm text-muted-foreground">LKR {selectedRecording.price} · {videos.length} lessons · {notes.length} notes</p>
          </div>
        </div>

        {/* Lessons */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Lessons</h2>
          <Dialog open={vidOpen} onOpenChange={(v) => { setVidOpen(v); if (!v) setEditingVid(null); }}>
            <DialogTrigger asChild><Button size="sm" variant="premium" className="gap-1"><Plus className="w-3 h-3" /> Add Lesson</Button></DialogTrigger>
            <DialogContent className="glass-strong border-border/50">
              <DialogHeader><DialogTitle>{editingVid ? "Edit" : "Add"} Lesson</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={vidForm.title} onChange={(e) => setVidForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Lesson 1 - Introduction" /></div>
                <FileOrLinkInput value={vidForm.video_url || null} onChange={(url) => setVidForm(f => ({ ...f, video_url: url || "" }))} bucket="videos" folder="recordings" accept="video/*" label="Video" linkPlaceholder="https://youtube.com/watch?v=..." previewType="video" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Lesson #</Label><Input type="number" value={vidForm.episode_number} onChange={(e) => setVidForm(f => ({ ...f, episode_number: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={vidForm.duration_minutes} onChange={(e) => setVidForm(f => ({ ...f, duration_minutes: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Chapter (optional)</Label><Input value={vidForm.chapter_name} onChange={(e) => setVidForm(f => ({ ...f, chapter_name: e.target.value }))} placeholder="e.g. Algebra Basics" /></div>
                  <div className="space-y-2"><Label>Session Date (optional)</Label><Input type="date" value={vidForm.session_date} onChange={(e) => setVidForm(f => ({ ...f, session_date: e.target.value }))} /></div>
                </div>
                <Button onClick={handleSaveVideo} className="w-full" variant="premium">{editingVid ? "Update" : "Add"} Lesson</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-strong border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground w-12">#</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Duration</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Active</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {videos.map((v: any) => (
                    <motion.tr key={v.id} variants={fadeUp} className="border-b border-border last:border-0 hover:bg-primary/5 transition-colors group">
                      <td className="p-3 text-muted-foreground">{v.episode_number || "—"}</td>
                      <td className="p-3 font-medium text-foreground">{v.title}</td>
                      <td className="p-3 text-muted-foreground hidden sm:table-cell">{v.duration_minutes ? `${v.duration_minutes} min` : "—"}</td>
                      <td className="p-3"><Switch checked={v.is_active} onCheckedChange={() => toggleVideoActive(v)} /></td>
                      <td className="p-3 flex gap-1">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => { setEditingVid(v); setVidForm({ title: v.title, video_url: v.video_url, episode_number: v.episode_number?.toString() || "", duration_minutes: v.duration_minutes?.toString() || "", chapter_name: v.chapter_name || "", session_date: v.session_date || "" }); setVidOpen(true); }}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteVideo(v.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                      </td>
                    </motion.tr>
                  ))}
                  {videos.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No lessons yet.</td></tr>}
                </motion.tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Notes & Materials</h2>
          <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
            <DialogTrigger asChild><Button size="sm" variant="premium" className="gap-1"><Plus className="w-3 h-3" /> Add Note</Button></DialogTrigger>
            <DialogContent className="glass-strong border-border/50">
              <DialogHeader><DialogTitle>Add Note / Material</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={noteForm.title} onChange={(e) => setNoteForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Lecture Notes Week 1" /></div>
                <FileOrLinkInput value={noteForm.file_url || null} onChange={(url) => setNoteForm(f => ({ ...f, file_url: url || "" }))} bucket="videos" folder="notes" accept=".pdf,.doc,.docx,.ppt,.pptx" label="File" linkPlaceholder="https://drive.google.com/..." />
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input value={noteForm.file_type} onChange={(e) => setNoteForm(f => ({ ...f, file_type: e.target.value }))} placeholder="pdf, doc, link" />
                </div>
                <Button onClick={handleAddNote} className="w-full" variant="premium">Add Note</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-strong border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {notes.map((n: any) => (
                <div key={n.id} className="flex items-center justify-between p-3 hover:bg-primary/5 transition-colors group">
                  <div>
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.file_type}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" asChild><a href={n.file_url} target="_blank" rel="noreferrer">View</a></Button>
                    <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteNote(n.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </div>
              ))}
              {notes.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No notes yet.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Lesson Module system */}
        <div className="pt-2">
          <LessonModuleManager parent={{ kind: "recording", id: selectedRecording.id }} />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gradient">My Recordings</h1>
        <Dialog open={recOpen} onOpenChange={(v) => { setRecOpen(v); if (!v) { setEditingRec(null); resetRecForm(); } }}>
          <DialogTrigger asChild><Button variant="premium" className="gap-1"><Plus className="w-4 h-4" /> Create Recording</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto glass-strong border-border/50">
            <DialogHeader><DialogTitle>{editingRec ? "Edit" : "Create"} Recording</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={recForm.title} onChange={(e) => setRecForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={recForm.description} onChange={(e) => setRecForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Price (LKR)</Label><Input type="number" value={recForm.price} onChange={(e) => setRecForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Access Days</Label><Input type="number" value={recForm.access_duration_days} onChange={(e) => setRecForm(f => ({ ...f, access_duration_days: e.target.value }))} /></div>
              </div>
              <div className="space-y-2">
                <Label>Type Label (optional)</Label>
                <Input value={recForm.recording_type} onChange={(e) => setRecForm(f => ({ ...f, recording_type: e.target.value }))} placeholder="e.g. Workshop, Course, Masterclass" />
                <p className="text-xs text-muted-foreground">Leave blank for default "Recording"</p>
              </div>
              <FileOrLinkInput value={recForm.free_preview_url || null} onChange={(url) => setRecForm(f => ({ ...f, free_preview_url: url || "" }))} bucket="videos" folder="previews" accept="video/*" label="Free Preview Video" linkPlaceholder="https://youtube.com/watch?v=..." previewType="video" />
              <ThumbnailUpload value={recForm.thumbnail_url || null} onChange={(url) => setRecForm(f => ({ ...f, thumbnail_url: url || "" }))} title={recForm.title} />
              <Button onClick={handleSaveRecording} className="w-full" variant="premium">{editingRec ? "Update" : "Create"} Recording</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {recordings.length === 0 ? (
        <EmptyState
          icon={Disc3}
          title="No recordings yet"
          description="Create your first recording to start sharing lessons with students."
          action={
            <Dialog open={recOpen} onOpenChange={setRecOpen}>
              <DialogTrigger asChild><Button variant="premium" className="gap-1"><Plus className="w-4 h-4" /> Create Recording</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto glass-strong border-border/50">
                <DialogHeader><DialogTitle>Create Recording</DialogTitle></DialogHeader>
              </DialogContent>
            </Dialog>
          }
        />
      ) : (
        <Card className="glass-strong border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {recordings.map((r) => (
                    <motion.tr key={r.id} variants={fadeUp} className="border-b border-border last:border-0 cursor-pointer hover:bg-primary/5 transition-colors group" onClick={() => setSelectedRecording(r)}>
                      <td className="p-4 font-medium text-foreground">{r.title}</td>
                      <td className="p-4 text-muted-foreground">LKR {r.price}</td>
                      <td className="p-4">{r.recording_type ? <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">{r.recording_type}</Badge> : <span className="text-muted-foreground">Recording</span>}</td>
                      <td className="p-4"><Badge variant={r.is_active ? "default" : "secondary"} className={r.is_active ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : ""}>{r.is_active ? "Active" : "Inactive"}</Badge></td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => setStudentsDialog({ open: true, id: r.id, title: r.title })} title="View Students"><Users className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => setEnrollDialog({ open: true, id: r.id, title: r.title })} title="Add Student"><UserPlus className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => openEditRecording(r)}><Pencil className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <EnrolledStudentsDialog
        open={studentsDialog.open}
        onOpenChange={(v) => setStudentsDialog(s => ({ ...s, open: v }))}
        title={studentsDialog.title}
        resourceType="recording"
        resourceId={studentsDialog.id}
      />

      <CreateStudentDialog
        open={enrollDialog.open}
        onOpenChange={(v) => setEnrollDialog(s => ({ ...s, open: v }))}
        enrollInto={{ type: "recording", id: enrollDialog.id, name: enrollDialog.title, days: "365" }}
      />
    </div>
  );
};

export default TeacherRecordings;
