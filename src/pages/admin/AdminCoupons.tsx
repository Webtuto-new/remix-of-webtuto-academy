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

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: "", discount_percent: "", discount_amount: "", max_uses: "", expires_at: "" });
  const { toast } = useToast();

  const fetchCoupons = () => {
    supabase.from("coupons").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setCoupons(data || []));
  };
  useEffect(() => { fetchCoupons(); }, []);

  const handleSave = async () => {
    const payload = {
      code: form.code.toUpperCase(),
      discount_percent: parseInt(form.discount_percent) || null,
      discount_amount: parseFloat(form.discount_amount) || null,
      max_uses: parseInt(form.max_uses) || null,
      expires_at: form.expires_at || null,
    };
    let error;
    if (editing) ({ error } = await supabase.from("coupons").update(payload).eq("id", editing.id));
    else ({ error } = await supabase.from("coupons").insert(payload));
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved!" }); setOpen(false); setEditing(null); setForm({ code: "", discount_percent: "", discount_amount: "", max_uses: "", expires_at: "" }); fetchCoupons(); }
  };

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({
      code: c.code,
      discount_percent: c.discount_percent?.toString() || "",
      discount_amount: c.discount_amount?.toString() || "",
      max_uses: c.max_uses?.toString() || "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
    });
    setOpen(true);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("coupons").update({ is_active: !current }).eq("id", id);
    fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gradient">Coupons</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm({ code: "", discount_percent: "", discount_amount: "", max_uses: "", expires_at: "" }); } }}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="w-4 h-4" /> Add Coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Code</Label><Input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} placeholder="SAVE20" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Discount %</Label><Input type="number" value={form.discount_percent} onChange={(e) => setForm(f => ({ ...f, discount_percent: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Discount Amount (LKR)</Label><Input type="number" value={form.discount_amount} onChange={(e) => setForm(f => ({ ...f, discount_amount: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Max Uses</Label><Input type="number" value={form.max_uses} onChange={(e) => setForm(f => ({ ...f, max_uses: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Expires At</Label><Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Code</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Discount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Used</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Expires</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Active</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-mono font-medium text-foreground">{c.code}</td>
                    <td className="p-4 text-foreground">{c.discount_percent ? `${c.discount_percent}%` : c.discount_amount ? `LKR ${c.discount_amount}` : "—"}</td>
                    <td className="p-4 text-muted-foreground">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                    <td className="p-4 text-muted-foreground text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td>
                    <td className="p-4"><Switch checked={c.is_active} onCheckedChange={() => toggleActive(c.id, c.is_active)} /></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={async () => { await supabase.from("coupons").delete().eq("id", c.id); fetchCoupons(); }} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No coupons.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoupons;
