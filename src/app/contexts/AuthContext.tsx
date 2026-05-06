import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin";
  loginTime: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CACHE_KEY = "perifix-user-cache";

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(u: AuthUser | null) {
  try {
    if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // localStorage unavailable (private mode, quota) — non-fatal.
  }
}

async function loadUserFromSession(session: Session): Promise<AuthUser> {
  // 10s safety net so we never hang the UI if the network stalls.
  const query = supabase
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, role")
    .eq("id", session.user.id)
    .maybeSingle();

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Profile lookup timed out — check your network or RLS policies.")), 30_000),
  );

  const { data, error } = await Promise.race([query, timeout]) as Awaited<typeof query>;
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Your account exists but no profile was found. Please contact an admin.",
    );
  }
  return {
    id: data.id,
    email: data.email ?? session.user.email ?? "",
    name:
      data.full_name ||
      [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
      session.user.email ||
      "",
    role: data.role as "student" | "admin",
    loginTime: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Hydrate from cache synchronously so refresh feels seamless and
  // ProtectedRoute doesn't bounce the user to /login-selection while we wait
  // for the profile fetch.
  const [user, setUser] = useState<AuthUser | null>(() => readCachedUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const sess = data.session;
      setSession(sess);

      if (!sess) {
        // No session — clear any stale cache and stop loading.
        setUser(null);
        writeCachedUser(null);
        setIsLoading(false);
        return;
      }

      // Flip isLoading off immediately so ProtectedRoute can render with the
      // cached user. The profile refresh happens in the background — if it
      // succeeds, we update state + cache; if it fails, the cached user
      // stays and the session is still valid.
      setIsLoading(false);
      loadUserFromSession(sess)
        .then((u) => {
          if (!mounted) return;
          setUser(u);
          writeCachedUser(u);
        })
        .catch((err) => {
          console.error("[auth] Background profile load failed (keeping cached user):", err);
        });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if (!mounted) return;
      setSession(sess);

      // Real sign-out: drop the user and clear the cache.
      if (event === "SIGNED_OUT" || !sess) {
        setUser(null);
        writeCachedUser(null);
        return;
      }

      // Token refresh / tab refocus: session is still valid and we already
      // have the user loaded — don't re-fetch the profile, since a transient
      // failure here would otherwise log the user out of the app.
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        return;
      }

      // Initial session restore or fresh sign-in: hydrate the profile.
      try {
        const u = await loadUserFromSession(sess);
        if (mounted) setUser(u);
        writeCachedUser(u);
      } catch (err) {
        console.error("[auth] Failed to load profile (keeping existing session):", err);
        // Intentionally NOT clearing user — the session is valid; this is
        // likely a transient profile-fetch error.
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    console.debug("[auth] signIn: calling signInWithPassword");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.debug("[auth] signIn: signInWithPassword error", error);
      throw error;
    }
    if (!data.session) throw new Error("No session returned from sign-in");

    console.debug("[auth] signIn: loading profile for", data.session.user.id);
    const u = await loadUserFromSession(data.session);
    console.debug("[auth] signIn: profile loaded", { role: u.role });

    setSession(data.session);
    setUser(u);
    writeCachedUser(u);

    supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", u.id)
      .then(({ error: updErr }) => {
        if (updErr) console.warn("[auth] last_login_at update failed:", updErr.message);
      });

    return u;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    writeCachedUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token: session?.access_token ?? null,
        signIn,
        signOut,
        logout: signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
