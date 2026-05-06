// HostGrap WhatsApp API V2 sender — server-side only.
// Always responds with HTTP 200 + JSON { success, statusCode, response, formattedPhone, error? }
// so the frontend can display the actual provider response (never "non-2xx").
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Normalize any SL/intl phone to +94XXXXXXXXX */
function formatPhone(input: string): string {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (!digits) return "";
  let local = digits;
  if (local.startsWith("0") && local.length === 10) local = "94" + local.slice(1);
  if (!local.startsWith("94") && local.length === 9) local = "94" + local;
  return "+" + local;
}

async function callHostgrap(formattedPhone: string, message: string) {
  const email = Deno.env.get("HOSTGRAP_EMAIL");
  const apiKey = Deno.env.get("HOSTGRAP_API_KEY");
  const baseUrl = Deno.env.get("HOSTGRAP_BASE_URL") ?? "https://wa-api.hostgrap.com/api";
  if (!email || !apiKey) {
    return {
      success: false,
      statusCode: 0,
      response: "HostGrap API email or key is missing",
      formattedPhone,
    };
  }

  const params = new URLSearchParams();
  params.append("email", email);
  params.append("api_key", apiKey);
  params.append("phone", formattedPhone);
  params.append("message", message);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/send-message.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const responseText = await res.text();
    // Heuristic success — HostGrap returns plain text or JSON
    let parsedSuccess = res.ok;
    const lower = responseText.toLowerCase();
    if (lower.includes("error") || lower.includes("invalid") || lower.includes("fail")) {
      parsedSuccess = false;
    }
    try {
      const j = JSON.parse(responseText);
      if (j && typeof j === "object") {
        if (j.status === "success" || j.success === true) parsedSuccess = true;
        if (j.status === "error" || j.success === false) parsedSuccess = false;
      }
    } catch { /* plain text */ }
    return {
      success: res.ok && parsedSuccess,
      statusCode: res.status,
      response: responseText,
      formattedPhone,
    };
  } catch (e) {
    return {
      success: false,
      statusCode: 0,
      response: `Network error: ${(e as Error).message}`,
      formattedPhone,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Unauthorized", response: "Missing bearer token" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ success: false, error: "Unauthorized", response: `Invalid token: ${userErr?.message ?? "no user"}` });
    }
    const userId = userData.user.id;

    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return json({ success: false, error: "Forbidden", response: "Admin only" });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "send");
    const rawPhone = String(body.phone ?? "");
    const message = String(body.message ?? "").trim();
    const formattedPhone = formatPhone(rawPhone);

    if (!formattedPhone || formattedPhone.replace(/\D/g, "").length < 10) {
      return json({ success: false, error: "Invalid phone", response: "Invalid phone number", formattedPhone });
    }
    if (!message) {
      return json({ success: false, error: "Message required", response: "Message body is empty", formattedPhone });
    }

    const result = await callHostgrap(formattedPhone, message);

    // Persist to log if logId provided
    const logId: string | null = body.logId ?? null;
    if (logId) {
      const service = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await service.from("whatsapp_messages").update({
        status: result.success ? "sent" : "failed",
        sent_at: result.success ? new Date().toISOString() : null,
        error: result.success ? null : String(result.response).slice(0, 1000),
        context: {
          provider: "hostgrap",
          api_response: result.response,
          http_status: result.statusCode,
          formatted_phone: result.formattedPhone,
          test: action === "test",
        },
      }).eq("id", logId);
    }

    return json(result);
  } catch (e) {
    return json({
      success: false,
      error: (e as Error).message,
      response: `Edge function error: ${(e as Error).message}`,
    });
  }
});
