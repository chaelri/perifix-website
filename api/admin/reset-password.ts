import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminAuth, requireAdminFromHeader } from "./_lib.js";

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
    // Origin = the same URL the request came from (e.g. https://perifix.site)
    // so the reset link lands on our own /reset-password page, not the
    // default firebaseapp.com hosted handler. Fallback to env var or a
    // sensible default if the header is missing.
    const origin =
      (req.headers.origin as string | undefined) ||
      (req.headers["x-forwarded-host"]
        ? `https://${req.headers["x-forwarded-host"]}`
        : null) ||
      process.env.PUBLIC_APP_URL ||
      "https://perifix.site";
    const link = await adminAuth.generatePasswordResetLink(target.email, {
      url: `${origin}/reset-password`,
      handleCodeInApp: true,
    });
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
