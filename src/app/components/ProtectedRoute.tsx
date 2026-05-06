import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingScreen } from "./LoadingScreen";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, firebaseUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !firebaseUser) {
      navigate("/login-selection", { replace: true });
    }
  }, [firebaseUser, isLoading, navigate]);

  if (user) return <>{children}</>;
  if (isLoading || firebaseUser) return <LoadingScreen />;
  return null;
}
