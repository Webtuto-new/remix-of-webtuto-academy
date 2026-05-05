import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Bell, Play, RefreshCw, Send } from "lucide-react";

interface AutoSettings {
  id: string;
  login_alerts_enabled: boolean;
  expiry_reminders_enabled: boolean;
  expiry_stages: Record<string, boolean>;
  class_reminders_enabled: boolean;
  class_stages: Record<string, boolean>;
  default_reminder_time: string | null;
  last_expiry_run_at: string | null;
  last_class_run_at: string | null;
}

interface AutoLog {
  id: string;
  student_id: string | null;
  message_type: string;
  reminder_stage: string | null;
  phone: string | null;
  status: string;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  sent: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
};

const AdminWhatsAppAutomation = () => {
  const [s, setS] = useState<AutoSettings | null>(null);
  const [logs, setLogs] = useState<AutoLog[]>([]);
  const [stats, setStats] = useState({ today: 0, failed: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const [testStudentId, setTestStudentId] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("");

  const load = async () => {
    const { data: settings } = await supabase
      .from("whatsapp_automation_settings").select("*").limit(1).maybeSingle();
    setS(settings as any);
    const { data: l } = await supabase
      .from("whatsapp_automation_logs").select("*")
      .order("created_at", { ascending: false }).limit(200);
    setLogs((l as any) ?? []);
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const { data: today } = await supabase
      .from("whatsapp_automation_logs").select("id, status")
      .gte("created_at", startOfDay.toISOString());
    const t = (today as any[] ?? []);
    setStats({
      today: t.filter((x) => x.status === "sent").length,
      failed: t.filter((x) => x.status === "failed").length,
    });
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!s) return;
    const { error } = await supabase.from("whatsapp_automation_settings").update({
      login_alerts_enabled: s.login_alerts_enabled,
      expiry_reminders_enabled: s.expiry_reminders_enabled,
      expiry_stages: s.expiry_stages,
      class_reminders_enabled: s.class_reminders_enabled,
      class_stages: s.class_stages,
      default_reminder_time: s.default_reminder_time,
    }).eq("id", s.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved" });
  };

  const runJob = async (job: "expiry" | "class") => {
    setBusy(job);
    const { data, error } = await supabase.functions.invoke("whatsapp-automation", { body: { job } });
    setBusy(null);
    if (error) { toast({ title: "Job failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Job complete: ${job}`, description: JSON.stringify((data as any)?.[job] ?? data) });
    load();
  };

  const sendTestLogin = async () => {
    if (!testStudentId) { toast({ title: "Enter student ID", variant: "destructive" }); return; }
    setBusy("login");
    const { data, error } = await supabase.functions.invoke("whatsapp-automation", {
      body: { job: "login_alert", studentId: testStudentId, reason: "updated" },
    });
    setBusy(null);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Test login sent", description: JSON.stringify(data) }); load(); }
  };

  const retryFailed = async (logId: string) => {
    const { data: log } = await supabase.from("whatsapp_automation_logs")
      .select("*").eq("id", logId).maybeSingle();
    if (!log) return;
    const { data, error } = await supabase.functions.invoke("whatsapp-send", {
      body: { action: "send", phone: log.phone, message: log.message_body },
    });
    if (error) { toast({ title: "Retry failed", description: error.message, variant: "destructive" }); return; }
    if ((data as any)?.success) {
      await supabase.from("whatsapp_automation_logs")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
        .eq("id", logId);
      toast({ title: "Retry succeeded" });
    } else {
      toast({ title: "Retry failed", description: JSON.stringify(data) });
    }
    load();
  };

  if (!s) return <p className="text-muted-foreground">Loading…</p>;

  const setExp = (k: string, v: boolean) => setS({ ...s, expiry_stages: { ...s.expiry_stages, [k]: v } });
  const setCls = (k: string, v: boolean) => setS({ ...s, class_stages: { ...s.class_stages, [k]: v } });

  const failedLogs = logs.filter((l) => l.status === "failed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
          <Bell className="w-6 h-6" />WhatsApp Automation
        </h1>
        <p className="text-muted-foreground text-sm">
          Automatic login alerts, expiry reminders and class reminders via HostGrap API.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Sent today</p>
          <p className="text-2xl font-display font-semibold">{stats.today}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Failed today</p>
          <p className="text-2xl font-display font-semibold text-red-600">{stats.failed}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Last expiry job</p>
          <p className="text-sm font-medium">{s.last_expiry_run_at ? new Date(s.last_expiry_run_at).toLocaleString() : "—"}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Last class job</p>
          <p className="text-sm font-medium">{s.last_class_run_at ? new Date(s.last_class_run_at).toLocaleString() : "—"}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Automation Settings</CardTitle></CardHeader>
        <CardContent className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <p className="font-medium">Login alerts</p>
              <p className="text-xs text-muted-foreground">Send WhatsApp login details when account is created or password changes.</p>
            </div>
            <Switch checked={s.login_alerts_enabled} onCheckedChange={(c) => setS({ ...s, login_alerts_enabled: c })} />
          </div>

          <div className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Expiry reminders</p>
                <p className="text-xs text-muted-foreground">Daily check of student course access expiry dates.</p>
              </div>
              <Switch checked={s.expiry_reminders_enabled} onCheckedChange={(c) => setS({ ...s, expiry_reminders_enabled: c })} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { k: "d7", l: "7 days before" },
                { k: "d3", l: "3 days before" },
                { k: "d1", l: "1 day before" },
                { k: "d0", l: "On expiry day" },
                { k: "expired", l: "Already expired" },
              ].map((x) => (
                <label key={x.k} className="flex items-center justify-between gap-2 p-2 border border-border rounded">
                  <span className="text-xs">{x.l}</span>
                  <Switch checked={!!s.expiry_stages?.[x.k]} onCheckedChange={(c) => setExp(x.k, c)} />
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 border border-border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Class reminders</p>
                <p className="text-xs text-muted-foreground">Reminders before scheduled live class sessions.</p>
              </div>
              <Switch checked={s.class_reminders_enabled} onCheckedChange={(c) => setS({ ...s, class_reminders_enabled: c })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: "h24", l: "24 hours before" },
                { k: "h1", l: "1 hour before" },
                { k: "m10", l: "10 minutes before" },
              ].map((x) => (
                <label key={x.k} className="flex items-center justify-between gap-2 p-2 border border-border rounded">
                  <span className="text-xs">{x.l}</span>
                  <Switch checked={!!s.class_stages?.[x.k]} onCheckedChange={(c) => setCls(x.k, c)} />
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Default reminder time (for daily jobs)</Label>
              <Input type="time" value={s.default_reminder_time ?? "09:00"}
                onChange={(e) => setS({ ...s, default_reminder_time: e.target.value })} />
            </div>
          </div>

          <Button onClick={save}>Save settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Run jobs manually</CardTitle></CardHeader>
        <CardContent className="space-y-4 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runJob("expiry")} disabled={busy === "expiry"}>
              <Play className="w-4 h-4 mr-2" />{busy === "expiry" ? "Running…" : "Run expiry reminders now"}
            </Button>
            <Button onClick={() => runJob("class")} disabled={busy === "class"}>
              <Play className="w-4 h-4 mr-2" />{busy === "class" ? "Running…" : "Run class reminders now"}
            </Button>
          </div>

          <div className="border border-border rounded-lg p-3 space-y-3">
            <p className="font-medium text-sm">Send test login alert</p>
            <Input placeholder="Student user ID (UUID from profiles)" value={testStudentId} onChange={(e) => setTestStudentId(e.target.value)} />
            <Button size="sm" onClick={sendTestLogin} disabled={busy === "login"}>
              <Send className="w-4 h-4 mr-2" />{busy === "login" ? "Sending…" : "Send test"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground border border-border rounded-lg p-3">
            <b>Cron:</b> Trigger this URL daily/hourly to run jobs automatically:<br />
            <code className="break-all">POST {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-automation`}</code><br />
            with header <code>x-cron-secret: &lt;your service role key&gt;</code> and body <code>{`{"job":"all"}`}</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent automation logs</CardTitle>
          <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead><TableHead>Type</TableHead><TableHead>Stage</TableHead>
                <TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary">{l.message_type}</Badge></TableCell>
                  <TableCell className="text-xs">{l.reminder_stage ?? "—"}</TableCell>
                  <TableCell className="text-xs">{l.phone}</TableCell>
                  <TableCell><Badge className={STATUS_COLOR[l.status]}>{l.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {l.status === "failed" && (
                      <Button size="sm" variant="outline" onClick={() => retryFailed(l.id)}>Retry</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No automation logs yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
          {failedLogs.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{failedLogs.length} failed message(s) — retry manually as needed (no automatic retry loop).</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWhatsAppAutomation;
