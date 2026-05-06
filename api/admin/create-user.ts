import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, requireAdminFromHeader, tempPassword } from "../_lib/admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  try {
    await requireAdminFromHeader(req.headers.authorization);
  } catch (e: any) {
    return res.status(e.status || 401).json({ ok: false, error: e.message });
  }

  const { email, first_name, last_name, role } = req.body ?? {};
  if (!email || !first_name) {
    return res.status(400).json({ ok: false, error: "email and first_name required" });
  }
  if (role !== "student" && role !== "admin") {
    return res.status(400).json({ ok: false, error: "role must be student or admin" });
  }

  const password = tempPassword();
  const cleanEmail = String(email).trim().toLowerCase();
  const fullName = [first_name, last_name].filter(Boolean).join(" ").trim();

  try {
    const userRecord = await adminAuth.createUser({
      email: cleanEmail,
      password,
      displayName: fullName || undefined,
      emailVerified: false,
    });

    await adminDb.doc(`profiles/${userRecord.uid}`).set({
      email: cleanEmail,
      first_name: first_name ?? null,
      last_name: last_name ?? null,
      full_name: fullName || null,
      role,
      created_at: FieldValue.serverTimestamp(),
      last_login_at: null,
    });

    return res.status(200).json({
      ok: true,
      uid: userRecord.uid,
      email: cleanEmail,
      password,
    });
  } catch (e: any) {
    const code = e?.code || "unknown";
    if (code === "auth/email-already-exists") {
      return res.status(409).json({ ok: false, error: "Email already exists" });
    }
    return res.status(500).json({ ok: false, error: e?.message || "create-user failed" });
  }
}
