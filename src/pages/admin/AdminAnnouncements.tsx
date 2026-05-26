import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const AdminAnnouncements = () => {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const { toast } = useToast();

  const fetchItems = () => {
    supabase.from("announcements").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setItems(data || []));
  };
  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    let error;
    if (editing) {
      ({ error } = await supabase.from("announcements").update({ title: form.title, content: form.content }).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("announcements").insert({ title: form.title, content: form.content }));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Updated!" : "Published!" }); setOpen(false); setEditing(null); setForm({ title: "", content: "" }); fetchItems(); }
  };

  const handleEdit = (a: any) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content });
    setOpen(true);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("announcements").update({ is_active: !current }).eq("id", id);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gradient">Announcements</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm({ title: "", content: "" }); } }}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="w-4 h-4" /> New</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Content</Label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={4} value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} /></div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Publish"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {items.map(a => (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-foreground">{a.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.id, a.is_active)} />
                <Button variant="ghost" size="sm" onClick={() => handleEdit(a)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={async () => { await supabase.from("announcements").delete().eq("id", a.id); fetchItems(); }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">No announcements.</CardContent></Card>}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
