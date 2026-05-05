import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LogOut, Shield, Users, UserCheck, Calendar, Mail, UserPlus, BarChart3, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  loginTime: string;
}

export function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-f7e00e4c`;

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login-selection");
      return;
    }

    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${serverUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      
      // Use mock data for prototype when server is unavailable
      const mockUsers: UserData[] = [
        {
          id: "1",
          email: "admin@perifix.site",
          name: "Admin User",
          role: "admin",
          loginTime: new Date().toISOString(),
        },
        {
          id: "2",
          email: "student1@example.com",
          name: "John Doe",
          role: "student",
          loginTime: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "3",
          email: "student2@example.com",
          name: "Jane Smith",
          role: "student",
          loginTime: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "4",
          email: "student3@example.com",
          name: "Bob Johnson",
          role: "student",
          loginTime: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      
      setUsers(mockUsers);
      console.log("Using mock user data for prototype");
    } finally {
      setIsLoading(false);
    }
  };

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
              className="border-red-300 text-red-600 hover:bg-red-50"
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
                      Login Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-blue-50 transition-colors">
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
                          {formatDate(userData.loginTime)}
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