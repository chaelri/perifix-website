# Perifix Website — Project Context for Claude

This file is auto-loaded in any Claude Code session opened anywhere in this repo.

## What this project is

The **real, functional** Perifix website — a visual peripheral-troubleshooting guide. Originally forked from the Figma Make prototype at `apguano/Perifixwebsiteprototype` and now backed by Firebase + hosted on Vercel.

- **Repo:** https://github.com/chaelri/perifix-website (public)
- **Live target:** https://perifix.site (Vercel-hosted; `perifix.vercel.app` still resolves)
- **Backend:** Firebase project `perifix-website` (Spark/free plan), Firestore + Auth + Storage in `asia-southeast1` (Singapore)
- **Frontend stack:** Vite 6 + React 18 + TypeScript + Tailwind v4 + Radix UI / shadcn pattern + react-router-dom 7 + TanStack Query
- **Server-side admin:** Vercel serverless functions under `api/admin/*` (Spark plan = no Cloud Functions, so we use Vercel for invite/reset/create-user flows)
- **Owner:** Charlie Cayno (chaelri on GitHub, charliecayno@gmail.com personally; ccayno@azurtechnology.com on this machine)

## Backend layout (Firebase)

**Firestore collections** — all reads/writes go through the modular SDK in `src/app/utils/firebase/client.ts`:

| Collection                  | Doc ID                          | Used by                                                      |
|-----------------------------|---------------------------------|--------------------------------------------------------------|
| `profiles`                  | Firebase UID                    | AuthContext, Settings, UserAccounts, AdminDashboard counts   |
| `account_requests`          | auto                            | (legacy — UI replaced by admin-direct create flow)           |
| `support_requests`          | auto                            | Contact, ContactSupportModal, SupportRequests (with onSnapshot realtime) |
| `devices`                   | `slug` (e.g. `mouse`)           | Troubleshooting, TroubleshootingAdmin                        |
| `problems`                  | `${device_slug}__${slug}`       | Troubleshooting, TroubleshootingAdmin                        |
| `troubleshooting_feedback`  | auto                            | TroubleshootingGuideModal feedback, AnalyticsDashboard       |

**Security rules:** `firestore.rules` + `storage.rules` at repo root. Admin-vs-student gating reads `profiles/{uid}.role`.

**Storage:** `step-images/` prefix in the default bucket (`perifix-website.firebasestorage.app`), public read, admin write, 5 MB max, image/* only.

**Vercel API routes** (`api/admin/`):
- `POST /api/admin/create-user` — admin creates a new user (auth + profile doc) and returns a temp password to display once.
- `POST /api/admin/reset-password` — admin generates a Firebase password-reset link for an existing user.
- `POST /api/admin/approve-account` — legacy approve flow (still works against `account_requests`).

All three routes verify a Firebase ID token and confirm the caller's `profiles/{uid}.role === "admin"` before doing anything. They read the service account from the `FIREBASE_SERVICE_ACCOUNT_JSON` env var (single-line JSON).

## Locked-in decisions

1. ✅ Repo `chaelri/perifix-website`, public.
2. ✅ Hosting on Vercel; primary domain `perifix.site`, `perifix.vercel.app` still resolves.
3. ✅ Firebase Auth (email/password) — no hardcoded prototype passwords.
4. ✅ Account-creation flow: **admins create users directly** in UserAccounts. The old "Request Account" form on LoginSelection has been removed; LoginSelection now points students to /contact.
5. ✅ No auto-push — Charlie controls every `git push` manually.
6. ✅ No auto-commit unless explicitly asked.
7. ✅ Spark plan only (no Blaze billing yet) — server-side work goes to Vercel functions, not Cloud Functions.

## Conventions in this repo

- **Path alias:** `@/foo` → `src/app/foo` (configured in `vite.config.ts` and `tsconfig.json`).
- **No emoji** in code unless explicitly requested.
- **Tailwind v4** browser-style config (no `tailwind.config.ts`; `@import "tailwindcss"` in CSS).
- **Component library:** Radix primitives wrapped in shadcn-style components under `src/app/components/ui/`.
- **Forms:** `react-hook-form` is installed but not yet used everywhere. Prefer it for new forms.
- **Toasts:** `sonner` mounted at root; use `toast.success/error` from `sonner`.
- **Server timestamps:** prefer `serverTimestamp()` over `new Date()` for `created_at` / `updated_at` writes.
- **List queries:** order by `display_order` (devices, problems) or `created_at` (requests, feedback).

## Things to NOT do

- Don't reintroduce Supabase. The migration is final — both `@supabase/supabase-js` and the entire `supabase/` directory have been removed.
- Don't commit `.env.local` or `firebase-service-account.json` (both gitignored).
- Don't auto-deploy or auto-commit. Charlie reviews everything.
- Don't reintroduce the Figma `figma:asset/` import paths in new code (existing ones are handled by the resolver in `vite.config.ts` — leave it for backward compat with imported assets).
- Don't use Firebase Cloud Functions — the project is on Spark plan. Use Vercel API routes for server-side work instead.

## Migration history

The original build was on Supabase (`czejkiwlczhrwlesqrxg.supabase.co`, ap-southeast-1). On 2026-05-06 we migrated to Firebase end-to-end after the Supabase edge functions started failing intermittently. Migration script is preserved at `scripts/migrate-to-firebase.ts` for reference but the Supabase project itself can be deleted whenever Charlie confirms Firebase is stable.
