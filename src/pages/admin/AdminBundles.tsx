import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import ThumbnailUpload from "@/components/ThumbnailUpload";
import AdminPageHeader from "@/components/premium/AdminPageHeader";

const AdminBundles = () => {
  const [bundles, setBundles] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "", original_price: "", thumbnail_url: "" as string | null });
  const [bundleClasses, setBundleClasses] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchBundles = async () => {
    const { data } = await supabase.from("bundles").select("*").order("created_at", { ascending: false });
    setBundles(data || []);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("id, title, teachers(name)").eq("is_active", true).order("title");
    setClasses(data || []);
  };

  useEffect(() => { fetchBundles(); fetchClasses(); }, []);

  const openEdit = async (b: any) => {
    setEditing(b);
    setForm({ title: b.title, description: b.description || "", price: b.price?.toString() || "", original_price: b.original_price?.toString() || "", thumbnail_url: b.thumbnail_url || null });
    // Fetch bundle classes
    const { data } = await supabase.from("bundle_classes").select("class_id").eq("bundle_id", b.id);
    setBundleClasses((data || []).map(bc => bc.class_id));
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      original_price: parseFloat(form.original_price) || null,
      thumbnail_url: form.thumbnail_url || null,
    };
    let error;
    let bundleId: string;
    if (editing) {
      ({ error } = await supabase.from("bundles").update(payload).eq("id", editing.id));
      bundleId = editing.id;
    } else {
      const res = await supabase.from("bundles").insert(payload).select("id").single();
      error = res.error;
      bundleId = res.data?.id || "";
    }
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    // Update bundle_classes
    await supabase.from("bundle_classes").delete().eq("bundle_id", bundleId);
    if (bundleClasses.length > 0) {
      await supabase.from("bundle_classes").insert(bundleClasses.map(cid => ({ bundle_id: bundleId, class_id: cid })));
    }

    toast({ title: editing ? "Updated!" : "Created!" });
    setOpen(false); setEditing(null);
    setForm({ title: "", description: "", price: "", original_price: "", thumbnail_url: null });
    setBundleClasses([]);
    fetchBundles();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("bundles").update({ is_active: !current }).eq("id", id);
    fetchBundles();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bundle_classes").delete().eq("bundle_id", id);
    await supabase.from("bundles").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchBundles();
  };

  const toggleClass = (classId: string) => {
    setBundleClasses(prev => prev.includes(classId) ? prev.filter(c => c !== classId) : [...prev, classId]);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Package}
        eyebrow="Multi-class offerings"
        title="Manage Bundles"
        description="Group multiple classes into discounted bundles for students."
        accent="secondary"
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setBundleClasses([]); setForm({ title: "", description: "", price: "", original_price: "", thumbnail_url: null }); } }}>
            <DialogTrigger asChild><Button variant="premium" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Add Bundle</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Bundle</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <ThumbnailUpload value={form.thumbnail_url} onChange={(url) => setForm(f => ({ ...f, thumbnail_url: url }))} title={form.title} folder="bundles" />
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Science Bundle Grade 10" /></div>
              <div className="space-y-2"><Label>Description</Label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Bundle Price (LKR)</Label><Input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Original Price (LKR)</Label><Input type="number" value={form.original_price} onChange={(e) => setForm(f => ({ ...f, original_price: e.target.value }))} placeholder="For strikethrough" /></div>
              </div>
              <div className="space-y-2">
                <Label>Classes in Bundle ({bundleClasses.length} selected)</Label>
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                      <input type="checkbox" checked={bundleClasses.includes(c.id)} onChange={() => toggleClass(c.id)} className="rounded" />
                      <span className="text-foreground">{c.title}</span>
                      {(c as any).teachers?.name && <span className="text-xs text-muted-foreground">— {(c as any).teachers.name}</span>}
                    </label>
                  ))}
                  {classes.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No active classes.</p>}
                </div>
              </div>
              <Button onClick={handleSave} variant="premium" className="w-full">{editing ? "Update" : "Create"} Bundle</Button>
            </div>
          </DialogContent>
          </Dialog>
        }
      />

      <Card className="glass-strong border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Original</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Active</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {bundles.map(b => (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-foreground">{b.title}</td>
                    <td className="p-4 text-foreground">LKR {b.price}</td>
                    <td className="p-4 text-muted-foreground">{b.original_price ? `LKR ${b.original_price}` : "—"}</td>
                    <td className="p-4"><Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id, b.is_active)} /></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bundles.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No bundles yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBundles;
