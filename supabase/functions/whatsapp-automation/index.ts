// WhatsApp automation runner — handles login alerts, expiry reminders, and class reminders.
// Triggerable by:
//  - Admin from UI (Authorization: Bearer <user JWT>)
//  - Cron (header x-cron-secret matching SUPABASE_SERVICE_ROLE_KEY)
//  - Internal callers using the service role key
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  let local = digits;
  if (local.startsWith("0") && local.length === 10) local = "94" + local.slice(1);
  if (!local.startsWith("94") && local.length === 9) local = "94" + local;
  return "+" + local;
}

function render(body: string, vars: Record<string, unknown>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) => {
    const v = vars[k];
    return v === null || v === undefined ? "" : String(v);
  });
}

async function callHostgrap(phone: string, message: string) {
  const email = Deno.env.get("HOSTGRAP_EMAIL");
  const apiKey = Deno.env.get("HOSTGRAP_API_KEY");
  const baseUrl = Deno.env.get("HOSTGRAP_BASE_URL") ?? "https://wa-api.hostgrap.com/api";
  if (!email || !apiKey) {
    return { success: false, http: 0, body: "HostGrap API email or key is missing" };
  }
  const params = new URLSearchParams();
  params.append("email", email);
  params.append("api_key", apiKey);
  params.append("phone", phone);
  params.append("message", message);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/send-message.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const text = await res.text();
    let success = res.ok;
    const lower = text.toLowerCase();
    if (lower.includes("error") || lower.includes("invalid") || lower.includes("fail")) success = false;
    try {
      const j = JSON.parse(text);
      if (j && typeof j === "object") {
        if (j.status === "success" || j.success === true) success = true;
        if (j.status === "error" || j.success === false) success = false;
      }
    } catch { /* plain text */ }
    return { success: res.ok && success, http: res.status, body: text };
  } catch (e) {
    return { success: false, http: 0, body: `Network error: ${(e as Error).message}` };
  }
}

interface SendArgs {
  studentId: string | null;
  phone: string;
  type: string;
  reminder_stage: string | null;
  body: string;
  course_id?: string | null;
  class_id?: string | null;
  session_id?: string | null;
  enrollment_id?: string | null;
}

async function sendAutomated(svc: SupabaseClient, a: SendArgs) {
  const phone = normalizePhone(a.phone);
  if (!phone || phone.length < 10) {
    return { skipped: true, reason: "invalid_phone" };
  }

  // Duplicate check (success only blocks)
  if (a.studentId && a.reminder_stage) {
    const q = svc.from("whatsapp_automation_logs").select("id").eq("student_id", a.studentId)
      .eq("message_type", a.type).eq("reminder_stage", a.reminder_stage).eq("status", "sent");
    if (a.course_id) q.eq("course_id", a.course_id);
    if (a.class_id) q.eq("class_id", a.class_id);
    if (a.session_id) q.eq("session_id", a.session_id);
    const { data: dup } = await q.limit(1);
    if (dup && dup.length > 0) return { skipped: true, reason: "duplicate" };
  }

  // Insert pending log
  const { data: log, error: insErr } = await svc.from("whatsapp_automation_logs").insert({
    student_id: a.studentId, phone, message_type: a.type, reminder_stage: a.reminder_stage,
    message_body: a.body, course_id: a.course_id ?? null, class_id: a.class_id ?? null,
    session_id: a.session_id ?? null, enrollment_id: a.enrollment_id ?? null,
    status: "pending", provider: "hostgrap",
  }).select("id").single();
  if (insErr) return { skipped: true, reason: insErr.message };

  let result;
  try { result = await callHostgrap(phone, a.body); }
  catch (e) { result = { success: false, http: 0, body: String((e as Error).message) }; }

  await svc.from("whatsapp_automation_logs").update({
    status: result.success ? "sent" : "failed",
    sent_at: result.success ? new Date().toISOString() : null,
    api_response: { http: result.http, body: result.body },
    error: result.success ? null : (typeof result.body === "string" ? result.body : JSON.stringify(result.body)),
  }).eq("id", log.id);

  // Mirror in main whatsapp_messages table for the unified history tab
  await svc.from("whatsapp_messages").insert({
    user_id: a.studentId, phone, type: a.type, body: a.body,
    status: result.success ? "sent" : "failed",
    sent_at: result.success ? new Date().toISOString() : null,
    error: result.success ? null : String(typeof result.body === "string" ? result.body : JSON.stringify(result.body)),
    context: { provider: "hostgrap", automation: true, reminder_stage: a.reminder_stage, log_id: log.id },
  });

  return { ok: result.success, log_id: log.id };
}

async function getSettings(svc: SupabaseClient) {
  const { data: a } = await svc.from("whatsapp_automation_settings").select("*").limit(1).maybeSingle();
  const { data: w } = await svc.from("whatsapp_settings").select("*").limit(1).maybeSingle();
  const { data: tmpls } = await svc.from("whatsapp_templates").select("*").eq("is_active", true);
  return { autoSettings: a, waSettings: w, templates: tmpls ?? [] };
}

function pickTemplate(tmpls: any[], type: string, fallback: string) {
  return tmpls.find((t) => t.type === type)?.body ?? fallback;
}

const FALLBACK = {
  login: `Hi {{student_name}},

Welcome to WebTuto Academy! 🎓

Your login details:
📧 Email: {{login_email}}
🔑 Password: {{temp_password}}
🔗 Login: {{login_link}}

Please change your password after first login.
Need help? WhatsApp: {{support_phone}}`,
  payment_reminder: `Hi {{student_name}},

⏰ Reminder: Your access to "{{course_name}}" {{stage_text}} on {{expiry_date}}.

To continue learning without interruption, please renew:
{{payment_instructions}}

Need help? WhatsApp: {{support_phone}}`,
  class_reminder: `Hi {{student_name}},

📚 Class reminder — {{stage_text}}:
{{course_name}} with {{teacher_name}}
🗓 {{class_date}} at {{class_time}}
🔗 Join: {{zoom_link}}

Notes/materials: open the dashboard.
Need help? WhatsApp: {{support_phone}}`,
};

/* ---------------- Login alert ---------------- */
async function runLoginAlert(svc: SupabaseClient, args: {
  studentId: string;
  reason?: "created" | "updated" | "reset";
  tempPassword?: string;
}) {
  const { autoSettings, waSettings, templates } = await getSettings(svc);
  if (!autoSettings?.login_alerts_enabled) return { skipped: true, reason: "disabled" };

  const { data: profile } = await svc.from("profiles")
    .select("id, full_name, email, phone").eq("id", args.studentId).maybeSingle();
  if (!profile?.phone) return { skipped: true, reason: "no_phone" };

  const reasonStage = args.reason ?? "created";
  const tmpl = pickTemplate(templates, "login", FALLBACK.login);
  const body = render(tmpl, {
    student_name: profile.full_name,
    login_email: profile.email ?? "",
    temp_password: args.tempPassword ?? "(unchanged)",
    login_link: waSettings?.login_link ?? "https://edu.webtuto.lk/login",
    support_phone: waSettings?.support_phone ?? waSettings?.admin_phone ?? "",
    admin_phone: waSettings?.admin_phone ?? "",
  });

  return sendAutomated(svc, {
    studentId: profile.id, phone: profile.phone, type: "login",
    reminder_stage: reasonStage, body,
  });
}

/* ---------------- Expiry reminders ---------------- */
async function runExpiryReminders(svc: SupabaseClient) {
  const { autoSettings, waSettings, templates } = await getSettings(svc);
  if (!autoSettings?.expiry_reminders_enabled) return { skipped: true, reason: "disabled" };
  const stages: Record<string, boolean> = autoSettings.expiry_stages ?? {};
  const tmpl = pickTemplate(templates, "payment_reminder", FALLBACK.payment_reminder);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86400000;

  const { data: enrolls } = await svc.from("enrollments")
    .select("id, user_id, class_id, recording_id, expires_at, status")
    .not("expires_at", "is", null).eq("status", "active").limit(5000);

  const results = { processed: 0, sent: 0, skipped: 0, failed: 0 };

  for (const e of (enrolls ?? [])) {
    const expTs = new Date(e.expires_at!).getTime();
    const diffDays = Math.floor((new Date(expTs).setHours(0, 0, 0, 0) - today) / day);
    let stage: string | null = null;
    let stageText = "";
    if (diffDays === 7 && stages.d7) { stage = "d7"; stageText = "expires in 7 days"; }
    else if (diffDays === 3 && stages.d3) { stage = "d3"; stageText = "expires in 3 days"; }
    else if (diffDays === 1 && stages.d1) { stage = "d1"; stageText = "expires tomorrow"; }
    else if (diffDays === 0 && stages.d0) { stage = "d0"; stageText = "expires today"; }
    else if (diffDays < 0 && stages.expired) { stage = "expired"; stageText = "expired"; }
    if (!stage) continue;
    results.processed++;

    const { data: profile } = await svc.from("profiles").select("id, full_name, phone")
      .eq("id", e.user_id).maybeSingle();
    if (!profile?.phone) { results.skipped++; continue; }

    let courseName = "your course";
    let courseId: string | null = null;
    if (e.class_id) {
      const { data: c } = await svc.from("classes").select("id,title").eq("id", e.class_id).maybeSingle();
      if (c) { courseName = c.title; courseId = c.id; }
    } else if (e.recording_id) {
      const { data: r } = await svc.from("recordings").select("id,title").eq("id", e.recording_id).maybeSingle();
      if (r) { courseName = r.title; courseId = r.id; }
    }

    const body = render(tmpl, {
      student_name: profile.full_name,
      course_name: courseName,
      expiry_date: new Date(e.expires_at!).toLocaleDateString(),
      stage_text: stageText,
      payment_instructions: waSettings?.payment_instructions ?? "Contact admin to renew.",
      support_phone: waSettings?.support_phone ?? waSettings?.admin_phone ?? "",
      admin_phone: waSettings?.admin_phone ?? "",
    });

    const r = await sendAutomated(svc, {
      studentId: profile.id, phone: profile.phone, type: "payment_reminder",
      reminder_stage: stage, body, course_id: courseId, enrollment_id: e.id,
    });
    if ((r as any).ok) results.sent++;
    else if ((r as any).skipped) results.skipped++;
    else results.failed++;
  }

  await svc.from("whatsapp_automation_settings")
    .update({ last_expiry_run_at: new Date().toISOString() })
    .eq("id", autoSettings.id);

  return results;
}

/* ---------------- Class reminders ---------------- */
async function runClassReminders(svc: SupabaseClient) {
  const { autoSettings, waSettings, templates } = await getSettings(svc);
  if (!autoSettings?.class_reminders_enabled) return { skipped: true, reason: "disabled" };
  const stages: Record<string, boolean> = autoSettings.class_stages ?? {};
  const tmpl = pickTemplate(templates, "class_reminder", FALLBACK.class_reminder);

  const now = new Date();
  // Look at sessions in the next 25h
  const horizon = new Date(now.getTime() + 25 * 3600 * 1000);

  const { data: sessions } = await svc.from("class_sessions")
    .select("id, class_id, title, session_date, start_time, zoom_link, status")
    .gte("session_date", now.toISOString().slice(0, 10))
    .lte("session_date", horizon.toISOString().slice(0, 10))
    .neq("status", "cancelled")
    .limit(2000);

  const results = { processed: 0, sent: 0, skipped: 0, failed: 0 };

  for (const s of (sessions ?? [])) {
    if (!s.start_time || !s.session_date) continue;
    const startTs = new Date(`${s.session_date}T${s.start_time}`).getTime();
    const minsUntil = Math.round((startTs - now.getTime()) / 60000);

    // Stages: 24h (1380-1500min window), 1h (45-75), 10m (5-15)
    let stage: string | null = null;
    let stageText = "";
    if (stages.h24 && minsUntil >= 23 * 60 && minsUntil <= 25 * 60) { stage = "h24"; stageText = "in 24 hours"; }
    else if (stages.h1 && minsUntil >= 45 && minsUntil <= 75) { stage = "h1"; stageText = "in 1 hour"; }
    else if (stages.m10 && minsUntil >= 5 && minsUntil <= 15) { stage = "m10"; stageText = "in 10 minutes"; }
    if (!stage) continue;

    // Class & teacher
    const { data: cls } = await svc.from("classes")
      .select("id, title, teacher_id").eq("id", s.class_id).maybeSingle();
    if (!cls) continue;
    const { data: teacher } = cls.teacher_id
      ? await svc.from("teachers").select("name").eq("id", cls.teacher_id).maybeSingle()
      : { data: null };

    // Enrolled active students
    const { data: enrolls } = await svc.from("enrollments")
      .select("user_id, expires_at, status").eq("class_id", s.class_id).eq("status", "active");

    for (const e of (enrolls ?? [])) {
      if (e.expires_at && new Date(e.expires_at).getTime() < now.getTime()) continue;
      const { data: profile } = await svc.from("profiles").select("id, full_name, phone")
        .eq("id", e.user_id).maybeSingle();
      if (!profile?.phone) { results.skipped++; continue; }
      results.processed++;

      const body = render(tmpl, {
        student_name: profile.full_name,
        course_name: cls.title,
        teacher_name: teacher?.name ?? "Your teacher",
        class_date: new Date(s.session_date).toLocaleDateString(),
        class_time: s.start_time,
        zoom_link: s.zoom_link ?? "",
        stage_text: stageText,
        support_phone: waSettings?.support_phone ?? waSettings?.admin_phone ?? "",
      });

      const r = await sendAutomated(svc, {
        studentId: profile.id, phone: profile.phone, type: "class_reminder",
        reminder_stage: stage, body, class_id: cls.id, session_id: s.id,
      });
      if ((r as any).ok) results.sent++;
      else if ((r as any).skipped) results.skipped++;
      else results.failed++;
    }
  }

  await svc.from("whatsapp_automation_settings")
    .update({ last_class_run_at: new Date().toISOString() })
    .eq("id", autoSettings.id);

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Authorize: admin JWT, cron secret, or service-role internal call
  const authHeader = req.headers.get("Authorization") ?? "";
  const cronSecret = req.headers.get("x-cron-secret") ?? "";
  const isCron = cronSecret && cronSecret === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isInternal = authHeader === `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
  let isAdmin = false;
  if (!isCron && !isInternal && authHeader.startsWith("Bearer ")) {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (userData?.user?.id) {
      const { data: r } = await svc.from("user_roles")
        .select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
      isAdmin = !!r;
    }
  }
  if (!isCron && !isInternal && !isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const job = String(body.job ?? new URL(req.url).searchParams.get("job") ?? "all");

    const out: Record<string, unknown> = {};
    if (job === "login_alert" || job === "login") {
      out.login = await runLoginAlert(svc, {
        studentId: String(body.studentId), reason: body.reason, tempPassword: body.tempPassword,
      });
    } else {
      if (job === "all" || job === "expiry") out.expiry = await runExpiryReminders(svc);
      if (job === "all" || job === "class") out.class = await runClassReminders(svc);
    }
    return new Response(JSON.stringify({ ok: true, ...out }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
