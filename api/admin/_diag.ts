import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const result: Record<string, unknown> = {
    nodeVersion: process.version,
    hasEnv: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    envLen: process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.length ?? 0,
  };

  try {
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (json) {
      const parsed = JSON.parse(json);
      result.parsed = {
        type: parsed.type,
        project_id: parsed.project_id,
        client_email: parsed.client_email,
        privateKeyStartsWith: parsed.private_key?.slice(0, 27),
        privateKeyHasNewlines: parsed.private_key?.includes("\n") ?? false,
        privateKeyHasEscapedN: parsed.private_key?.includes("\\n") ?? false,
      };
    }
  } catch (e) {
    result.parseError = (e as Error).message;
  }

  try {
    const adminApp = await import("firebase-admin/app");
    result.adminAppLoaded = true;
    result.adminAppKeys = Object.keys(adminApp).slice(0, 5);
  } catch (e) {
    result.adminAppLoadError = (e as Error).message;
  }

  return res.status(200).json(result);
}
