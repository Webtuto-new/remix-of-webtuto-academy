import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Bell, Play, RefreshCw, Send } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";

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
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  sent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
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

  if (!s) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted/60 rounded-lg animate-pulse" />
      <div className="h-64 bg-muted/40 rounded-2xl animate-pulse" />
    </div>
  );

  const setExp = (k: string, v: boolean) => setS({ ...s, expiry_stages: { ...s.expiry_stages, [k]: v } });
  const setCls = (k: string, v: boolean) => setS({ ...s, class_stages: { ...s.class_stages, [k]: v } });

  const failedLogs = logs.filter((l) => l.status === "failed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gradient flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />WhatsApp Automation
        </h1>
        <p className="text-muted-foreground text-sm">
          Automatic login alerts, expiry reminders and class reminders via HostGrap API.
        </p>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div variants={fadeUp}>
          <Card className="glass-strong border-border/50 hover:ring-glow transition-all">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Sent today</p>
              <p className="text-2xl font-display font-semibold text-foreground">{stats.today}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card className="glass-strong border-border/50 hover:ring-glow transition-all">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Failed today</p>
              <p className="text-2xl font-display font-semibold text-destructive">{stats.failed}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card className="glass-strong border-border/50 hover:ring-glow transition-all">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Last expiry job</p>
              <p className="text-sm font-medium text-foreground">{s.last_expiry_run_at ? new Date(s.last_expiry_run_at).toLocaleString() : "—"}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp}>
          <Card className="glass-strong border-border/50 hover:ring-glow transition-all">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Last class job</p>
              <p className="text-sm font-medium text-foreground">{s.last_class_run_at ? new Date(s.last_class_run_at).toLocaleString() : "—"}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Card className="glass-strong border-border/50">
        <CardHeader><CardTitle className="font-display">Automation Settings</CardTitle></CardHeader>
        <CardContent className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between p-3 border border-border/60 rounded-xl hover:border-primary/20 transition-colors">
            <div>
              <p className="font-medium text-foreground">Login alerts</p>
              <p className="text-xs text-muted-foreground">Send WhatsApp login details when account is created or password changes.</p>
            </div>
            <Switch checked={s.login_alerts_enabled} onCheckedChange={(c) => setS({ ...s, login_alerts_enabled: c })} />
          </div>

          <div className="p-3 border border-border/60 rounded-xl space-y-3 hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Expiry reminders</p>
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
                <label key={x.k} className="flex items-center justify-between gap-2 p-2 border border-border/60 rounded-lg hover:border-primary/20 transition-colors">
                  <span className="text-xs text-foreground">{x.l}</span>
                  <Switch checked={!!s.expiry_stages?.[x.k]} onCheckedChange={(c) => setExp(x.k, c)} />
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 border border-border/60 rounded-xl space-y-3 hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Class reminders</p>
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
                <label key={x.k} className="flex items-center justify-between gap-2 p-2 border border-border/60 rounded-lg hover:border-primary/20 transition-colors">
                  <span className="text-xs text-foreground">{x.l}</span>
                  <Switch checked={!!s.class_stages?.[x.k]} onCheckedChange={(c) => setCls(x.k, c)} />
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground">Default reminder time (for daily jobs)</Label>
              <Input type="time" value={s.default_reminder_time ?? "09:00"}
                onChange={(e) => setS({ ...s, default_reminder_time: e.target.value })} className="mt-1" />
            </div>
          </div>

          <Button onClick={save} variant="premium">Save settings</Button>
        </CardContent>
      </Card>

      <Card className="glass-strong border-border/50">
        <CardHeader><CardTitle className="font-display">Run jobs manually</CardTitle></CardHeader>
        <CardContent className="space-y-4 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runJob("expiry")} disabled={busy === "expiry"} variant="premium">
              <Play className="w-4 h-4 mr-2" />{busy === "expiry" ? "Running…" : "Run expiry reminders now"}
            </Button>
            <Button onClick={() => runJob("class")} disabled={busy === "class"} variant="premium">
              <Play className="w-4 h-4 mr-2" />{busy === "class" ? "Running…" : "Run class reminders now"}
            </Button>
          </div>

          <div className="border border-border/60 rounded-xl p-3 space-y-3">
            <p className="font-medium text-sm text-foreground">Send test login alert</p>
            <Input placeholder="Student user ID (UUID from profiles)" value={testStudentId} onChange={(e) => setTestStudentId(e.target.value)} />
            <Button size="sm" onClick={sendTestLogin} disabled={busy === "login"} variant="premium">
              <Send className="w-4 h-4 mr-2" />{busy === "login" ? "Sending…" : "Send test"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground border border-border/60 rounded-xl p-3">
            <b>Cron:</b> Trigger this URL daily/hourly to run jobs automatically:<br />
            <code className="break-all">POST {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-automation`}</code><br />
            with header <code>x-cron-secret: &lt;your service role key&gt;</code> and body <code>{`{"job":"all"}`}</code>.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-strong border-border/50 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/30">
          <CardTitle className="font-display">Recent automation logs</CardTitle>
          <Button size="sm" variant="ghost" onClick={load} className="hover:bg-primary/10 hover:text-primary"><RefreshCw className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-transparent">
                <TableHead className="text-muted-foreground">When</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Stage</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id} className="hover:bg-primary/5 transition-colors border-b border-border last:border-0">
                  <TableCell className="text-xs whitespace-nowrap text-foreground">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{l.message_type}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.reminder_stage ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.phone}</TableCell>
                  <TableCell><span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[l.status]}`}>{l.status}</span></TableCell>
                  <TableCell className="text-right">
                    {l.status === "failed" && (
                      <Button size="sm" variant="outline" onClick={() => retryFailed(l.id)} className="text-xs">Retry</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No automation logs yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
          {failedLogs.length > 0 && (
            <p className="text-xs text-muted-foreground p-4">{failedLogs.length} failed message(s) — retry manually as needed (no automatic retry loop).</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWhatsAppAutomation;
