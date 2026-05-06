import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminAuth, requireAdminFromHeader } from "./_lib";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  try {
    await requireAdminFromHeader(req.headers.authorization);
  } catch (e: any) {
    return res.status(e.status || 401).json({ ok: false, error: e.message });
  }

  const { userId } = req.body ?? {};
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId required" });
  }

  try {
    const target = await adminAuth.getUser(userId);
    if (!target.email) {
      return res.status(400).json({ ok: false, error: "User has no email on file" });
    }
    const link = await adminAuth.generatePasswordResetLink(target.email);
    return res.status(200).json({
      ok: true,
      userId: target.uid,
      email: target.email,
      name: target.displayName ?? null,
      actionLink: link,
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "reset failed" });
  }
}
