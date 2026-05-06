import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../utils/firebase/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin";
  loginTime: string;
}

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
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
    // localStorage unavailable — non-fatal.
  }
}

interface ProfileDoc {
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  role?: "student" | "admin";
}

async function loadProfile(fbUser: FirebaseUser): Promise<AuthUser> {
  const snap = await getDoc(doc(db, "profiles", fbUser.uid));
  if (!snap.exists()) {
    throw new Error(
      "Your account exists but no profile was found. Please contact an admin.",
    );
  }
  const data = snap.data() as ProfileDoc;
  return {
    id: fbUser.uid,
    email: data.email ?? fbUser.email ?? "",
    name:
      data.full_name ||
      [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
      fbUser.email ||
      "",
    role: (data.role as "student" | "admin") ?? "student",
    loginTime: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  // Hydrate from cache synchronously so refresh feels seamless and ProtectedRoute
  // doesn't bounce the user to /login-selection while we wait for the profile fetch.
  const [user, setUser] = useState<AuthUser | null>(() => readCachedUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;
      setFirebaseUser(fbUser);

      if (!fbUser) {
        setUser(null);
        writeCachedUser(null);
        setIsLoading(false);
        return;
      }

      // Flip isLoading off immediately so ProtectedRoute can render with the
      // cached user. The profile refresh happens in the background.
      setIsLoading(false);
      try {
        const u = await loadProfile(fbUser);
        if (!mounted) return;
        setUser(u);
        writeCachedUser(u);
      } catch (err) {
        console.error("[auth] profile load failed (keeping cached user):", err);
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const u = await loadProfile(cred.user);
    setFirebaseUser(cred.user);
    setUser(u);
    writeCachedUser(u);

    // Fire-and-forget last_login update.
    void updateDoc(doc(db, "profiles", u.id), {
      last_login_at: serverTimestamp(),
    }).catch((err) => {
      console.warn("[auth] last_login update failed:", err);
    });

    return u;
  };

  const signOut = async () => {
    setFirebaseUser(null);
    setUser(null);
    writeCachedUser(null);
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn("[auth] signOut failed (already logged out locally):", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
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
