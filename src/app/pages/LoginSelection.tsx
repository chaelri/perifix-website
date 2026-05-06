import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { User, Shield, Mail } from "lucide-react";

export function LoginSelection() {
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

        {/* Need an account */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 shadow-sm border border-gray-200 bg-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1">Need an account?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Accounts are issued by your administrator. Contact them with your name and
                  email and they'll create one for you.
                </p>
                <Link to="/contact">
                  <Button variant="outline" size="sm">
                    Contact admin
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-blue-600 hover:text-blue-700 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
