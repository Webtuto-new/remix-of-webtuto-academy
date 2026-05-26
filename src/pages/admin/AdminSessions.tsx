import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FileText, Upload, ArrowLeft, Video } from "lucide-react";
import AdminPageHeader from "@/components/premium/AdminPageHeader";
import FileOrLinkInput from "@/components/FileOrLinkInput";

const AdminSessions = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", week_number: "", session_date: "", start_time: "", end_time: "", zoom_link: "", recording_url: "", notes_url: "" });
  const { toast } = useToast();

  // Resources for a session
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [resOpen, setResOpen] = useState(false);
  const [resForm, setResForm] = useState({ title: "", file_url: "", file_type: "pdf" });

  useEffect(() => {
    supabase.from("classes").select("id, title").order("title").then(({ data }) => setClasses(data || []));
  }, []);

  useEffect(() => {
    if (!selectedClass) { setSessions([]); return; }
    fetchSessions();
  }, [selectedClass]);

  const fetchSessions = async () => {
    const { data } = await supabase.from("class_sessions").select("*").eq("class_id", selectedClass).order("session_date");
    setSessions(data || []);
  };

  const fetchResources = async (sessionId: string) => {
    const { data } = await supabase.from("session_resources").select("*").eq("session_id", sessionId).order("created_at");
    setResources(data || []);
  };

  const handleSave = async () => {
    const payload = {
      class_id: selectedClass,
      title: form.title,
      week_number: parseInt(form.week_number) || null,
      session_date: form.session_date,
      start_time: form.start_time,
      end_time: form.end_time,
      zoom_link: form.zoom_link || null,
      recording_url: form.recording_url || null,
      notes_url: form.notes_url || null,
    };
    let error;
    if (editing) ({ error } = await supabase.from("class_sessions").update(payload).eq("id", editing.id));
    else ({ error } = await supabase.from("class_sessions").insert(payload));
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editing ? "Updated!" : "Created!" });
      setOpen(false); setEditing(null);
      setForm({ title: "", week_number: "", session_date: "", start_time: "", end_time: "", zoom_link: "", recording_url: "", notes_url: "" });
      fetchSessions();
    }
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({ title: s.title, week_number: s.week_number?.toString() || "", session_date: s.session_date, start_time: s.start_time, end_time: s.end_time, zoom_link: s.zoom_link || "", recording_url: s.recording_url || "", notes_url: s.notes_url || "" });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("session_resources").delete().eq("session_id", id);
    await supabase.from("class_sessions").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchSessions();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("class_sessions").update({ status }).eq("id", id);
    fetchSessions();
  };

  // Resources
  const openResources = async (session: any) => {
    setSelectedSession(session);
    await fetchResources(session.id);
  };

  const handleAddResource = async () => {
    if (!selectedSession || !resForm.title || !resForm.file_url) {
      toast({ title: "Title and file are required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("session_resources").insert({
      session_id: selectedSession.id,
      title: resForm.title,
      file_url: resForm.file_url,
      file_type: resForm.file_type,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Resource added!" });
      setResOpen(false);
      setResForm({ title: "", file_url: "", file_type: "pdf" });
      fetchResources(selectedSession.id);
    }
  };

  const deleteResource = async (id: string) => {
    await supabase.from("session_resources").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchResources(selectedSession.id);
  };

  // Session detail with resources
  if (selectedSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-gradient">{selectedSession.title}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(selectedSession.session_date).toLocaleDateString()} · {selectedSession.start_time} - {selectedSession.end_time}
            </p>
          </div>
        </div>

        {/* Quick notes URL */}
        {selectedSession.notes_url && (
          <Card className="glass-strong border-white/10">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm text-foreground mb-2">Session Notes</h3>
              <a href={selectedSession.notes_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2">
                <FileText className="w-4 h-4" /> View Notes
              </a>
            </CardContent>
          </Card>
        )}

        {/* Resources */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Resources & Notes ({resources.length})</h2>
          <Dialog open={resOpen} onOpenChange={setResOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="w-3 h-3" /> Add Resource</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Resource</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={resForm.title} onChange={(e) => setResForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 1 Notes" /></div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={resForm.file_type} onChange={(e) => setResForm(f => ({ ...f, file_type: e.target.value }))}>
                    <option value="pdf">PDF</option>
                    <option value="doc">Document</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="link">External Link</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <FileOrLinkInput
                  value={resForm.file_url || null}
                  onChange={(url) => setResForm(f => ({ ...f, file_url: url || "" }))}
                  bucket="thumbnails"
                  folder="resources"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.png,.mp4,.zip"
                  label="File"
                  linkPlaceholder="https://drive.google.com/... or any URL"
                  uploadHint="Drag & drop a file (PDF, Doc, Image, etc.)"
                />
                <Button onClick={handleAddResource} className="w-full">Add Resource</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-strong border-white/10">
          <CardContent className="p-0">
            {resources.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No resources yet. Add notes, PDFs, or other materials.</p>
            ) : (
              <div className="divide-y divide-border">
                {resources.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-4">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.file_type?.toUpperCase()} · {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <a href={r.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline shrink-0">Open</a>
                    <Button variant="ghost" size="sm" onClick={() => deleteResource(r.id)} className="text-destructive shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Video}
        eyebrow="Live operations"
        title="Class Sessions & Zoom"
        description="Schedule sessions, attach Zoom links, and share session notes."
        accent="primary"
        actions={selectedClass ? (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild><Button variant="premium" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Add Session</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Session</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Week 1 - Introduction" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Week #</Label><Input type="number" value={form.week_number} onChange={(e) => setForm(f => ({ ...f, week_number: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.session_date} onChange={(e) => setForm(f => ({ ...f, session_date: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Zoom Meeting Link</Label><Input value={form.zoom_link} onChange={(e) => setForm(f => ({ ...f, zoom_link: e.target.value }))} placeholder="https://zoom.us/j/..." /></div>
                <FileOrLinkInput
                  value={form.notes_url || null}
                  onChange={(url) => setForm(f => ({ ...f, notes_url: url || "" }))}
                  bucket="thumbnails"
                  folder="notes"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
                  label="Session Notes (PDF/Doc)"
                  linkPlaceholder="https://drive.google.com/... or any URL"
                  uploadHint="Drag & drop notes file"
                />
                <div className="space-y-2"><Label>Recording URL (optional)</Label><Input value={form.recording_url} onChange={(e) => setForm(f => ({ ...f, recording_url: e.target.value }))} /></div>
                <Button onClick={handleSave} variant="premium" className="w-full">{editing ? "Update" : "Create"} Session</Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      />

      <div className="space-y-2">
        <Label>Select Class</Label>
        <select className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">— Choose a class —</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {selectedClass && (
        <Card className="glass-strong border-white/10">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Week</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Time</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Zoom</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Notes</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="p-4 text-foreground">{s.week_number || "—"}</td>
                      <td className="p-4 font-medium text-foreground">{s.title}</td>
                      <td className="p-4 text-muted-foreground">{new Date(s.session_date).toLocaleDateString()}</td>
                      <td className="p-4 text-muted-foreground">{s.start_time} - {s.end_time}</td>
                      <td className="p-4">{s.zoom_link ? <a href={s.zoom_link} target="_blank" className="text-primary hover:underline text-xs">Link</a> : "—"}</td>
                      <td className="p-4">
                        {s.notes_url ? (
                          <a href={s.notes_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                            <FileText className="w-3 h-3" /> View
                          </a>
                        ) : "—"}
                      </td>
                      <td className="p-4">
                        <select className="text-xs rounded border border-input bg-background px-2 py-1" value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)}>
                          <option value="scheduled">Scheduled</option>
                          <option value="live">Live</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openResources(s)} title="Manage resources">
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No sessions. Add one above.</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSessions;
