# Perifix Website — Project Context for Claude

This file is auto-loaded in any Claude Code session opened anywhere in this repo. It captures the migration plan, locked-in decisions, and what's done vs. what's next so a fresh session can pick up cleanly.

## What this project is

The **real, functional** Perifix website. Forked from the Figma Make prototype at `apguano/Perifixwebsiteprototype` and being evolved into a production app with real Supabase Auth + DB-backed features + Vercel hosting.

- **Repo:** https://github.com/chaelri/perifix-website (public)
- **Live target:** https://perifix.vercel.app
- **Backend:** Supabase project in `ap-southeast-1` (Singapore), chaelri-owned
- **Frontend stack:** Vite 6 + React 18 + TypeScript + Tailwind v4 + Radix UI / shadcn pattern + react-router-dom 7
- **Owner:** Charlie Cayno (chaelri on GitHub, charliecayno@gmail.com personally; ccayno@azurtechnology.com on this machine)

## Locked-in decisions (from session 2026-05-06)

1. ✅ New repo `chaelri/perifix-website`, **public**.
2. ✅ Supabase region **ap-southeast-1** (Singapore).
3. ✅ Hosting on **Vercel** at `perifix.vercel.app`.
4. ✅ **Real Supabase Auth** — kill the prototype's hardcoded passwords (`admin@perifix.site/admin123`, `student123` for any student email).
5. ✅ Phased build: P1 = Auth + Users + Contact; P2 = Support Requests + Troubleshooting; P3 = Analytics. Don't lose existing functionality on the way.
6. ✅ CLIs installed locally: `supabase` (Homebrew), `vercel` (npm global).
7. **No auto-push** — Charlie controls every `git push` manually.
8. **No auto-commit** unless explicitly asked.

## Current state — what's been done in session 1

- Cloned `apguano/Perifixwebsiteprototype` to `/Users/ccayno/Documents/Perifix/`.
- Cleaned `package.json`: removed 60+ duplicate `"X@Y": "npm:X@Y"` aliases that broke `npm install`; renamed from `@figma/my-make-file` → `perifix-website`; added `react`, `react-dom`, `@types/react*`, `typescript`, `@supabase/supabase-js`, `vite preview` script.
- Removed `pnpm-workspace.yaml` (using npm).
- Added `tsconfig.json` (Vite + bundler resolution, strict mode, `@/*` → `src/app/*`).
- Added `.gitignore`, `.env.example`.
- Updated `README.md` and `index.html` title (no more "Prototype" tag).
- Pushed initial baseline commit to `chaelri/perifix-website` (still using the prototype's fake auth — to be migrated next session).

## Feature inventory — DO NOT LOSE these on migration

The whole point of this rebuild is to keep every existing UX flow working but back it with real data. The prototype currently uses **localStorage** for everything except auth (which itself is mostly fake). Migration plan per page:

### Auth flow (must change first)
- **AdminLogin** (`src/app/pages/AdminLogin.tsx`): hardcoded `admin@perifix.site/perifix123` and `kevin@perifix.site/kevinpogi`. **Bug found:** it calls `useAuth().login()` then *also* writes to localStorage directly — bypassing the AuthContext server call entirely. Replace with `supabase.auth.signInWithPassword`.
- **StudentLogin** (`src/app/pages/StudentLogin.tsx`): accepts any email/password and fakes a token. Same bypass bug. Replace with real sign-in; on first sign-in students should already exist (admin-approved) — see Account Requests flow.
- **AuthContext** (`src/app/contexts/AuthContext.tsx`): currently fetches Hono edge function at `make-server-f7e00e4c/login`. Replace with `@supabase/supabase-js` client; persist via Supabase session, not manual localStorage tokens.
- **ProtectedRoute** (`src/app/components/ProtectedRoute.tsx`): keep — just needs `useAuth()` to return real session.

### Account Requests flow
- **LoginSelection** has an inline "Request Account" form that today writes to `localStorage.perifix_account_requests`.
- **AccountsList** (admin) reads that same localStorage key and lets admins approve / generate a temp password / "Send Credentials" (toast-only — no actual email).
- → Migrate to `account_requests` table; on approval, server creates Supabase Auth user with temp password and sends invite email via Supabase Auth admin API.

### User management
- **UserAccounts** (admin) seeds 6 sample users into `localStorage.perifix_users` on first load (lines 64–113). Inline edit, delete, password generation modal, search filter.
- **AdminDashboard** tries `fetch(/users)` on the edge function; falls back to 4 hardcoded mock users on error.
- → Migrate to `users` table joined on `auth.users.id`; admin-only RLS; delete should soft-delete (not blow away auth user).

### Support Requests flow
- **ContactSupportModal** (opened from negative troubleshooting feedback) writes to `localStorage.support_requests`.
- **SupportRequests** (admin) reads same key, with search + status filter, modal detail view, status update buttons (pending / resolved / priority), delete.
- **Contact** page form is currently mocked (toast only, no submission).
- → Migrate to `support_requests` table. Tie to `user_id` when authenticated (anon submissions allowed for /contact). Real-time subscribe for admin view.

### Troubleshooting flow
- **Troubleshooting** page (1,071 lines!): hardcoded device/problem tree (~9 devices). Expandable categories (input/output → device → severity → problem). Negative feedback opens ContactSupportModal. Feedback writes to `localStorage.troubleshooting_feedback`.
- **TroubleshootingGuideModal**: step-by-step renderer with feedback buttons.
- **SmartSearchBar**: fuzzy match against the same hardcoded `devices` prop.
- → Migrate device/problem tree to `devices` + `problems` tables (so they're CMS-editable). Feedback to `troubleshooting_feedback` table. Keep the existing tree shape — just hydrate from Supabase on mount and cache.

### Analytics
- **AnalyticsDashboard** (admin) reads `localStorage.troubleshooting_feedback`, computes success rate / top problems / device breakdown / time-range + device filters / JSON export.
- → Same data, but query from `troubleshooting_feedback` table with materialized views or RPC for aggregation. Export still works client-side.

### Static pages (no migration needed, but keep)
- **Home, About, FAQs**: pure UI. Home device cards link to `/troubleshooting?device=X` query params.
- **Contact**: form goes to `support_requests` (anonymous submissions allowed).
- **Footer, Navbar, LoadingScreen**: presentational; Navbar uses `useAuth()` for user name + admin links + logout.

## Proposed Supabase schema (P1 → P3)

```sql
-- P1: real auth + profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  full_name text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz default now(),
  last_login_at timestamptz
);

create table public.account_requests (
  id bigserial primary key,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- P1: contact form
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  device text,
  issue text,
  description text not null,
  status text not null default 'pending' check (status in ('pending','priority','resolved')),
  source text not null default 'troubleshooting' check (source in ('contact','troubleshooting')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- P2: troubleshooting CMS + feedback
create table public.devices (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  category text not null check (category in ('input','output')),
  icon_name text,
  display_order int default 0
);

create table public.problems (
  id bigserial primary key,
  device_id bigint not null references public.devices(id) on delete cascade,
  slug text not null,
  title text not null,
  severity text not null check (severity in ('common','moderate','rare')),
  steps jsonb not null, -- array of {step, title, description, image_url?}
  display_order int default 0,
  unique(device_id, slug)
);

create table public.troubleshooting_feedback (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  problem_id bigint references public.problems(id) on delete set null,
  device_slug text,    -- denormalized for analytics if problem deleted
  problem_slug text,
  helpful boolean not null,
  created_at timestamptz default now()
);
```

RLS: all tables enabled; admins (role='admin') get full read/write; students get insert on `support_requests`, `troubleshooting_feedback`, `account_requests`; everyone reads `devices` and `problems`.

## What's NEXT (when Charlie reopens VSCode in this dir)

When the next session starts:

1. **Get Supabase creds from Charlie:**
   - Project URL (`https://<ref>.supabase.co`)
   - Anon key
   - (Optionally) service role key for migrations
   - Charlie can also let me run `supabase login` and `supabase projects create perifix --org-id <id> --region ap-southeast-1` if he wants me to create the project programmatically.

2. **Create `src/app/utils/supabase/client.ts`** that reads `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (replacing the autogenerated `info.tsx` static-strings approach).

3. **Apply schema** via `supabase/migrations/0001_init.sql` + `supabase db push` (or paste into SQL editor).

4. **Migrate AuthContext** from fake-fetch login to `supabase.auth.signInWithPassword` + `onAuthStateChange`. Drop StudentLogin/AdminLogin hardcoded checks. Keep ProtectedRoute.

5. **Wire `LoginSelection` Request Account form** to insert into `account_requests`. Wire **AccountsList** approve action to call a Supabase Edge Function that creates the auth user + sends invite + flips status.

6. **Wire Contact form** + **ContactSupportModal** to insert into `support_requests`. **SupportRequests** page reads same table with realtime subscription.

7. **Seed `devices` + `problems`** from the existing hardcoded tree in Troubleshooting.tsx (write a migration). Then refactor `Troubleshooting.tsx` to fetch from Supabase instead of using its inline data — but DO NOT lose the same UX (expandable tree, severity grouping, search, feedback flow).

8. **Wire feedback** from `TroubleshootingGuideModal` to `troubleshooting_feedback` table.

9. **Migrate AnalyticsDashboard** to read from `troubleshooting_feedback` (or a `feedback_summary` view). Keep the same filters + export.

10. **First Vercel deploy:** `vercel link` + add env vars + `vercel --prod`. Update Supabase Auth redirect URL to `https://perifix.vercel.app`.

## Conventions in this repo

- **Path alias:** `@/foo` → `src/app/foo` (configured in `vite.config.ts` and `tsconfig.json`).
- **No emoji in code** unless explicitly requested.
- **Tailwind v4** browser-style config (no separate `tailwind.config.ts`; `@import "tailwindcss"` in CSS).
- **Component library:** Radix primitives wrapped in shadcn-style components under `src/app/components/ui/`. Don't pull in additional UI libs.
- **Forms:** `react-hook-form` is already installed; not yet used. Prefer it for new forms.
- **Toasts:** `sonner` is mounted at root; use `toast.success/error` from `sonner`.

## Things to NOT do

- Don't blow away the prototype's UX patterns when refactoring — pages are 100–1,000 lines for a reason.
- Don't commit `.env.local` (it's in `.gitignore`).
- Don't push to `apguano/Perifixwebsiteprototype` — that's the upstream prototype, not our repo. Origin is `chaelri/perifix-website`.
- Don't auto-deploy or auto-commit. Charlie reviews everything.
- Don't reintroduce the Figma `figma:asset/` import paths in new code (the legacy ones are handled by the resolver in `vite.config.ts` — leave it for backward compat with imported assets).

## Where I left off

Session 1 (2026-05-06, this commit): baseline cleanup + repo creation. Auth still fake. No Supabase yet. Awaiting Charlie's Supabase creds in session 2.
