// reset-user-password — admin-only Edge Function that generates a new
// temporary password for an existing user and applies it via the auth admin
// API. Returns the new password so the admin can share it manually.

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
    const userId = body?.userId;
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

    const tempPassword = generateTempPassword();

    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });
    if (updateErr) {
      return json({ error: updateErr.message }, 500);
    }

    return json({
      ok: true,
      tempPassword,
      userId: target.id,
      email: target.email,
      name:
        target.full_name ||
        [target.first_name, target.last_name].filter(Boolean).join(" ").trim() ||
        target.email,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
