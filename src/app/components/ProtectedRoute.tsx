import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingScreen } from "./LoadingScreen";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect once auth has settled and we're sure there's no session.
    if (!isLoading && !session) {
      navigate("/login-selection", { replace: true });
    }
  }, [session, isLoading, navigate]);

  // Have a user (cached or freshly fetched) — render the protected content.
  // The profile refresh continues in the background and will update fields
  // like role/name without blocking the UI.
  if (user) return <>{children}</>;

  // No user yet but auth is still settling, or we have a session and the
  // profile is loading — show the proper loading screen so the user knows
  // we're working, instead of a blank page.
  if (isLoading || session) return <LoadingScreen />;

  // No user, no session — about to redirect via the effect.
  return null;
}
