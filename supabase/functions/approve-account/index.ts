// approve-account — admin-only Edge Function that converts an account_requests
// row into a real Supabase Auth user via inviteUserByEmail. The user receives
// a magic-link email; they click it, land on /reset-password, set their own
// password, and are signed in.

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
    const requestId = body?.requestId;
    const redirectTo = typeof body?.redirectTo === "string" ? body.redirectTo : undefined;
    if (!requestId) return json({ error: "Missing requestId" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: reqRow, error: fetchErr } = await admin
      .from("account_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (fetchErr) return json({ error: fetchErr.message }, 500);
    if (!reqRow) return json({ error: "Account request not found" }, 404);
    if (reqRow.status !== "pending") {
      return json({ error: `Request already ${reqRow.status}` }, 400);
    }

    const fullName = `${reqRow.first_name} ${reqRow.last_name}`.trim();

    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
      reqRow.email,
      {
        data: {
          first_name: reqRow.first_name,
          last_name: reqRow.last_name,
          full_name: fullName,
        },
        redirectTo,
      },
    );
    if (inviteErr || !invited.user) {
      return json({ error: inviteErr?.message ?? "Failed to send invite" }, 500);
    }

    const { error: updateErr } = await admin
      .from("account_requests")
      .update({
        status: "approved",
        approved_by: callerData.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (updateErr) {
      return json({ error: updateErr.message }, 500);
    }

    return json({
      ok: true,
      method: "invite_email",
      userId: invited.user.id,
      email: reqRow.email,
      name: fullName,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
