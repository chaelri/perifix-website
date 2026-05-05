import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Shield, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { LoadingScreen } from "../components/LoadingScreen";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Check for specific admin credentials
      const validAdmins = [
        { email: "admin@perifix.site", password: "perifix123", name: "Admin User" },
        { email: "kevin@perifix.site", password: "kevinpogi", name: "Kevin Sabinay" }
      ];

      const adminAccount = validAdmins.find(
        admin => admin.email === email && admin.password === password
      );

      if (!adminAccount) {
        setError("Wrong credentials. Please check your email and password.");
        setIsLoading(false);
        return;
      }

      // Create admin user session
      const mockUser = {
        id: `admin-${Date.now()}`,
        email: email,
        name: adminAccount.name,
        role: "admin" as const,
        loginTime: new Date().toISOString(),
      };
      
      const mockToken = `mock-token-${Date.now()}`;
      
      // Store in localStorage directly
      localStorage.setItem("perifix_token", mockToken);
      localStorage.setItem("perifix_user", JSON.stringify(mockUser));
      
      // Force a page reload to trigger auth context to pick up the stored values
      toast.success("Admin login successful!");
      
      // Small delay to show the toast, then redirect to Home page
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
      toast.error("Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 py-20">
      {isLoading && <LoadingScreen />}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">Admin Login</h1>
          <p className="text-muted-foreground">
            Access the admin dashboard to manage users and view analytics
          </p>
        </div>

        {/* Credentials Info Card */}
        <Card className="p-4 mb-4 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Demo Admin Credentials</p>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Email:</strong> admin@perifix.site</p>
                <p><strong>Password:</strong> perifix123</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Login Card */}
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
                placeholder="perifix123"
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
              Log in
            </Button>
          </form>
        </Card>

        {/* Back Links */}
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