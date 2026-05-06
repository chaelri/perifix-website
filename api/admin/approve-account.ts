import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, requireAdminFromHeader, tempPassword } from "./_lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  let approver;
  try {
    approver = await requireAdminFromHeader(req.headers.authorization);
  } catch (e: any) {
    return res.status(e.status || 401).json({ ok: false, error: e.message });
  }

  const { requestId } = req.body ?? {};
  if (!requestId) {
    return res.status(400).json({ ok: false, error: "requestId required" });
  }

  try {
    const ref = adminDb.doc(`account_requests/${requestId}`);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: "Request not found" });
    }
    const data = snap.data()!;
    if (data.status === "approved") {
      return res.status(409).json({ ok: false, error: "Already approved" });
    }
    const email = String(data.email).trim().toLowerCase();
    const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
    const password = tempPassword();

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName || undefined,
      emailVerified: false,
    });

    await adminDb.doc(`profiles/${userRecord.uid}`).set({
      email,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      full_name: fullName || null,
      role: "student",
      created_at: FieldValue.serverTimestamp(),
      last_login_at: null,
    });

    await ref.update({
      status: "approved",
      approved_by: approver.uid,
      approved_at: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      ok: true,
      uid: userRecord.uid,
      email,
      name: fullName,
      password,
    });
  } catch (e: any) {
    if (e?.code === "auth/email-already-exists") {
      return res.status(409).json({ ok: false, error: "Email already has an account" });
    }
    return res.status(500).json({ ok: false, error: e?.message || "approval failed" });
  }
}
