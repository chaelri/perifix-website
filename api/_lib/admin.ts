// Shared Firebase Admin bootstrap for Vercel serverless functions.
// Service account JSON is loaded from FIREBASE_SERVICE_ACCOUNT_JSON env var
// (single-line JSON string) — set it in Vercel Project Settings → Environment Variables.
import { getApps, initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function bootstrap() {
  if (getApps().length) return;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON env var");
  const sa = JSON.parse(json) as ServiceAccount;
  initializeApp({ credential: cert(sa) });
}

bootstrap();

export const adminAuth = getAuth();
export const adminDb = getFirestore();

export async function requireAdminFromHeader(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Missing bearer token"), { status: 401 });
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw Object.assign(new Error("Empty bearer token"), { status: 401 });
  }
  const decoded = await adminAuth.verifyIdToken(token).catch(() => null);
  if (!decoded) {
    throw Object.assign(new Error("Invalid token"), { status: 401 });
  }
  const profile = await adminDb.doc(`profiles/${decoded.uid}`).get();
  if (!profile.exists || profile.data()?.role !== "admin") {
    throw Object.assign(new Error("Admin role required"), { status: 403 });
  }
  return decoded;
}

export function tempPassword(): string {
  // 10-char password with at least one digit + one uppercase. Easy to read aloud.
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digit = "23456789";
  const all = upper + lower + digit;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let p = pick(upper) + pick(lower) + pick(digit);
  for (let i = 0; i < 7; i++) p += pick(all);
  return p
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
