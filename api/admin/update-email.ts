import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminAuth, adminDb, requireAdminFromHeader } from "./_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  try {
    await requireAdminFromHeader(req.headers.authorization);
  } catch (e: any) {
    return res.status(e.status || 401).json({ ok: false, error: e.message });
  }

  const { userId, newEmail } = req.body ?? {};
  if (!userId || !newEmail) {
    return res.status(400).json({ ok: false, error: "userId and newEmail required" });
  }
  const cleanEmail = String(newEmail).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return res.status(400).json({ ok: false, error: "Invalid email format" });
  }

  try {
    await adminAuth.updateUser(userId, { email: cleanEmail, emailVerified: false });
    await adminDb.doc(`profiles/${userId}`).update({ email: cleanEmail });
    return res.status(200).json({ ok: true, userId, email: cleanEmail });
  } catch (e: any) {
    if (e?.code === "auth/email-already-exists") {
      return res.status(409).json({ ok: false, error: "Email already in use" });
    }
    if (e?.code === "auth/invalid-email") {
      return res.status(400).json({ ok: false, error: "Invalid email format" });
    }
    return res.status(500).json({ ok: false, error: e?.message || "update-email failed" });
  }
}
