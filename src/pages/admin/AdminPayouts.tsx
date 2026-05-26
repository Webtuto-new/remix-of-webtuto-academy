import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ teacher_id: "", amount: "", period_start: "", period_end: "", notes: "" });
  const { toast } = useToast();

  const fetchPayouts = () => {
    supabase.from("teacher_payouts").select("*, teachers(name)").order("created_at", { ascending: false })
      .then(({ data }) => setPayouts(data || []));
  };

  useEffect(() => {
    fetchPayouts();
    supabase.from("teachers").select("id, name").order("name").then(({ data }) => setTeachers(data || []));
  }, []);

  const handleSave = async () => {
    const payload = {
      teacher_id: form.teacher_id,
      amount: parseFloat(form.amount),
      period_start: form.period_start,
      period_end: form.period_end,
      notes: form.notes || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("teacher_payouts").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("teacher_payouts").insert(payload));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "Updated!" : "Payout created!" }); setOpen(false); setEditing(null); setForm({ teacher_id: "", amount: "", period_start: "", period_end: "", notes: "" }); fetchPayouts(); }
  };

  const handleEdit = (p: any) => {
    setEditing(p);
    setForm({
      teacher_id: p.teacher_id,
      amount: p.amount?.toString() || "",
      period_start: p.period_start,
      period_end: p.period_end,
      notes: p.notes || "",
    });
    setOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("teacher_payouts").update({ status }).eq("id", id);
    fetchPayouts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("teacher_payouts").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchPayouts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gradient">Teacher Payouts</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm({ teacher_id: "", amount: "", period_start: "", period_end: "", notes: "" }); } }}>
          <DialogTrigger asChild><Button className="gap-1"><Plus className="w-4 h-4" /> New Payout</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Create"} Payout</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Teacher</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.teacher_id} onChange={(e) => setForm(f => ({ ...f, teacher_id: e.target.value }))}>
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Amount (LKR)</Label><Input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Period Start</Label><Input type="date" value={form.period_start} onChange={(e) => setForm(f => ({ ...f, period_start: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Period End</Label><Input type="date" value={form.period_end} onChange={(e) => setForm(f => ({ ...f, period_end: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"} Payout</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 font-medium text-muted-foreground">Teacher</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Period</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Notes</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-foreground">{(p as any).teachers?.name || "—"}</td>
                    <td className="p-4 text-foreground">LKR {p.amount}</td>
                    <td className="p-4 text-muted-foreground text-xs">{p.period_start} → {p.period_end}</td>
                    <td className="p-4 text-muted-foreground text-xs max-w-[150px] truncate">{p.notes || "—"}</td>
                    <td className="p-4">
                      <select className="text-xs rounded border border-input bg-background px-2 py-1" value={p.status} onChange={(e) => updateStatus(p.id, e.target.value)}>
                        <option value="pending">Pending</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No payouts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayouts;
