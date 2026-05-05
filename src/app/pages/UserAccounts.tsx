import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Users, 
  Edit, 
  Save, 
  X, 
  Key, 
  Mail, 
  Search,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UserAccounts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [user, navigate]);

  // Load users from localStorage
  useEffect(() => {
    if (user?.role === "admin") {
      loadUsers();
    }
  }, [user]);

  const loadUsers = () => {
    let storedUsers = JSON.parse(localStorage.getItem("perifix_users") || "[]");
    
    // Add sample data if no users exist (for prototype demonstration)
    if (storedUsers.length === 0) {
      storedUsers = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          role: "student",
          createdAt: new Date("2025-01-15").toISOString()
        },
        {
          id: 2,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          role: "student",
          createdAt: new Date("2025-02-10").toISOString()
        },
        {
          id: 3,
          firstName: "Admin",
          lastName: "User",
          email: "admin@perifix.site",
          role: "admin",
          createdAt: new Date("2025-01-01").toISOString()
        },
        {
          id: 4,
          firstName: "Kevin",
          lastName: "Sabinay",
          email: "kevin@perifix.site",
          role: "admin",
          createdAt: new Date("2025-01-05").toISOString()
        },
        {
          id: 5,
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@example.com",
          role: "student",
          createdAt: new Date("2025-02-20").toISOString()
        },
        {
          id: 6,
          firstName: "Michael",
          lastName: "Brown",
          email: "michael.brown@example.com",
          role: "student",
          createdAt: new Date("2025-02-25").toISOString()
        }
      ];
      localStorage.setItem("perifix_users", JSON.stringify(storedUsers));
    }
    
    setUsers(storedUsers);
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({ firstName: "", lastName: "", email: "" });
  };

  const handleSaveEdit = (userId: number) => {
    const updatedUsers = users.map(u => 
      u.id === userId 
        ? { ...u, ...editForm }
        : u
    );
    
    localStorage.setItem("perifix_users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setEditingUserId(null);
    toast.success("User information updated successfully!");
  };

  const handleGeneratePassword = (user: User) => {
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    setSelectedUserForPassword(user);
    setShowPasswordModal(true);
  };

  const handleSendPassword = () => {
    if (selectedUserForPassword) {
      // In a real app, this would send an email
      toast.success(
        `Temporary password sent to ${selectedUserForPassword.email}`,
        {
          description: `Password: ${generatedPassword}`
        }
      );
      setShowPasswordModal(false);
      setSelectedUserForPassword(null);
      setGeneratedPassword("");
    }
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(query) ||
      u.lastName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="mb-2">User Accounts Management</h1>
              <p className="text-lg text-muted-foreground">
                View and manage all registered user accounts
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search query" : "No registered users yet"}
              </p>
            </Card>
          ) : (
            filteredUsers.map((u) => {
              const isEditing = editingUserId === u.id;

              return (
                <Card key={u.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* User Info */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs text-gray-500">First Name</Label>
                            <Input
                              value={editForm.firstName}
                              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Last Name</Label>
                            <Input
                              value={editForm.lastName}
                              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Email Address</Label>
                            <Input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className="text-xs text-gray-500">First Name</Label>
                            <p className="mt-1">{u.firstName}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Last Name</Label>
                            <p className="mt-1">{u.lastName}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Email Address</Label>
                            <p className="mt-1 text-blue-600">{u.email}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 lg:flex-col lg:w-auto">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-1 lg:flex-none"
                            onClick={() => handleSaveEdit(u.id)}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 lg:flex-none"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 hover:bg-blue-50 flex-1 lg:flex-none"
                            onClick={() => handleEditClick(u)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 flex-1 lg:flex-none"
                            onClick={() => handleGeneratePassword(u)}
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Generate Password
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.role === "admin" 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {u.role === "admin" ? "Admin" : "Student"}
                      </span>
                    </div>
                    <span>Registered: {new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link to="/admin-dashboard">
            <Button variant="outline" className="border-blue-300 hover:bg-blue-50">
              ← Back to Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Password Generation Modal */}
      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-amber-200 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Key className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-4">Temporary Password Generated</h2>
              
              <div className="mb-6 p-4 bg-gray-100 rounded-lg border-2 border-gray-200">
                <Label className="text-xs text-gray-500 block mb-2">User</Label>
                <p className="text-sm mb-3">
                  {selectedUserForPassword.firstName} {selectedUserForPassword.lastName}
                </p>
                <p className="text-sm text-blue-600 mb-4">{selectedUserForPassword.email}</p>
                
                <Label className="text-xs text-gray-500 block mb-2">Generated Password</Label>
                <div className="bg-white p-3 rounded-lg border-2 border-amber-300">
                  <code className="text-lg font-mono text-amber-600 break-all">
                    {generatedPassword}
                  </code>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                This temporary password will be sent to the user's email address. 
                They should change it upon first login.
              </p>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleSendPassword}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Password
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUserForPassword(null);
                    setGeneratedPassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}