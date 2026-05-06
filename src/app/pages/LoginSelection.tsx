import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { User, Shield, UserPlus, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";

export function LoginSelection() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [showAccountForm, setShowAccountForm] = useState(false);

  const handleRequestAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("account_requests").insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("An account with this email has already been requested.");
        } else {
          toast.error(error.message || "Failed to submit request. Please try again.");
        }
        return;
      }

      setSubmittedEmail(email);
      setShowConfirmation(true);
      setFirstName("");
      setLastName("");
      setEmail("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1 bg-blue-600/10 text-blue-600 rounded-full mb-4">
            Welcome to PERIFIX
          </div>
          <h1 className="mb-4">Choose Your Login Type</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select your account type to access the troubleshooting guides
          </p>
        </div>

        {/* Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
          {/* Student Login Card */}
          <Card className="p-8 hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-blue-200 hover:border-blue-400">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="mb-3">Student Login</h2>
              <p className="text-muted-foreground mb-6">
                Access full troubleshooting guides and step-by-step solutions for all devices.
              </p>
              <Link to="/student-login">
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Login as Student
                </Button>
              </Link>
            </div>
          </Card>

          {/* Admin Login Card */}
          <Card className="p-8 hover:shadow-xl transition-all hover:-translate-y-1 border-2 border-amber-200 hover:border-amber-400">
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="mb-3">Admin Login</h2>
              <p className="text-muted-foreground mb-6">
                Access admin dashboard to manage users and view analytics.
              </p>
              <Link to="/admin-login">
                <Button size="lg" className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                  Login as Admin
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Request Account Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 shadow-xl border-2 border-green-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-2">Request an Account</h2>
              <p className="text-muted-foreground">
                Don't have an account yet? Submit a request and we'll get back to you.
              </p>
            </div>

            {!showAccountForm ? (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                onClick={() => setShowAccountForm(true)}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create an Account
              </Button>
            ) : (
              <form onSubmit={handleRequestAccount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="requestEmail">Email Address</Label>
                  <Input
                    id="requestEmail"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setShowAccountForm(false);
                      setFirstName("");
                      setLastName("");
                      setEmail("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-green-200 max-w-md w-full animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="mb-4">Request Submitted Successfully!</h2>
                <p className="text-lg text-muted-foreground mb-2">
                  Request to create
                </p>
                <p className="text-xl font-semibold text-green-600 mb-6">
                  {submittedEmail}
                </p>
                <p className="text-muted-foreground mb-8">
                  has been submitted.
                </p>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  size="lg"
                  onClick={() => setShowConfirmation(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link to="/" className="text-blue-600 hover:text-blue-700 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}