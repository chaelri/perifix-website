# Perifix Website

Real, functional Perifix site — evolved from the original Figma Make prototype into a production app with Supabase backend and Vercel hosting.

- **Repo:** https://github.com/chaelri/perifix-website
- **Origin:** forked from the [Figma Make prototype](https://github.com/apguano/Perifixwebsiteprototype) (kept history; replaced fake-prototype auth with real Supabase Auth and real DB-backed features).
- **Live:** https://perifix.site (Vercel-hosted; alias https://perifix.vercel.app)
- **Backend:** Supabase (Auth + Postgres + Edge Functions), region `ap-southeast-1`.
- **Frontend:** Vite + React 18 + TypeScript + Tailwind v4 + Radix UI / shadcn pattern + react-router-dom 7.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill with your Supabase URL + anon key
npm run dev                  # http://localhost:5173
```

## Project structure

```
src/
├── main.tsx              ← entry, mounts <App />
├── styles/               ← global CSS (Tailwind v4 + theme tokens)
└── app/
    ├── App.tsx           ← Router + AuthProvider + Routes
    ├── pages/            ← 14 pages (Home, About, Contact, FAQs, Troubleshooting, Login*, *Dashboard, AccountsList, UserAccounts, Analytics, SupportRequests)
    ├── components/       ← Navbar, Footer, ProtectedRoute, modals, search bars, shadcn ui/
    ├── contexts/         ← AuthContext (Supabase Auth)
    ├── utils/supabase/   ← client + helpers
    └── supabase/         ← edge function source (legacy — being phased out in favor of Postgres + RLS)
```

## Status

Day 1 (2026-05-06): baseline ported from prototype, fake-auth still wired but stub Supabase project replaced with new chaelri-owned project. See `CLAUDE.md` for in-flight migration plan.

## Conventions

- No auto-push: Charlie controls `git push`.
- Real Supabase Auth (no hardcoded passwords). `admin@perifix.site / admin123` and `student123` codes from the prototype have been removed.
- Phased rollout: P1 = auth + users + Contact form; P2 = Support Requests + Troubleshooting; P3 = Analytics.
