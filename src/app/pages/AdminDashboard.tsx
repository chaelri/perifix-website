import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LogOut, Shield, Users, UserCheck, Calendar, Mail, UserPlus, BarChart3, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase/client";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin";
  last_login_at: string | null;
  created_at: string;
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, first_name, last_name, role, last_login_at, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message || "Failed to load users.");
      setUsers([]);
      setIsLoading(false);
      return;
    }
    const mapped: UserData[] = (data ?? []).map((p: any) => ({
      id: p.id,
      email: p.email,
      name:
        p.full_name ||
        [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
        p.email,
      role: p.role,
      last_login_at: p.last_login_at,
      created_at: p.created_at,
    }));
    setUsers(mapped);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login-selection");
      return;
    }
    void fetchUsers();
  }, [user, navigate, fetchUsers]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) return null;

  const studentUsers = users.filter((u) => u.role === "student");
  const adminUsers = users.filter((u) => u.role === "admin");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Admin Panel</h3>
                <p className="text-xs text-gray-500">{user.name}</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-8 shadow-xl border-0 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white mb-2">Admin Dashboard</h1>
              <p className="text-amber-100">
                Manage users and monitor system activity
              </p>
            </div>
            <Shield className="w-12 h-12 text-amber-200" />
          </div>
        </Card>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-3xl mb-1">{users.length}</h3>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </Card>

          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-3xl mb-1">{studentUsers.length}</h3>
            <p className="text-sm text-muted-foreground">Student Users</p>
          </Card>

          <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow border-2 border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
            </div>
            <h3 className="text-3xl mb-1">{adminUsers.length}</h3>
            <p className="text-sm text-muted-foreground">Admin Users</p>
          </Card>
        </div>

        {/* Account Requests Button */}
        <Card className="p-6 shadow-lg hover:shadow-xl transition-all border-2 border-green-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="mb-1">Account Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Review and manage pending account requests
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/accounts-list")}
              className="bg-green-600 hover:bg-green-700 text-white hover:text-black"
            >
              View Requests
            </Button>
          </div>
        </Card>

        {/* User Accounts Management Button */}
        <Card className="p-6 shadow-lg hover:shadow-xl transition-all border-2 border-blue-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="mb-1">User Accounts Management</h3>
                <p className="text-sm text-muted-foreground">
                  Edit user information and manage passwords
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/user-accounts")}
              className="bg-blue-600 hover:bg-blue-700 text-white hover:text-black"
            >
              Manage Users
            </Button>
          </div>
        </Card>

        {/* Analytics Dashboard Button */}
        <Card className="p-6 shadow-lg hover:shadow-xl transition-all border-2 border-purple-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="mb-1">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  View troubleshooting success rates and user feedback
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/analytics")}
              className="bg-purple-600 hover:bg-purple-700 text-white hover:text-black"
            >
              View Analytics
            </Button>
          </div>
        </Card>

        {/* Support Requests Button */}
        <Card className="p-6 shadow-lg hover:shadow-xl transition-all border-2 border-orange-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600/10 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="mb-1">Support Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Manage and respond to user support tickets
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/support-requests")}
              className="bg-orange-600 hover:bg-orange-700 text-white hover:text-black"
            >
              View Requests
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="shadow-xl border-2 border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-amber-50">
            <h2 className="mb-1">User Management</h2>
            <p className="text-sm text-muted-foreground">
              View and manage all registered users
            </p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-blue-100 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 ${userData.role === "admin" ? "bg-amber-500" : "bg-blue-600"} rounded-lg flex items-center justify-center mr-3`}>
                            {userData.role === "admin" ? (
                              <Shield className="w-4 h-4 text-white" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {userData.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {userData.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userData.role === "admin"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {userData.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {userData.last_login_at
                            ? formatDate(userData.last_login_at)
                            : "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}