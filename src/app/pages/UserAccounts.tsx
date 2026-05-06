import { useState, useEffect, useCallback } from "react";
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
  Copy,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase/client";
import { Link, useNavigate } from "react-router-dom";

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string;
  role: "student" | "admin";
  created_at: string;
}

export function UserAccounts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<ProfileRow | null>(null);
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, full_name, email, role, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message || "Failed to load users.");
      setUsers([]);
      setIsLoading(false);
      return;
    }
    setUsers((data ?? []) as ProfileRow[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Admin privileges required.");
      return;
    }
    if (user?.role === "admin") {
      void loadUsers();
    }
  }, [user, navigate, loadUsers]);

  const handleEditClick = (u: ProfileRow) => {
    setEditingUserId(u.id);
    setEditForm({
      first_name: u.first_name ?? "",
      last_name: u.last_name ?? "",
      email: u.email,
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({ first_name: "", last_name: "", email: "" });
  };

  const handleSaveEdit = async (userId: string) => {
    setIsSaving(true);
    const fullName = `${editForm.first_name} ${editForm.last_name}`.trim();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        full_name: fullName || null,
        email: editForm.email.trim().toLowerCase(),
      })
      .eq("id", userId);
    setIsSaving(false);
    if (error) {
      toast.error(error.message || "Failed to update user.");
      return;
    }
    toast.success("User information updated successfully!");
    setEditingUserId(null);
    await loadUsers();
  };

  const handleGeneratePassword = async (u: ProfileRow) => {
    setResettingId(u.id);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { data, error } = await supabase.functions.invoke("reset-user-password", {
        body: { userId: u.id, redirectTo },
      });
      if (error) {
        toast.error(error.message || "Failed to send recovery email.");
        return;
      }
      if (!data?.ok) {
        toast.error(data?.error || "Failed to send recovery email.");
        return;
      }
      setRecoveryLink(data.actionLink ?? null);
      setSelectedUserForPassword(u);
      setShowPasswordModal(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send recovery email.");
    } finally {
      setResettingId(null);
    }
  };

  const copyRecoveryLink = () => {
    if (recoveryLink) {
      navigator.clipboard.writeText(recoveryLink);
      toast.success("Recovery link copied to clipboard.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (u.first_name ?? "").toLowerCase().includes(q) ||
      (u.last_name ?? "").toLowerCase().includes(q) ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Loading users…</p>
            </Card>
          ) : filteredUsers.length === 0 ? (
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
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {isEditing ? (
                        <>
                          <div>
                            <Label className="text-xs text-gray-500">First Name</Label>
                            <Input
                              value={editForm.first_name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, first_name: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Last Name</Label>
                            <Input
                              value={editForm.last_name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, last_name: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Email Address</Label>
                            <Input
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm({ ...editForm, email: e.target.value })
                              }
                              className="mt-1"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label className="text-xs text-gray-500">First Name</Label>
                            <p className="mt-1">{u.first_name || "—"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Last Name</Label>
                            <p className="mt-1">{u.last_name || "—"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Email Address</Label>
                            <p className="mt-1 text-blue-600">{u.email}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 lg:flex-col lg:w-auto">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-1 lg:flex-none"
                            onClick={() => handleSaveEdit(u.id)}
                            disabled={isSaving}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? "Saving…" : "Save"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 lg:flex-none"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
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
                            disabled={resettingId === u.id}
                          >
                            <Key className="w-4 h-4 mr-2" />
                            {resettingId === u.id ? "Resetting…" : "Generate Password"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          u.role === "admin"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : "Student"}
                      </span>
                    </div>
                    <span>Registered: {new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="mt-8 text-center">
          <Link to="/admin-dashboard">
            <Button variant="outline" className="border-blue-300 hover:bg-blue-50">
              ← Back to Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {showPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-blue-200 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-4">Recovery Email Sent</h2>

              <div className="mb-6 p-4 bg-gray-100 rounded-lg border-2 border-gray-200">
                <Label className="text-xs text-gray-500 block mb-2">User</Label>
                <p className="text-sm mb-3">
                  {selectedUserForPassword.full_name ||
                    [selectedUserForPassword.first_name, selectedUserForPassword.last_name]
                      .filter(Boolean)
                      .join(" ")}
                </p>
                <p className="text-sm text-blue-600">{selectedUserForPassword.email}</p>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                A password-reset link has been emailed to the user. They can click it to set a
                new password and sign in.
              </p>

              {recoveryLink && (
                <div className="mb-6 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg text-left">
                  <Label className="text-xs text-amber-700 block mb-2">
                    Fallback link (copy + share manually if email doesn't arrive)
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-gray-700 break-all flex-1">
                      {recoveryLink}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-amber-100 flex-shrink-0"
                      onClick={copyRecoveryLink}
                    >
                      <Copy className="w-4 h-4 text-amber-700" />
                    </Button>
                  </div>
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUserForPassword(null);
                  setRecoveryLink(null);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
