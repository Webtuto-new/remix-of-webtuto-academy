import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Video, FileText, CalendarDays } from "lucide-react";
import EmptyState from "@/components/premium/EmptyState";
import { fadeUp, stagger } from "@/lib/motion";

const TeacherSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", session_date: "", start_time: "", end_time: "",
    zoom_link: "", recording_url: "", notes_url: "",
  });

  useEffect(() => {
    if (!user) return;
    loadTeacher();
  }, [user]);

  const loadTeacher = async () => {
    const { data: t } = await supabase.from("teachers").select("*").eq("user_id", user!.id).single();
    if (!t) return;
    setTeacher(t);
    const { data: cls } = await supabase.from("classes").select("id, title").eq("teacher_id", t.id).order("title");
    setClasses(cls || []);
    if (cls?.length) {
      setSelectedClassId(cls[0].id);
      loadSessions(cls[0].id);
    }
  };

  const loadSessions = async (classId: string) => {
    setSelectedClassId(classId);
    const { data } = await supabase.from("class_sessions").select("*").eq("class_id", classId).order("session_date", { ascending: false });
    setSessions(data || []);
  };

  const handleSave = async () => {
    if (!selectedClassId) return;
    const payload = {
      class_id: selectedClassId,
      title: form.title,
      session_date: form.session_date,
      start_time: form.start_time,
      end_time: form.end_time,
      zoom_link: form.zoom_link || null,
      recording_url: form.recording_url || null,
      notes_url: form.notes_url || null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("class_sessions").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("class_sessions").insert(payload));
    }

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editing ? "Session updated!" : "Session created!" });
      setOpen(false);
      setEditing(null);
      setForm({ title: "", session_date: "", start_time: "", end_time: "", zoom_link: "", recording_url: "", notes_url: "" });
      loadSessions(selectedClassId);
    }
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({
      title: s.title, session_date: s.session_date, start_time: s.start_time, end_time: s.end_time,
      zoom_link: s.zoom_link || "", recording_url: s.recording_url || "", notes_url: s.notes_url || "",
    });
    setOpen(true);
  };

  if (!teacher) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted/60 rounded-lg animate-pulse" />
      <div className="h-64 bg-muted/40 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-gradient">Sessions & Zoom</h1>
        {selectedClassId && classes.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Class: <span className="font-medium text-foreground">{classes.find(c => c.id === selectedClassId)?.title}</span>
          </p>
        )}
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button variant="premium" className="gap-1" disabled={!selectedClassId}><Plus className="w-4 h-4" /> Add Session</Button></DialogTrigger>
          <DialogContent className="max-w-lg glass-strong border-border/50">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Session</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Week 1 - Introduction" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.session_date} onChange={(e) => setForm(f => ({ ...f, session_date: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Start</Label><Input type="time" value={form.start_time} onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
                <div className="space-y-2"><Label>End</Label><Input type="time" value={form.end_time} onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Zoom Link</Label><Input value={form.zoom_link} onChange={(e) => setForm(f => ({ ...f, zoom_link: e.target.value }))} placeholder="https://zoom.us/j/..." /></div>
              <div className="space-y-2"><Label>Recording URL</Label><Input value={form.recording_url} onChange={(e) => setForm(f => ({ ...f, recording_url: e.target.value }))} placeholder="Optional recording link" /></div>
              <div className="space-y-2"><Label>Notes URL</Label><Input value={form.notes_url} onChange={(e) => setForm(f => ({ ...f, notes_url: e.target.value }))} placeholder="Optional notes link" /></div>
              <Button onClick={handleSave} className="w-full" variant="premium">{editing ? "Update" : "Create"} Session</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {classes.length > 0 && (
        <Select value={selectedClassId} onValueChange={loadSessions}>
          <SelectTrigger className="w-full md:w-72 glass-strong border-border/50"><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
        </Select>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No sessions yet"
          description="Add your first session for the selected class."
        />
      ) : (
        <Card className="glass-strong border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Time</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Links</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <motion.tbody variants={stagger} initial="hidden" animate="show">
                  {sessions.map((s) => (
                    <motion.tr key={s.id} variants={fadeUp} className="border-b border-border last:border-0 hover:bg-primary/5 transition-colors group">
                      <td className="p-4 font-medium text-foreground">{s.title}</td>
                      <td className="p-4 text-muted-foreground">{s.session_date}</td>
                      <td className="p-4 text-muted-foreground">{s.start_time}–{s.end_time}</td>
                      <td className="p-4 flex gap-1">
                        {s.zoom_link && <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-400 bg-blue-500/10">Zoom</Badge>}
                        {s.recording_url && <Video className="w-4 h-4 text-muted-foreground" />}
                        {s.notes_url && <FileText className="w-4 h-4 text-muted-foreground" />}
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => handleEdit(s)}><Pencil className="w-4 h-4" /></Button>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherSessions;
