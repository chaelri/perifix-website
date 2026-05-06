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
  Copy,
  CheckCircle,
  UserPlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../utils/firebase/client";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListSkeleton, FetchingBadge } from "../components/skeletons/Skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string;
  role: "student" | "admin";
  created_at: string;
}

async function fetchProfiles(): Promise<ProfileRow[]> {
  const q = query(collection(db, "profiles"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const created =
      data.created_at instanceof Timestamp
        ? data.created_at.toDate().toISOString()
        : data.created_at ?? "";
    return {
      id: d.id,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      full_name: data.full_name ?? null,
      email: data.email ?? "",
      role: (data.role as "student" | "admin") ?? "student",
      created_at: created,
    };
  });
}

interface CreateForm {
  first_name: string;
  last_name: string;
  email: string;
  role: "student" | "admin";
}

export function UserAccounts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    first_name: "",
    last_name: "",
    email: "",
    role: "student",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdUserCreds, setCreatedUserCreds] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [userToDelete, setUserToDelete] = useState<ProfileRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: users = [], isPending, isFetching } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [user, navigate]);

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
    try {
      await updateDoc(doc(db, "profiles", userId), {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        full_name: fullName || null,
        // email is locked here — change it via Firebase Auth admin if needed.
      });
      toast.success("User information updated successfully!");
      setEditingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    } catch (err) {
      toast.error((err as Error).message || "Failed to update user.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePassword = async (u: ProfileRow) => {
    setResettingId(u.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken ?? ""}`,
        },
        body: JSON.stringify({ userId: u.id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
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

  const handleCreateUser = async () => {
    if (!createForm.email.trim() || !createForm.first_name.trim()) {
      toast.error("Email and first name are required.");
      return;
    }
    setIsCreating(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken ?? ""}`,
        },
        body: JSON.stringify({
          email: createForm.email.trim().toLowerCase(),
          first_name: createForm.first_name.trim(),
          last_name: createForm.last_name.trim(),
          role: createForm.role,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "Failed to create user.");
        return;
      }
      setCreatedUserCreds({ email: data.email, password: data.password });
      setShowCreateModal(false);
      setCreateForm({ first_name: "", last_name: "", email: "", role: "student" });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-counts"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const copyRecoveryLink = () => {
    if (recoveryLink) {
      navigator.clipboard.writeText(recoveryLink);
      toast.success("Recovery link copied to clipboard.");
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken ?? ""}`,
        },
        body: JSON.stringify({ userId: userToDelete.id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "Failed to delete user.");
        return;
      }
      toast.success("User deleted.");
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-counts"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete user.");
    } finally {
      setIsDeleting(false);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative max-w-md flex-1 min-w-[260px]">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-white border-2 border-blue-200 shadow-sm rounded-xl focus-visible:border-blue-500 focus-visible:ring-blue-200 placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <FetchingBadge isFetching={isFetching} isPending={isPending} />
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New User
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {isPending ? (
            <ListSkeleton count={4} />
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
                            className="border-blue-300 hover:bg-blue-100 flex-1 lg:flex-none"
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 flex-1 lg:flex-none"
                            onClick={() => setUserToDelete(u)}
                            disabled={u.id === user?.id}
                            title={u.id === user?.id ? "You can't delete your own account" : "Delete user"}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
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
            <Button variant="outline" className="border-blue-300 hover:bg-blue-100">
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
                new password and sign in. If they don't receive it, copy the link below and
                send it to them directly.
              </p>

              {recoveryLink && (
                <div className="mb-6">
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={copyRecoveryLink}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy reset link
                  </Button>
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-blue-200 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-1">Create New User</h2>
              <p className="text-sm text-muted-foreground">
                A temporary password will be generated. Share it with the user privately.
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cf_first">First name</Label>
                  <Input
                    id="cf_first"
                    value={createForm.first_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, first_name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cf_last">Last name</Label>
                  <Input
                    id="cf_last"
                    value={createForm.last_name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, last_name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cf_email">Email</Label>
                <Input
                  id="cf_email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cf_role">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) =>
                    setCreateForm({
                      ...createForm,
                      role: value as "student" | "admin",
                    })
                  }
                >
                  <SelectTrigger id="cf_role" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleCreateUser}
                disabled={isCreating}
              >
                {isCreating ? "Creating…" : "Create User"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {createdUserCreds && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-green-200 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-1">User Created</h2>
              <p className="text-sm text-muted-foreground">
                Share these credentials with the user. The temporary password is shown
                here only once.
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <Label className="text-xs text-blue-700">Email</Label>
                <p className="font-mono text-sm text-blue-900 mt-1 break-all">
                  {createdUserCreds.email}
                </p>
              </div>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <Label className="text-xs text-amber-700">Temporary password</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="font-mono text-sm text-amber-900 flex-1 break-all">
                    {createdUserCreds.password}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-amber-100"
                    onClick={() => {
                      navigator.clipboard.writeText(createdUserCreds.password);
                      toast.success("Password copied.");
                    }}
                  >
                    <Copy className="w-4 h-4 text-amber-700" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setCreatedUserCreds(null)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-red-200 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h2 className="mb-1">Delete this user?</h2>
              <p className="text-sm text-muted-foreground">
                Their account and all profile information will be permanently
                removed. This can't be undone.
              </p>
            </div>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6">
              <p className="font-medium text-gray-900">
                {userToDelete.full_name ||
                  [userToDelete.first_name, userToDelete.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                  "(no name)"}
              </p>
              <p className="text-sm text-gray-500 break-all">{userToDelete.email}</p>
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                  userToDelete.role === "admin"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {userToDelete.role}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting…" : "Delete user"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
