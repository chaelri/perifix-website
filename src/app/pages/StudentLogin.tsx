import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { User, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner@2.0.3";
import { LoadingScreen } from "../components/LoadingScreen";

export function StudentLogin() {
  const [name, setName] = useState("");
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
      // For prototype purposes: accept any credentials for student login
      // Create a mock user session without calling the backend
      const mockUser = {
        id: `student-${Date.now()}`,
        email: email,
        name: name,
        role: "student" as const,
        loginTime: new Date().toISOString(),
      };
      
      const mockToken = `mock-token-${Date.now()}`;
      
      // Store in localStorage directly
      localStorage.setItem("perifix_token", mockToken);
      localStorage.setItem("perifix_user", JSON.stringify(mockUser));
      
      // Force a page reload to trigger auth context to pick up the stored values
      toast.success("Login successful!");
      
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
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">Student Login</h1>
          <p className="text-muted-foreground">
            Enter your credentials to access the troubleshooting guides
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-xl border-2 border-blue-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
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
              <p className="text-xs text-muted-foreground mt-2">
                For prototype: any password works
              </p>
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
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
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