import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { UserPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "../utils/firebase/client";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export function Signup() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      await Promise.all([
        updateProfile(cred.user, { displayName: fullName }),
        setDoc(doc(db, "profiles", cred.user.uid), {
          email: cleanEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          role: "student",
          created_at: serverTimestamp(),
          last_login_at: serverTimestamp(),
        }),
      ]);

      toast.success("Account created — you're signed in.");
      navigate("/", { replace: true });
    } catch (err: any) {
      const code = err?.code as string | undefined;
      let msg: string;
      if (code === "auth/email-already-in-use") {
        msg = "An account with this email already exists.";
      } else if (code === "auth/invalid-email") {
        msg = "That email address looks invalid.";
      } else if (code === "auth/weak-password") {
        msg = "Password is too weak. Pick something stronger.";
      } else {
        msg = err?.message ?? "Sign-up failed. Please try again.";
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 py-20">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">Create your account</h1>
          <p className="text-muted-foreground">
            Sign up as a student to access the full troubleshooting guides.
          </p>
        </div>

        <Card className="p-8 shadow-xl border-2 border-blue-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="su_first">First name</Label>
                <Input
                  id="su_first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="su_last">Last name</Label>
                <Input
                  id="su_last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="su_email">Email</Label>
              <Input
                id="su_email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="su_pw">Password</Label>
              <Input
                id="su_pw"
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
              <Label htmlFor="su_confirm">Confirm password</Label>
              <Input
                id="su_confirm"
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
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/student-login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Link to="/login-selection" className="text-blue-600 hover:text-blue-700 hover:underline text-sm">
            ← Back
          </Link>
        </div>
      </div>
    </div>
  );
}
