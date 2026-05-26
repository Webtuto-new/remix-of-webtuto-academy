import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, CheckCircle, XCircle, Image, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";
import EmptyState from "@/components/premium/EmptyState";
import { CreditCard } from "lucide-react";

const AdminPayments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewing, setReviewing] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [form, setForm] = useState({ user_id: "", amount: "", currency: "LKR", payment_method: "", payment_status: "pending", transaction_ref: "", enrollment_id: "" });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  // NOTE: payments.user_id is not currently defined as a FK to profiles.id in the DB,
  // so PostgREST cannot embed profiles(...) here; we enrich the rows client-side.
  const profilesById = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of profiles) map[p.id] = p;
    return map;
  }, [profiles]);

  const paymentsWithProfiles = useMemo(
    () =>
      payments.map((p) => ({
        ...p,
        profiles: profilesById[p.user_id] ?? null,
      })),
    [payments, profilesById]
  );

  const fetchPayments = async () => {
    const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load payments", description: error.message, variant: "destructive" });
      setPayments([]);
      return;
    }
    setPayments(data || []);
  };

  useEffect(() => {
    fetchPayments();

    supabase
      .from("profiles")
      .select("id, full_name, admission_number")
      .order("full_name")
      .then(({ data, error }) => {
        if (error) toast({ title: "Couldn't load students", description: error.message, variant: "destructive" });
        setProfiles(data || []);
      });

    supabase
      .from("enrollments")
      .select("id, class_id, recording_id, classes(title), recordings(title)")
      .order("enrolled_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast({ title: "Couldn't load enrollments", description: error.message, variant: "destructive" });
        setEnrollments(data || []);
      });
  }, []);

  const handleSave = async () => {
    const payload = {
      user_id: form.user_id,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
      payment_method: form.payment_method || null,
      payment_status: form.payment_status,
      transaction_ref: form.transaction_ref || null,
      enrollment_id: form.enrollment_id || null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("payments").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("payments").insert(payload));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: editing ? "Updated!" : "Payment added!" });
      setOpen(false);
      setEditing(null);
      setForm({ user_id: "", amount: "", currency: "LKR", payment_method: "", payment_status: "pending", transaction_ref: "", enrollment_id: "" });
      fetchPayments();
    }
  };

  const handleEdit = (p: any) => {
    setEditing(p);
    setForm({
      user_id: p.user_id,
      amount: p.amount?.toString() || "",
      currency: p.currency || "LKR",
      payment_method: p.payment_method || "",
      payment_status: p.payment_status,
      transaction_ref: p.transaction_ref || "",
      enrollment_id: p.enrollment_id || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Deleted" });
      fetchPayments();
    }
  };

  const handleApprove = async (payment: any) => {
    // Create enrollments for all items
    const items = payment.items || [];
    for (const item of items) {
      const enrollmentData: any = { user_id: payment.user_id, status: "active" };
      if (item.type === "class") enrollmentData.class_id = item.id;
      else if (item.type === "recording") enrollmentData.recording_id = item.id;
      else if (item.type === "bundle") enrollmentData.bundle_id = item.id;

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      enrollmentData.expires_at = expiry.toISOString();

      const { data: enrollment } = await supabase.from("enrollments").insert(enrollmentData).select().single();
      if (enrollment && items.length === 1) {
        await supabase.from("payments").update({ enrollment_id: enrollment.id }).eq("id", payment.id);
      }
    }

    // If no items stored, still approve
    await supabase.from("payments").update({ payment_status: "completed" }).eq("id", payment.id);
    toast({ title: "Payment approved!", description: "Student enrollment has been activated." });
    setReviewOpen(false);
    setReviewing(null);
    fetchPayments();
  };

  const handleReject = async (payment: any) => {
    await supabase.from("payments").update({ payment_status: "failed" }).eq("id", payment.id);
    toast({ title: "Payment rejected", variant: "destructive" });
    setReviewOpen(false);
    setReviewing(null);
    fetchPayments();
  };

  const filtered = paymentsWithProfiles.filter((p) => {
    if (filter !== "all" && p.payment_status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.profiles?.full_name || "").toLowerCase().includes(q) ||
      (p.profiles?.admission_number || "").toLowerCase().includes(q) ||
      (p.transaction_ref || "").toLowerCase().includes(q)
    );
  });

  const pendingCount = paymentsWithProfiles.filter((p) => p.payment_status === "pending").length;


  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={CreditCard}
        eyebrow="Transactions"
        title="All Payments"
        description={pendingCount > 0 ? `${pendingCount} payment(s) awaiting review.` : "Review, approve, and manage student payments."}
        accent={pendingCount > 0 ? "accent" : "emerald"}
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild><Button variant="premium" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Add Payment</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Payment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.user_id} onChange={(e) => setForm(f => ({ ...f, user_id: e.target.value }))}>
                  <option value="">Select student</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.admission_number})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="LKR">LKR</option><option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.payment_method} onChange={(e) => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                    <option value="">Select</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option><option value="cash">Cash</option><option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.payment_status} onChange={(e) => setForm(f => ({ ...f, payment_status: e.target.value }))}>
                    <option value="pending">Pending</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2"><Label>Transaction Reference</Label><Input value={form.transaction_ref} onChange={(e) => setForm(f => ({ ...f, transaction_ref: e.target.value }))} placeholder="e.g. bank ref #" /></div>
              <div className="space-y-2">
                <Label>Link to Enrollment (optional)</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.enrollment_id} onChange={(e) => setForm(f => ({ ...f, enrollment_id: e.target.value }))}>
                  <option value="">None</option>
                  {enrollments.map(e => (
                    <option key={e.id} value={e.id}>{(e as any).classes?.title || (e as any).recordings?.title || e.id.slice(0,8)}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Add"} Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search by student, reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <div className="flex gap-1">
          {["all", "pending", "completed", "failed", "refunded"].map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
              {f}{f === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
            </Button>
          ))}
        </div>
      </div>

      <Card className="glass-strong border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Student</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Items</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Receipt</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <motion.tbody variants={stagger} initial="hidden" animate="show">
                {filtered.map(p => {
                  const items = (p.items as any[]) || [];
                  return (
                    <motion.tr key={p.id} variants={fadeUp} className={`border-b border-border last:border-0 hover:bg-primary/5 transition-colors group ${p.payment_status === "pending" ? "bg-amber-500/5" : ""}`}>
                      <td className="p-4 text-foreground">{format(new Date(p.created_at), "PP")}</td>
                      <td className="p-4 text-foreground">{p.profiles?.full_name || "—"} <span className="text-xs text-muted-foreground block">{p.profiles?.admission_number}</span></td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {items.length > 0 ? items.map((i: any) => i.title).join(", ") : "—"}
                      </td>
                      <td className="p-4 font-medium text-foreground">{p.currency} {p.amount}</td>
                      <td className="p-4">
                        {p.receipt_url ? (
                          <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                            <Image className="w-3 h-3" /> View
                          </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          p.payment_status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          p.payment_status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          p.payment_status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-muted text-muted-foreground"
                        }`}>{p.payment_status}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {p.payment_status === "pending" && (
                            <Button variant="default" size="sm" className="gap-1 text-xs" onClick={() => { setReviewing(p); setReviewOpen(true); }}>
                              <Eye className="w-3 h-3" /> Review
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7} className="p-8"><EmptyState icon={CreditCard} title="No payments found" description="Payments will appear here once students make transactions." /></td></tr>}
              </motion.tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Review Payment</DialogTitle></DialogHeader>
          {reviewing && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Student</span>
                  <p className="font-medium text-foreground">{reviewing.profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{reviewing.profiles?.admission_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <p className="font-bold text-foreground text-lg">{reviewing.currency} {reviewing.amount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="text-foreground">{format(new Date(reviewing.created_at), "PPpp")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference</span>
                  <p className="text-foreground">{reviewing.transaction_ref || "—"}</p>
                </div>
              </div>

              {/* Items */}
              {reviewing.items && (reviewing.items as any[]).length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Purchased Items</h3>
                  <div className="space-y-2">
                    {(reviewing.items as any[]).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-foreground">{item.title} <span className="text-xs text-muted-foreground capitalize">({item.type})</span></span>
                        <span className="font-medium text-foreground">LKR {item.price?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Receipt */}
              {reviewing.receipt_url && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Payment Receipt</h3>
                  <div className="border border-border rounded-xl overflow-hidden bg-muted/30">
                    {reviewing.receipt_url.endsWith(".pdf") ? (
                      <a href={reviewing.receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-6 text-primary hover:underline">
                        <ExternalLink className="w-5 h-5" /> Open PDF Receipt
                      </a>
                    ) : (
                      <img src={reviewing.receipt_url} alt="Payment receipt" className="w-full max-h-96 object-contain" />
                    )}
                  </div>
                  <a href={reviewing.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Open in new tab
                  </a>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button onClick={() => handleApprove(reviewing)} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4" /> Approve & Enroll
                </Button>
                <Button onClick={() => handleReject(reviewing)} variant="destructive" className="flex-1 gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
