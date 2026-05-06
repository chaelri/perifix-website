// approve-account — admin-only Edge Function that creates a Supabase Auth user
// from an account_requests row, sets a generated temp password, and flips the
// request to status='approved'. Returns the temp password to the caller.
//
// Auth: caller must pass their session JWT in the Authorization header. The
// function verifies the caller's profiles.role = 'admin' before doing anything.

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

function generateTempPassword(): string {
  // 16 chars, alphanumeric, ambiguous chars (0/O/1/l/I) excluded.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  return out;
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

    const tempPassword = generateTempPassword();
    const fullName = `${reqRow.first_name} ${reqRow.last_name}`.trim();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: reqRow.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: reqRow.first_name,
        last_name: reqRow.last_name,
        full_name: fullName,
      },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Failed to create user" }, 500);
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
      tempPassword,
      userId: created.user.id,
      email: reqRow.email,
      name: fullName,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
