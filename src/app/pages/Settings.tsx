import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { User, Save, ArrowLeft, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FetchingBadge } from "../components/skeletons/Skeletons";

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  role: "student" | "admin";
}

async function fetchOwnProfile(userId: string): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, full_name, role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login-selection");
  }, [user, navigate]);

  const { data: profile, isPending, isFetching } = useQuery({
    queryKey: ["own-profile", user?.id],
    queryFn: () => fetchOwnProfile(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: trimmedFirst || null,
        last_name: trimmedLast || null,
        full_name: fullName || null,
      })
      .eq("id", user.id);
    setIsSaving(false);
    if (error) {
      toast.error(error.message || "Failed to save profile.");
      return;
    }
    toast.success("Profile updated.");
    queryClient.invalidateQueries({ queryKey: ["own-profile", user.id] });
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-counts"] });
  };

  if (!user) return null;

  const dirty =
    (firstName.trim() !== (profile?.first_name ?? "")) ||
    (lastName.trim() !== (profile?.last_name ?? ""));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="mb-1">Account Settings</h1>
            <p className="text-muted-foreground">Manage your profile information</p>
          </div>
          <div className="ml-auto">
            <FetchingBadge isFetching={isFetching} isPending={isPending} />
          </div>
        </div>

        <Card className="p-6 shadow-sm border border-gray-200 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2"
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              Email
            </Label>
            <Input
              value={profile?.email ?? ""}
              readOnly
              className="mt-2 bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email is read-only. Contact an admin to change it.
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Role
            </Label>
            <div className="mt-2">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                  profile?.role === "admin"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {profile?.role === "admin" ? "Admin" : "Student"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFirstName(profile?.first_name ?? "");
                setLastName(profile?.last_name ?? "");
              }}
              disabled={!dirty || isSaving}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!dirty || isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
