import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Send, ExternalLink, Copy, MessageSquare } from "lucide-react";
import MessagePreviewDialog from "@/components/whatsapp/MessagePreviewDialog";
import {
  TEMPLATE_VARIABLES, TYPE_LABELS, renderTemplate, buildWaLink, normalizePhone,
  sendWhatsAppMessage, sendViaProvider, sendTestMessage,
  type WhatsAppType,
} from "@/lib/whatsapp";

interface Template { id: string; name: string; type: WhatsAppType; body: string; description: string | null; is_active: boolean; }
interface Settings { id: string; admin_phone: string | null; support_phone: string | null; login_link: string | null; payment_instructions: string | null; reminder_days_before: number; enabled_types: Record<string, boolean>; }
interface MsgLog { id: string; phone: string; type: string; body: string; status: string; sent_at: string | null; created_at: string; user_id: string | null; wa_link: string | null; }
interface Student { id: string; full_name: string; email: string | null; phone: string | null; }

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  sent: "bg-green-500/10 text-green-600",
  manual_sent: "bg-blue-500/10 text-blue-600",
  failed: "bg-red-500/10 text-red-600",
};

const AdminWhatsApp = () => {
  const [tab, setTab] = useState("templates");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold flex items-center gap-2"><MessageSquare className="w-6 h-6" />WhatsApp Messaging Center</h1>
        <p className="text-muted-foreground text-sm">Manage templates, send messages, and review history. Currently in <b>manual mode</b> (wa.me links).</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Send</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="api">API Settings</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="templates"><TemplatesTab /></TabsContent>
        <TabsContent value="bulk"><BulkTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
        <TabsContent value="api"><ApiSettingsTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

/* ---------------- Templates ---------------- */
const TemplatesTab = () => {
  const [items, setItems] = useState<Template[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: "", type: "custom" as WhatsAppType, body: "", description: "", is_active: true });

  const load = async () => {
    const { data } = await supabase.from("whatsapp_templates").select("*").order("created_at", { ascending: false });
    setItems((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEdit(null); setForm({ name: "", type: "custom", body: "", description: "", is_active: true }); setOpen(true); };
  const openEdit = (t: Template) => { setEdit(t); setForm({ name: t.name, type: t.type, body: t.body, description: t.description ?? "", is_active: t.is_active }); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.body) { toast({ title: "Name and body required", variant: "destructive" }); return; }
    const payload = { ...form };
    const res = edit
      ? await supabase.from("whatsapp_templates").update(payload).eq("id", edit.id)
      : await supabase.from("whatsapp_templates").insert(payload);
    if (res.error) { toast({ title: "Error", description: res.error.message, variant: "destructive" }); return; }
    toast({ title: edit ? "Updated" : "Created" });
    setOpen(false); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete template?")) return;
    await supabase.from("whatsapp_templates").delete().eq("id", id);
    load();
  };

  const insertVar = (v: string) => setForm((f) => ({ ...f, body: f.body + ` {{${v}}}` }));

  return (
    <Card className="glass-strong border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Message Templates</CardTitle>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />New Template</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Active</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell><Badge variant="secondary">{TYPE_LABELS[t.type] ?? t.type}</Badge></TableCell>
                <TableCell>{t.is_active ? <Badge className="bg-green-500/10 text-green-600">Active</Badge> : <Badge variant="secondary">Off</Badge>}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No templates yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit ? "Edit" : "New"} Template</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as WhatsAppType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label>Body</Label>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={10} className="font-mono text-sm" />
              <div className="flex flex-wrap gap-1 mt-2">
                {TEMPLATE_VARIABLES.map((v) => (
                  <Button key={v} type="button" size="sm" variant="outline" className="h-6 text-xs" onClick={() => insertVar(v)}>{`{{${v}}}`}</Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} /><Label>Active</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

/* ---------------- Bulk Send ---------------- */
const BulkTab = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [classes, setClasses] = useState<{ id: string; title: string }[]>([]);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all"); // all, expired, exp1, exp3, exp7
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMsg, setPreviewMsg] = useState<{ phone: string; body: string; userId: string } | null>(null);
  const [enrollMap, setEnrollMap] = useState<Map<string, { class_id: string | null; expires_at: string | null }[]>>(new Map());

  useEffect(() => {
    (async () => {
      const [{ data: tmpl }, { data: set }, { data: cls }] = await Promise.all([
        supabase.from("whatsapp_templates").select("*").eq("is_active", true),
        supabase.from("whatsapp_settings").select("*").limit(1).maybeSingle(),
        supabase.from("classes").select("id,title").eq("is_active", true).order("title"),
      ]);
      setTemplates((tmpl as any) ?? []);
      setSettings(set as any);
      setClasses((cls as any) ?? []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email, phone").limit(2000);
      setStudents((profs as any) ?? []);
      const { data: enr } = await supabase.from("enrollments").select("user_id, class_id, expires_at").limit(5000);
      const m = new Map<string, { class_id: string | null; expires_at: string | null }[]>();
      (enr as any[] ?? []).forEach((e) => {
        const arr = m.get(e.user_id) ?? [];
        arr.push({ class_id: e.class_id, expires_at: e.expires_at });
        m.set(e.user_id, arr);
      });
      setEnrollMap(m);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const now = Date.now();
    const dayMs = 86400000;
    return students.filter((s) => {
      if (q && !`${s.full_name} ${s.email ?? ""} ${s.phone ?? ""}`.toLowerCase().includes(q)) return false;
      const enrolls = enrollMap.get(s.id) ?? [];
      if (classFilter !== "all" && !enrolls.some((e) => e.class_id === classFilter)) return false;
      if (expiryFilter !== "all") {
        const exps = enrolls.map((e) => e.expires_at ? new Date(e.expires_at).getTime() : null).filter(Boolean) as number[];
        if (exps.length === 0) return false;
        const minDiff = Math.min(...exps.map((t) => t - now));
        if (expiryFilter === "expired" && minDiff > 0) return false;
        if (expiryFilter === "exp1" && (minDiff < 0 || minDiff > dayMs)) return false;
        if (expiryFilter === "exp3" && (minDiff < 0 || minDiff > 3 * dayMs)) return false;
        if (expiryFilter === "exp7" && (minDiff < 0 || minDiff > 7 * dayMs)) return false;
      }
      return true;
    });
  }, [students, search, classFilter, expiryFilter, enrollMap]);

  const toggle = (id: string) => {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n);
  };
  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));

  const tmpl = templates.find((t) => t.id === templateId);

  const buildVars = (s: Student) => ({
    student_name: s.full_name,
    login_email: s.email ?? "",
    login_link: settings?.login_link ?? "",
    admin_phone: settings?.admin_phone ?? "",
    support_phone: settings?.support_phone ?? "",
    payment_instructions: settings?.payment_instructions ?? "",
  });

  const previewFor = (s: Student) => {
    if (!tmpl) { toast({ title: "Choose a template", variant: "destructive" }); return; }
    setPreviewMsg({ phone: s.phone ?? "", body: renderTemplate(tmpl.body, buildVars(s)), userId: s.id });
    setPreviewOpen(true);
  };

  const queue = useMemo(() => {
    if (!tmpl) return [];
    return Array.from(selected).map((id) => {
      const s = students.find((x) => x.id === id)!;
      const body = renderTemplate(tmpl.body, buildVars(s));
      return { student: s, body, link: buildWaLink(s.phone ?? "", body) };
    }).filter((x) => x.student);
  }, [selected, tmpl, students, settings]);

  return (
    <div className="space-y-4">
      <Card className="glass-strong border-white/10">
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><Label>Search</Label><Input placeholder="Name, email, phone" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div>
            <Label>Class</Label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Expiry</Label>
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="expired">Already expired</SelectItem>
                <SelectItem value="exp1">Expires in 1 day</SelectItem>
                <SelectItem value="exp3">Expires in 3 days</SelectItem>
                <SelectItem value="exp7">Expires in 7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Choose template" /></SelectTrigger>
              <SelectContent>
                {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-strong border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recipients ({filtered.length}) — selected {selected.size}</CardTitle>
          <Button variant="outline" size="sm" onClick={toggleAll}>{selected.size === filtered.length ? "Clear" : "Select all"}</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead className="w-10" /><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map((s) => (
                <TableRow key={s.id}>
                  <TableCell><Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} /></TableCell>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.email}</TableCell>
                  <TableCell className="text-sm">{s.phone || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => previewFor(s)} disabled={!tmpl}><Send className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No students match filters.</TableCell></TableRow>}
            </TableBody>
          </Table>
          {filtered.length > 200 && <p className="text-xs text-muted-foreground mt-2">Showing first 200 — narrow filters for more.</p>}
        </CardContent>
      </Card>

      {queue.length > 0 && tmpl && (
        <Card className="glass-strong border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Queue ({queue.length})</CardTitle>
            <BulkSendButton queue={queue} tmpl={tmpl} />
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {queue.map((q) => (
              <div key={q.student.id} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{q.student.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{normalizePhone(q.student.phone ?? "") || "No phone"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setPreviewMsg({ phone: q.student.phone ?? "", body: q.body, userId: q.student.id }); setPreviewOpen(true); }}>
                  <ExternalLink className="w-4 h-4 mr-1" />Send
                </Button>
                <Button size="sm" variant="ghost" onClick={async () => { await navigator.clipboard.writeText(q.body); toast({ title: "Copied" }); }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {previewMsg && tmpl && (
        <MessagePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          phone={previewMsg.phone}
          message={previewMsg.body}
          type={tmpl.type}
          userId={previewMsg.userId}
          templateId={tmpl.id}
        />
      )}
    </div>
  );
};

/* ---------------- History ---------------- */
const HistoryTab = () => {
  const [items, setItems] = useState<MsgLog[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase.from("whatsapp_messages").select("*").order("created_at", { ascending: false }).limit(500);
    setItems((data as any) ?? []);
    const ids = Array.from(new Set(((data as any[]) ?? []).map((m) => m.user_id).filter(Boolean)));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const m = new Map<string, string>();
      (p ?? []).forEach((x: any) => m.set(x.id, x.full_name));
      setProfiles(m);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search && !`${m.phone} ${m.body} ${profiles.get(m.user_id ?? "") ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const setStatus = async (id: string, s: string) => {
    await supabase.from("whatsapp_messages").update({ status: s, sent_at: (s === "sent" || s === "manual_sent") ? new Date().toISOString() : null }).eq("id", id);
    load();
  };

  return (
    <Card className="glass-strong border-white/10">
      <CardHeader>
        <CardTitle>Message History</CardTitle>
        <div className="flex gap-2 mt-2">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="manual_sent">Manual sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Recipient</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{profiles.get(m.user_id ?? "") ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{m.phone}</div>
                </TableCell>
                <TableCell><Badge variant="secondary">{TYPE_LABELS[m.type as WhatsAppType] ?? m.type}</Badge></TableCell>
                <TableCell><Badge className={STATUS_COLOR[m.status]}>{m.status}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  {m.wa_link && <Button size="sm" variant="ghost" onClick={() => window.open(m.wa_link!, "_blank")}><ExternalLink className="w-4 h-4" /></Button>}
                  <Button size="sm" variant="ghost" onClick={() => setStatus(m.id, "manual_sent")}>Mark sent</Button>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(m.id, "failed")}>Failed</Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No messages yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

/* ---------------- Settings ---------------- */
const SettingsTab = () => {
  const [s, setS] = useState<Settings | null>(null);
  const load = async () => {
    const { data } = await supabase.from("whatsapp_settings").select("*").limit(1).maybeSingle();
    setS(data as any);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!s) return;
    const { error } = await supabase.from("whatsapp_settings").update({
      admin_phone: s.admin_phone, support_phone: s.support_phone, login_link: s.login_link,
      payment_instructions: s.payment_instructions, reminder_days_before: s.reminder_days_before,
      enabled_types: s.enabled_types,
    }).eq("id", s.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Settings saved" });
  };

  if (!s) return <p className="text-muted-foreground">Loading…</p>;

  const setType = (k: string, v: boolean) => setS({ ...s, enabled_types: { ...s.enabled_types, [k]: v } });

  return (
    <Card className="glass-strong border-white/10">
      <CardHeader><CardTitle>WhatsApp Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Admin WhatsApp number</Label><Input value={s.admin_phone ?? ""} onChange={(e) => setS({ ...s, admin_phone: e.target.value })} /></div>
          <div><Label>Default support number</Label><Input value={s.support_phone ?? ""} onChange={(e) => setS({ ...s, support_phone: e.target.value })} /></div>
        </div>
        <div><Label>Default login link</Label><Input value={s.login_link ?? ""} onChange={(e) => setS({ ...s, login_link: e.target.value })} /></div>
        <div><Label>Default payment instructions</Label><Textarea rows={4} value={s.payment_instructions ?? ""} onChange={(e) => setS({ ...s, payment_instructions: e.target.value })} /></div>
        <div><Label>Default reminder days before expiry</Label><Input type="number" value={s.reminder_days_before} onChange={(e) => setS({ ...s, reminder_days_before: Number(e.target.value) })} /></div>
        <div>
          <Label className="block mb-2">Enabled message types</Label>
          <div className="space-y-2">
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between p-2 border border-border rounded-lg">
                <span className="text-sm">{v}</span>
                <Switch checked={s.enabled_types?.[k] ?? true} onCheckedChange={(c) => setType(k, c)} />
              </div>
            ))}
          </div>
        </div>
        <Button onClick={save}>Save settings</Button>
        <p className="text-xs text-muted-foreground border border-border rounded-lg p-3">
          <b>Provider:</b> manual (wa.me). The system is provider-ready — when you connect WhatsApp Business Cloud API later, only <code>sendWhatsAppMessage()</code> in <code>src/lib/whatsapp.ts</code> needs to be updated.
        </p>
      </CardContent>
    </Card>
  );
};


/* ---------------- Bulk Send Button (queue with delay) ---------------- */
const BulkSendButton = ({ queue, tmpl }: { queue: any[]; tmpl: Template }) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, sent: 0, failed: 0 });

  const run = async () => {
    if (!confirm(`Send ${queue.length} WhatsApp messages via HostGrap API? They will be sent one by one with a 2s delay.`)) return;
    setRunning(true);
    setProgress({ done: 0, sent: 0, failed: 0 });
    let sent = 0, failed = 0;
    for (let i = 0; i < queue.length; i++) {
      const q = queue[i];
      try {
        const log = await sendWhatsAppMessage({
          userId: q.student.id, phone: q.student.phone ?? "", type: tmpl.type,
          body: q.body, templateId: tmpl.id,
        });
        const r = await sendViaProvider({ logId: log.id, phone: q.student.phone ?? "", message: q.body });
        if (r.success) sent++; else failed++;
      } catch { failed++; }
      setProgress({ done: i + 1, sent, failed });
      if (i < queue.length - 1) await new Promise((r) => setTimeout(r, 2000));
    }
    setRunning(false);
    toast({ title: "Bulk send complete", description: `Sent: ${sent} • Failed: ${failed}` });
  };

  return (
    <div className="flex items-center gap-3">
      {running && (
        <span className="text-xs text-muted-foreground">{progress.done}/{queue.length} • ✓{progress.sent} ✗{progress.failed}</span>
      )}
      <Button size="sm" onClick={run} disabled={running}>
        <Send className="w-4 h-4 mr-2" />{running ? "Sending…" : "Send All via API"}
      </Button>
    </div>
  );
};

/* ---------------- API Settings ---------------- */
const ApiSettingsTab = () => {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("Hello from LMS — HostGrap test message ✅");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<any>(null);

  const test = async () => {
    if (!phone || !msg) { toast({ title: "Phone and message required", variant: "destructive" }); return; }
    setBusy(true); setLast(null);
    try {
      const res = await sendTestMessage(phone, msg);
      setLast(res);
      toast({ title: "Test sent", description: "Check your WhatsApp." });
    } catch (e: any) {
      setLast({ error: e.message });
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <Card className="glass-strong border-white/10">
      <CardHeader><CardTitle>WhatsApp API Settings</CardTitle></CardHeader>
      <CardContent className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Provider</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-primary/10 text-primary">HostGrap WhatsApp API V2</Badge>
            </div>
          </div>
          <div>
            <Label>API Status</Label>
            <div className="mt-1">
              <Badge className="bg-green-500/10 text-green-600">Configured (server-side)</Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground border border-border rounded-lg p-3">
          Credentials (<code>HOSTGRAP_EMAIL</code>, <code>HOSTGRAP_API_KEY</code>, <code>HOSTGRAP_BASE_URL</code>) are stored as backend secrets.
          Frontend never sees the API key — all sends go through the <code>whatsapp-send</code> edge function.
        </p>
        <div>
          <Label>Test phone (Sri Lanka 0… or 94… format)</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0776096302" />
        </div>
        <div>
          <Label>Test message</Label>
          <Textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} />
        </div>
        <Button onClick={test} disabled={busy}>
          <Send className="w-4 h-4 mr-2" />{busy ? "Sending…" : "Send Test Message"}
        </Button>
        {last && (
          <pre className="text-xs bg-muted/50 border border-border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(last, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminWhatsApp;
