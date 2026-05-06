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
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    result.adminAppLoaded = true;
    if (!getApps().length) {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);
      initializeApp({ credential: cert(sa) });
      result.initialized = true;
    } else {
      result.initialized = "already";
    }
    const { getAuth } = await import("firebase-admin/auth");
    const u: any = await getAuth()
      .getUserByEmail("charliecayno@gmail.com")
      .catch((e) => ({ err: e.message }));
    result.lookup = u.err ? { error: u.err } : { uid: u.uid, email: u.email };
    if (u.uid) {
      const { getFirestore } = await import("firebase-admin/firestore");
      const snap: any = await getFirestore()
        .doc(`profiles/${u.uid}`)
        .get()
        .catch((e) => ({ err: e.message }));
      result.firestore = snap.err
        ? { error: snap.err }
        : { exists: snap.exists, role: snap.data()?.role };
    }
  } catch (e) {
    result.bootstrapError = (e as Error).message;
    result.bootstrapStack = (e as Error).stack?.split("\n").slice(0, 5);
  }

  return res.status(200).json(result);
}
