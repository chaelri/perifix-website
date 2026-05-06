// Backwards-compat shim for prototype code that imports projectId / publicAnonKey.
// New code should import { supabase } from "./client" instead.
// This file will be deleted once AuthContext and AdminDashboard are migrated.

const url = import.meta.env.VITE_SUPABASE_URL ?? "";

export const projectId = url.replace(/^https:\/\//, "").replace(/\.supabase\.co$/, "");
export const publicAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "";
