import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin";
  loginTime: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role: "student" | "admin", name?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-f7e00e4c`;

  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem("perifix_token");
        const storedUser = localStorage.getItem("perifix_user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear invalid stored data
        localStorage.removeItem("perifix_token");
        localStorage.removeItem("perifix_user");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, role: "student" | "admin", name?: string) => {
    try {
      const response = await fetch(`${serverUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, role, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem("perifix_token", data.token);
      localStorage.setItem("perifix_user", JSON.stringify(data.user));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${serverUrl}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("perifix_token");
      localStorage.removeItem("perifix_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}