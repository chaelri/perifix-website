// reset-user-password — admin-only Edge Function that triggers a password
// recovery email for an existing user. The user clicks the link in the email,
// lands on /reset-password, and sets a new password. We use generateLink with
// type='recovery' which both sends the email AND returns the link, so the
// admin can fall back to copy/share if SMTP is rate-limited.

import { createClient } from "npm:@supabase/supabase-js@2.49.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Warm-keep ping. Hit by a GitHub Actions cron every ~5 minutes so the
    // function stays warm and admins don't pay the cold-start penalty when
    // they click Generate Password. Returns immediately, no auth required.
    if (req.method === "GET") {
      return json({ ok: true, warm: true });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const userScoped = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: callerData, error: callerErr } = await userScoped.auth.getUser();
    if (callerErr || !callerData.user) {
      return json({ error: "Invalid token" }, 401);
    }

    const { data: callerProfile } = await userScoped
      .from("profiles")
      .select("role")
      .eq("id", callerData.user.id)
      .maybeSingle();
    if (callerProfile?.role !== "admin") {
      return json({ error: "Forbidden — admins only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const userId = body?.userId;
    const redirectTo = typeof body?.redirectTo === "string" ? body.redirectTo : undefined;
    if (!userId) return json({ error: "Missing userId" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: target, error: fetchErr } = await admin
      .from("profiles")
      .select("id, email, full_name, first_name, last_name")
      .eq("id", userId)
      .maybeSingle();
    if (fetchErr) return json({ error: fetchErr.message }, 500);
    if (!target) return json({ error: "User not found" }, 404);

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: target.email,
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (linkErr) {
      return json({ error: linkErr.message }, 500);
    }

    return json({
      ok: true,
      method: "recovery_email",
      userId: target.id,
      email: target.email,
      name:
        target.full_name ||
        [target.first_name, target.last_name].filter(Boolean).join(" ").trim() ||
        target.email,
      // Fallback link in case email didn't deliver — admin can paste it for the user.
      actionLink: linkData.properties?.action_link ?? null,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
