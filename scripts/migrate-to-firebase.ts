/**
 * One-shot migration: Supabase → Firebase.
 *
 * Run with:  npx tsx scripts/migrate-to-firebase.ts
 *
 * Reads .env.local for both Supabase + Firebase creds. Loads firebase-service-account.json
 * from the repo root. Pulls every row from the 6 Supabase tables + the step-images bucket
 * + every Supabase auth user, and writes the equivalent into Firestore / Firebase Auth /
 * Firebase Storage.
 *
 * Re-runnable: each step writes idempotently (.set() with merge, importUsers tolerates
 * existing UIDs). Safe to re-run if a stage fails partway.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { Buffer } from "node:buffer";
import { createClient } from "@supabase/supabase-js";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type UserImportRecord } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// ---------------------------------------------------------------------------
// 1. Bootstrap
// ---------------------------------------------------------------------------

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SERVICE_ACCOUNT_PATH = path.resolve(
  process.cwd(),
  process.env.GOOGLE_APPLICATION_CREDENTIALS || "./firebase-service-account.json",
);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase creds in .env.local");
}
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  throw new Error(`Service account JSON not found at ${SERVICE_ACCOUNT_PATH}`);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const serviceAccount = JSON.parse(
  fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"),
) as ServiceAccount;
const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "perifix-website.firebasestorage.app",
});

const auth = getAuth(app);
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

// ---------------------------------------------------------------------------
// 2. Helpers
// ---------------------------------------------------------------------------

function log(stage: string, msg: string) {
  console.log(`[${stage}] ${msg}`);
}

async function fetchAll<T>(table: string, columns = "*"): Promise<T[]> {
  const all: T[] = [];
  const PAGE = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Supabase fetch ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function batchWrite(
  collection: string,
  docs: Array<{ id: string; data: Record<string, unknown> }>,
) {
  const CHUNK = 400;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const slice = docs.slice(i, i + CHUNK);
    const batch = db.batch();
    for (const { id, data } of slice) {
      batch.set(db.collection(collection).doc(id), data, { merge: true });
    }
    await batch.commit();
  }
  log(collection, `wrote ${docs.length} docs`);
}

function tsFromIso(iso: string | null | undefined): Timestamp | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Timestamp.fromDate(d);
}

// ---------------------------------------------------------------------------
// 3. Auth users  (preserves Supabase UUIDs as Firebase UIDs)
// ---------------------------------------------------------------------------

interface SupabaseAuthUser {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
}

async function migrateAuthUsers(): Promise<Set<string>> {
  log("auth", "fetching Supabase auth users…");
  const users: SupabaseAuthUser[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`auth.listUsers: ${error.message}`);
    if (!data.users.length) break;
    users.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
      })),
    );
    if (data.users.length < 1000) break;
    page += 1;
  }
  log("auth", `pulled ${users.length} users from Supabase`);

  const records: UserImportRecord[] = users
    .filter((u) => !!u.email)
    .map((u) => ({
      uid: u.id,
      email: u.email!,
      emailVerified: !!u.email_confirmed_at,
      disabled: false,
      metadata: {
        creationTime: u.created_at ? new Date(u.created_at).toUTCString() : undefined,
        lastSignInTime: u.last_sign_in_at
          ? new Date(u.last_sign_in_at).toUTCString()
          : undefined,
      },
    }));

  if (!records.length) {
    log("auth", "no users to import");
    return new Set();
  }

  // No password import — Supabase bcrypt hashes aren't exposed via the admin API,
  // so users will sign in via password-reset email after migration.
  const result = await auth.importUsers(records);
  log(
    "auth",
    `imported ${result.successCount} users, ${result.failureCount} failed`,
  );
  if (result.failureCount > 0) {
    for (const e of result.errors) {
      console.error(`  - row ${e.index}: ${e.error.message}`);
    }
  }
  return new Set(records.map((r) => r.uid!));
}

// ---------------------------------------------------------------------------
// 4. profiles
// ---------------------------------------------------------------------------

interface SupabaseProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  role: "student" | "admin";
  created_at: string | null;
  last_login_at: string | null;
}

async function migrateProfiles(validUids: Set<string>) {
  log("profiles", "fetching…");
  const rows = await fetchAll<SupabaseProfile>(
    "profiles",
    "id, email, first_name, last_name, full_name, role, created_at, last_login_at",
  );
  const docs = rows
    .filter((r) => validUids.has(r.id))
    .map((r) => ({
      id: r.id,
      data: {
        email: r.email,
        first_name: r.first_name,
        last_name: r.last_name,
        full_name: r.full_name,
        role: r.role,
        created_at: tsFromIso(r.created_at),
        last_login_at: tsFromIso(r.last_login_at),
      },
    }));
  await batchWrite("profiles", docs);
}

// ---------------------------------------------------------------------------
// 5. account_requests
// ---------------------------------------------------------------------------

interface SupabaseAccountRequest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string | null;
}

async function migrateAccountRequests() {
  log("account_requests", "fetching…");
  const rows = await fetchAll<SupabaseAccountRequest>(
    "account_requests",
    "id, first_name, last_name, email, status, approved_by, approved_at, created_at",
  );
  const docs = rows.map((r) => ({
    id: String(r.id),
    data: {
      first_name: r.first_name,
      last_name: r.last_name,
      email: r.email,
      status: r.status,
      approved_by: r.approved_by,
      approved_at: tsFromIso(r.approved_at),
      created_at: tsFromIso(r.created_at),
    },
  }));
  await batchWrite("account_requests", docs);
}

// ---------------------------------------------------------------------------
// 6. support_requests
// ---------------------------------------------------------------------------

interface SupabaseSupportRequest {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  device: string | null;
  issue: string | null;
  description: string;
  status: "pending" | "priority" | "resolved";
  source: "contact" | "troubleshooting";
  created_at: string | null;
  updated_at: string | null;
}

async function migrateSupportRequests() {
  log("support_requests", "fetching…");
  const rows = await fetchAll<SupabaseSupportRequest>(
    "support_requests",
    "id, user_id, name, email, device, issue, description, status, source, created_at, updated_at",
  );
  const docs = rows.map((r) => ({
    id: r.id,
    data: {
      user_id: r.user_id,
      name: r.name,
      email: r.email,
      device: r.device,
      issue: r.issue,
      description: r.description,
      status: r.status,
      source: r.source,
      created_at: tsFromIso(r.created_at),
      updated_at: tsFromIso(r.updated_at),
    },
  }));
  await batchWrite("support_requests", docs);
}

// ---------------------------------------------------------------------------
// 7. devices  (slug as doc id — used in URLs)
// ---------------------------------------------------------------------------

interface SupabaseDevice {
  id: number;
  slug: string;
  name: string;
  category: "input" | "output";
  icon_name: string | null;
  color_class: string | null;
  display_order: number | null;
}

async function migrateDevices(): Promise<Map<number, string>> {
  log("devices", "fetching…");
  const rows = await fetchAll<SupabaseDevice>(
    "devices",
    "id, slug, name, category, icon_name, color_class, display_order",
  );
  const docs = rows.map((r) => ({
    id: r.slug,
    data: {
      slug: r.slug,
      name: r.name,
      category: r.category,
      icon_name: r.icon_name,
      color_class: r.color_class,
      display_order: r.display_order ?? 0,
    },
  }));
  await batchWrite("devices", docs);
  // Old numeric id → slug, used by the problems migration to denormalise device_slug.
  return new Map(rows.map((r) => [r.id, r.slug]));
}

// ---------------------------------------------------------------------------
// 8. problems  (auto-id docs, denormalize device_slug for client joins;
//     rewrite step image URLs from Supabase storage → Firebase storage)
// ---------------------------------------------------------------------------

interface ProblemStep {
  step?: number;
  title?: string;
  description?: string;
  image?: string | null;
  image_url?: string | null;
}

interface SupabaseProblem {
  id: number;
  device_id: number;
  slug: string;
  title: string;
  severity: "common" | "moderate" | "rare";
  steps: ProblemStep[] | null;
  display_order: number | null;
}

function rewriteStepImage(url: string | null | undefined): string | null {
  if (!url) return null;
  // Old:  https://<ref>.supabase.co/storage/v1/object/public/step-images/steps/abc.png
  // New:  https://firebasestorage.googleapis.com/v0/b/perifix-website.firebasestorage.app/o/step-images%2Fsteps%2Fabc.png?alt=media
  const m = url.match(/\/step-images\/(.+)$/);
  if (!m) return url; // not a Supabase storage URL — leave it alone (e.g. Unsplash)
  const objectPath = m[1].split("?")[0];
  const encoded = encodeURIComponent(`step-images/${objectPath}`);
  return `https://firebasestorage.googleapis.com/v0/b/perifix-website.firebasestorage.app/o/${encoded}?alt=media`;
}

async function migrateProblems(deviceIdToSlug: Map<number, string>) {
  log("problems", "fetching…");
  const rows = await fetchAll<SupabaseProblem>(
    "problems",
    "id, device_id, slug, title, severity, steps, display_order",
  );
  const docs = rows.map((r) => {
    const deviceSlug = deviceIdToSlug.get(r.device_id) ?? null;
    const steps = (r.steps ?? []).map((s) => ({
      ...s,
      image: rewriteStepImage(s.image ?? s.image_url ?? null),
    }));
    return {
      // Stable, predictable doc id so re-runs upsert in place.
      id: `${deviceSlug ?? "unknown"}__${r.slug}`,
      data: {
        legacy_id: r.id,
        device_slug: deviceSlug,
        slug: r.slug,
        title: r.title,
        severity: r.severity,
        steps,
        display_order: r.display_order ?? 0,
      },
    };
  });
  await batchWrite("problems", docs);
  return new Map(rows.map((r) => [r.id, `${deviceIdToSlug.get(r.device_id)}__${r.slug}`]));
}

// ---------------------------------------------------------------------------
// 9. troubleshooting_feedback
// ---------------------------------------------------------------------------

interface SupabaseFeedback {
  id: number;
  user_id: string | null;
  problem_id: number | null;
  device_slug: string | null;
  problem_slug: string | null;
  helpful: boolean;
  created_at: string | null;
}

async function migrateFeedback(problemIdToDocId: Map<number, string>) {
  log("troubleshooting_feedback", "fetching…");
  const rows = await fetchAll<SupabaseFeedback>(
    "troubleshooting_feedback",
    "id, user_id, problem_id, device_slug, problem_slug, helpful, created_at",
  );
  const docs = rows.map((r) => ({
    id: String(r.id),
    data: {
      user_id: r.user_id,
      problem_doc_id: r.problem_id ? problemIdToDocId.get(r.problem_id) ?? null : null,
      device_slug: r.device_slug,
      problem_slug: r.problem_slug,
      helpful: r.helpful,
      created_at: tsFromIso(r.created_at),
    },
  }));
  await batchWrite("troubleshooting_feedback", docs);
}

// ---------------------------------------------------------------------------
// 10. Storage  (step-images bucket → Firebase Storage)
// ---------------------------------------------------------------------------

async function migrateStorage() {
  log("storage", "listing step-images bucket…");
  const { data, error } = await supabase.storage.from("step-images").list("steps", {
    limit: 1000,
  });
  if (error) {
    console.error(`  ! list failed: ${error.message}`);
    return;
  }
  if (!data || data.length === 0) {
    log("storage", "bucket empty");
    return;
  }
  log("storage", `found ${data.length} objects, uploading to Firebase…`);
  let uploaded = 0;
  for (const obj of data) {
    const supabasePath = `steps/${obj.name}`;
    const { data: blob, error: dlErr } = await supabase.storage
      .from("step-images")
      .download(supabasePath);
    if (dlErr || !blob) {
      console.error(`  ! download ${supabasePath}: ${dlErr?.message}`);
      continue;
    }
    const buf = Buffer.from(await blob.arrayBuffer());
    const target = bucket.file(`step-images/${supabasePath}`);
    await target.save(buf, {
      contentType: blob.type || "image/jpeg",
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });
    await target.makePublic().catch(() => undefined); // best-effort; rules allow public read
    uploaded += 1;
  }
  log("storage", `uploaded ${uploaded}/${data.length}`);
}

// ---------------------------------------------------------------------------
// 11. Run
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Supabase → Firebase migration ===\n");
  const validUids = await migrateAuthUsers();
  await migrateProfiles(validUids);
  await migrateAccountRequests();
  await migrateSupportRequests();
  const deviceMap = await migrateDevices();
  const problemMap = await migrateProblems(deviceMap);
  await migrateFeedback(problemMap);
  await migrateStorage();
  console.log("\n✅ Migration complete.");
  console.log(
    "Note: existing users have no Firebase password. They must reset via " +
      'sendPasswordResetEmail() or "Forgot password" flow on first sign-in.',
  );
}

main().catch((e) => {
  console.error("\n❌ Migration failed:", e);
  process.exit(1);
});
