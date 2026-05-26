import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Eye, MessageSquare, Inbox, Search } from "lucide-react";

const STATUSES = ["pending", "reviewing", "tutor_assigned", "replied", "accepted", "rejected", "completed"];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-foreground",
  reviewing: "bg-blue-500/10 text-blue-500",
  tutor_assigned: "bg-purple-500/10 text-purple-500",
  replied: "bg-amber-500/10 text-amber-600",
  accepted: "bg-emerald-500/10 text-emerald-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
};

const AdminClassRequests = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    status: "pending",
    admin_notes: "",
    admin_reply: "",
    proposed_price: "",
    assigned_teacher_id: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("class_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    supabase.from("teachers").select("id,name,is_active").eq("is_active", true).order("name").then(({ data }) => setTeachers(data || []));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (maxBudget && (r.budget == null || r.budget > parseFloat(maxBudget))) return false;
      if (search) {
        const q = search.toLowerCase();
        const blob = `${r.student_name} ${r.email} ${r.phone || ""} ${r.subject_text || ""} ${r.grade_text || ""} ${r.message || ""}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, search, maxBudget]);

  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      status: r.status || "pending",
      admin_notes: r.admin_notes || "",
      admin_reply: r.admin_reply || "",
      proposed_price: r.proposed_price != null ? String(r.proposed_price) : "",
      assigned_teacher_id: r.assigned_teacher_id || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const replyChanged = (form.admin_reply || "") !== (editing.admin_reply || "");
    const payload: any = {
      status: form.status,
      admin_notes: form.admin_notes || null,
      admin_reply: form.admin_reply || null,
      proposed_price: form.proposed_price ? parseFloat(form.proposed_price) : null,
      assigned_teacher_id: form.assigned_teacher_id || null,
    };
    if (replyChanged && form.admin_reply) payload.replied_at = new Date().toISOString();
    const { error } = await supabase.from("class_requests" as any).update(payload).eq("id", editing.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: "Request updated" });
    setOpen(false);
    fetchAll();
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={MessageSquare}
        eyebrow="Student requests"
        title="Class Requests"
        description="Review student class requests, assign tutors, and reply."
        accent="accent"
      />

      {/* Filters */}
      <Card className="glass-strong border-white/10">
        <CardContent className="p-4 grid sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search name, email, subject..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Max budget" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card className="glass-strong border-white/10"><CardContent className="p-10 text-center space-y-2">
          <Inbox className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <p className="text-sm text-muted-foreground">No matching requests.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{r.student_name}</p>
                      <Badge className={STATUS_STYLES[r.status] || "bg-muted"}>{r.status}</Badge>
                      <Badge variant="outline" className="text-[10px]">{r.class_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.email} {r.phone && `· ${r.phone}`}</p>
                    <p className="text-sm text-foreground">
                      {r.subject_text || "—"} {r.grade_text && `· ${r.grade_text}`}
                      {r.budget != null && ` · Budget ${r.currency} ${r.budget}`}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Submitted {format(new Date(r.created_at), "MMM d, yyyy h:mm a")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(r)}>
                      <Eye className="w-3.5 h-3.5" /> Review
                    </Button>
                  </div>
                </div>
                {r.message && <p className="mt-3 text-sm text-foreground bg-muted/40 rounded-md p-3 line-clamp-3">{r.message}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Review Request</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-3 space-y-1 text-sm">
                <p><strong>{editing.student_name}</strong> · {editing.email} {editing.phone && `· ${editing.phone}`}</p>
                <p className="text-xs text-muted-foreground">
                  {editing.class_type} · {editing.subject_text || "—"} {editing.grade_text && `· ${editing.grade_text}`}
                  {editing.preferred_language && ` · ${editing.preferred_language}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {editing.preferred_date && `${editing.preferred_date} `}{editing.preferred_time || ""}
                  {editing.budget != null && ` · Budget ${editing.currency} ${editing.budget}`}
                </p>
                {editing.message && <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{editing.message}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assign Tutor</Label>
                  <Select value={form.assigned_teacher_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, assigned_teacher_id: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select tutor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Proposed Price ({editing.currency})</Label>
                <Input type="number" min="0" value={form.proposed_price} onChange={(e) => setForm((f) => ({ ...f, proposed_price: e.target.value }))} />
              </div>

              <div className="space-y-1.5">
                <Label>Internal Notes (admin only)</Label>
                <Textarea rows={2} value={form.admin_notes} onChange={(e) => setForm((f) => ({ ...f, admin_notes: e.target.value }))} maxLength={2000} />
              </div>

              <div className="space-y-1.5">
                <Label className="inline-flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-primary" /> Reply to Student</Label>
                <Textarea rows={4} value={form.admin_reply} onChange={(e) => setForm((f) => ({ ...f, admin_reply: e.target.value }))} maxLength={2000} placeholder="Visible to the student in their dashboard." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClassRequests;
