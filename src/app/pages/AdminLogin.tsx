import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Shield, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { LoadingScreen } from "../components/LoadingScreen";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const u = await signIn(email, password);

      if (u.role !== "admin") {
        await signOut();
        setError("This account does not have admin access.");
        toast.error("Not an admin account");
        return;
      }

      toast.success("Admin login successful");
      navigate("/", { replace: true });
    } catch (err: any) {
      const msg = err?.message ?? "Login failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 py-20">
      {isLoading && <LoadingScreen />}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">Admin Login</h1>
          <p className="text-muted-foreground">
            Access the admin dashboard to manage users and view analytics
          </p>
        </div>

        <Card className="p-8 shadow-xl border-2 border-amber-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@perifix.site"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <Link to="/login-selection" className="block text-blue-600 hover:text-blue-700 hover:underline">
            ← Back to Login Selection
          </Link>
          <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
