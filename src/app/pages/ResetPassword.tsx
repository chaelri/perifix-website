import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Key, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";

export function ResetPassword() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setHasSession(!!data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setHasSession(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateErr) {
      setError(updateErr.message || "Failed to update password.");
      toast.error(updateErr.message || "Failed to update password.");
      return;
    }

    toast.success("Password set successfully! Logging you in…");
    setTimeout(() => navigate("/", { replace: true }), 800);
  };

  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-amber-50">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-amber-50 px-4">
        <Card className="max-w-md w-full p-8 text-center border-2 border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="mb-2">Link Expired or Invalid</h2>
          <p className="text-muted-foreground mb-6">
            This password-reset link has expired or already been used. Ask an admin to send a
            new one, or use the forgot-password flow on the login page.
          </p>
          <Button onClick={() => navigate("/login-selection")} className="bg-blue-600 hover:bg-blue-700">
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 py-20">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">Set Your Password</h1>
          <p className="text-muted-foreground">
            Choose a strong password to secure your account.
          </p>
        </div>

        <Card className="p-8 shadow-xl border-2 border-blue-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Re-enter the password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="mt-2"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Setting password…" : "Set Password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
