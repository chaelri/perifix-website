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

async function loadUserFromSession(session: Session): Promise<AuthUser> {
  // 10s safety net so we never hang the UI if the network stalls.
  const query = supabase
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, role")
    .eq("id", session.user.id)
    .maybeSingle();

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Profile lookup timed out — check your network or RLS policies.")), 10_000),
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const sess = data.session;
      setSession(sess);
      if (sess) {
        try {
          const u = await loadUserFromSession(sess);
          if (mounted) setUser(u);
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
      }
      if (mounted) setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess) {
        try {
          const u = await loadUserFromSession(sess);
          if (mounted) setUser(u);
        } catch (err) {
          console.error("Failed to load profile:", err);
          if (mounted) setUser(null);
        }
      } else {
        setUser(null);
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
