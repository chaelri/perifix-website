import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login selection if not authenticated
      navigate("/login-selection", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Don't show loading screen, just wait
  if (isLoading) {
    return null;
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}