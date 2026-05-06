import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LogOut, User, Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Troubleshooting } from "./Troubleshooting";
import { SearchBar } from "../components/SearchBar";

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user || user.role !== "student") {
      navigate("/login-selection");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Welcome, {user.name}</h3>
                <p className="text-xs text-gray-500">Student Access</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 shadow-xl border-0 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white mb-2">Troubleshooting Dashboard</h1>
              <p className="text-blue-100">
                Access all troubleshooting guides and step-by-step solutions
              </p>
            </div>
            <Search className="w-12 h-12 text-blue-200" />
          </div>
        </Card>

        {/* Search Bar */}
        <SearchBar onSearchChange={setSearchQuery} placeholder="Search devices or troubleshooting issues..." />

        {/* Full Troubleshooting Content */}
        <Troubleshooting searchQuery={searchQuery} />
      </div>
    </div>
  );
}