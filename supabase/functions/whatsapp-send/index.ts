// HostGrap WhatsApp API V2 sender — server-side only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizePhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0") && digits.length === 10) return "94" + digits.slice(1);
  return digits;
}

async function callHostgrap(phone: string, message: string) {
  const email = Deno.env.get("HOSTGRAP_EMAIL");
  const apiKey = Deno.env.get("HOSTGRAP_API_KEY");
  const baseUrl = Deno.env.get("HOSTGRAP_BASE_URL") ?? "https://wa-api.hostgrap.com/api";
  if (!email || !apiKey) throw new Error("HostGrap credentials not configured");

  const form = new URLSearchParams();
  form.set("email", email);
  form.set("api_key", apiKey);
  form.set("phone", phone);
  form.set("message", message);

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/send-message.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch { /* keep text */ }
  return { ok: res.ok, status: res.status, body: parsed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Admin-only
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "send");

    // Test mode (does not require log update)
    if (action === "test") {
      const phone = normalizePhone(String(body.phone ?? ""));
      const message = String(body.message ?? "").trim();
      if (!phone || phone.length < 10) {
        return new Response(JSON.stringify({ error: "Invalid phone" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!message) {
        return new Response(JSON.stringify({ error: "Message required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await callHostgrap(phone, message);
      return new Response(JSON.stringify(r), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Standard send: requires logId (existing pending row) OR raw send (creates row via service role)
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const phoneRaw = String(body.phone ?? "");
    const message = String(body.message ?? "").trim();
    const logId: string | null = body.logId ?? null;
    const phone = normalizePhone(phoneRaw);

    if (!phone || phone.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid phone number" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!message) {
      return new Response(JSON.stringify({ error: "Message body required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    let success = false;
    let errMsg: string | null = null;
    try {
      result = await callHostgrap(phone, message);
      // Heuristic: HostGrap returns JSON with status/success indicators
      const b: any = result.body;
      success = result.ok && (
        b === "success" ||
        b?.status === "success" ||
        b?.status === true ||
        b?.success === true ||
        (typeof b === "string" && b.toLowerCase().includes("success"))
      );
      if (!success) errMsg = typeof b === "string" ? b : (b?.message || b?.error || "Provider returned non-success");
    } catch (e) {
      result = { ok: false, status: 0, body: String((e as Error).message) };
      errMsg = (e as Error).message;
    }

    if (logId) {
      await service.from("whatsapp_messages").update({
        status: success ? "sent" : "failed",
        sent_at: success ? new Date().toISOString() : null,
        error: errMsg,
        context: { provider: "hostgrap", api_response: result.body, http_status: result.status },
      }).eq("id", logId);
    }

    return new Response(JSON.stringify({ success, result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
