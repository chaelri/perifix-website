import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminAuth, adminDb, requireAdminFromHeader } from "./_lib.js";

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

  const { userId } = req.body ?? {};
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId required" });
  }
  if (userId === approver.uid) {
    return res.status(400).json({ ok: false, error: "You can't delete your own account." });
  }

  try {
    // Delete the auth user first; if it doesn't exist, the profile doc cleanup
    // still runs so we don't leave orphans behind.
    await adminAuth.deleteUser(userId).catch((e) => {
      if (e?.code !== "auth/user-not-found") throw e;
    });
    await adminDb.doc(`profiles/${userId}`).delete().catch(() => undefined);
    return res.status(200).json({ ok: true, userId });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "delete failed" });
  }
}
