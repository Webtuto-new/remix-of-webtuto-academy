// WhatsApp service layer — provider-ready.
// For now this only generates wa.me links and logs messages.
// Later, swap `sendWhatsAppMessage` to call WhatsApp Business Cloud API / Twilio / etc.
import { supabase } from "@/integrations/supabase/client";

export type WhatsAppType =
  | "login"
  | "payment_reminder"
  | "class_reminder"
  | "recording_available"
  | "course_access"
  | "subscription_expired"
  | "custom";

export type WhatsAppStatus = "pending" | "sent" | "failed" | "manual_sent";

export type Variables = Record<string, string | number | null | undefined>;

export const TEMPLATE_VARIABLES = [
  "student_name",
  "login_email",
  "temp_password",
  "course_name",
  "lesson_name",
  "chapter_name",
  "teacher_name",
  "class_date",
  "class_time",
  "expiry_date",
  "access_start_date",
  "amount_due",
  "login_link",
  "zoom_link",
  "whatsapp_group_link",
  "admin_phone",
  "support_phone",
  "payment_instructions",
] as const;

export const TYPE_LABELS: Record<WhatsAppType, string> = {
  login: "Login Details",
  payment_reminder: "Payment Reminder",
  class_reminder: "Class Reminder",
  recording_available: "Recording Available",
  course_access: "Course Access",
  subscription_expired: "Subscription Expired",
  custom: "Custom Announcement",
};

/** Replace {{var}} placeholders with values. Missing values become "". */
export function renderTemplate(body: string, vars: Variables = {}): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
    const v = vars[key];
    return v === null || v === undefined ? "" : String(v);
  });
}

/** Normalize Sri Lankan / international phone to E.164-ish digits for wa.me */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  // SL local 0XXXXXXXXX -> 94XXXXXXXXX
  if (digits.startsWith("0") && digits.length === 10) return "94" + digits.slice(1);
  return digits;
}

/** Build a wa.me clickable link */
export function buildWaLink(phone: string, message: string): string {
  const p = normalizePhone(phone);
  const text = encodeURIComponent(message);
  return p ? `https://wa.me/${p}?text=${text}` : `https://wa.me/?text=${text}`;
}

interface SendArgs {
  userId?: string | null;
  phone: string;
  type: WhatsAppType;
  body: string;
  templateId?: string | null;
  context?: Record<string, unknown> | null;
}

/**
 * Provider-ready send function.
 * Currently: only logs the message as `pending` and returns the wa.me link
 * for the admin to open manually. Later, branch on settings.provider.
 */
export async function sendWhatsAppMessage(args: SendArgs): Promise<{
  id: string;
  link: string;
  status: WhatsAppStatus;
}> {
  const link = buildWaLink(args.phone, args.body);
  const { data: userRes } = await supabase.auth.getUser();
  const insertRow: Record<string, unknown> = {
    phone: args.phone,
    type: args.type,
    body: args.body,
    status: "pending",
    wa_link: link,
  };
  if (args.userId) insertRow.user_id = args.userId;
  if (args.templateId) insertRow.template_id = args.templateId;
  if (args.context) insertRow.context = args.context as never;
  if (userRes.user?.id) insertRow.created_by = userRes.user.id;
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .insert(insertRow as never)
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id, link, status: "pending" };
}

/** Send via HostGrap (server-side edge function). Updates the existing log row. */
export async function sendViaProvider(args: {
  logId?: string | null;
  phone: string;
  message: string;
}): Promise<{ success: boolean; result: unknown; error?: string }> {
  const { data, error } = await supabase.functions.invoke("whatsapp-send", {
    body: { action: "send", logId: args.logId ?? null, phone: args.phone, message: args.message },
  });
  if (error) return { success: false, result: null, error: error.message };
  return data as { success: boolean; result: unknown };
}

/** Send a test message via HostGrap (no log row required). */
export async function sendTestMessage(phone: string, message: string) {
  const { data, error } = await supabase.functions.invoke("whatsapp-send", {
    body: { action: "test", phone, message },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function markStatus(id: string, status: WhatsAppStatus, error?: string) {
  return supabase
    .from("whatsapp_messages")
    .update({
      status,
      error: error ?? null,
      sent_at: status === "sent" || status === "manual_sent" ? new Date().toISOString() : null,
    })
    .eq("id", id);
}
