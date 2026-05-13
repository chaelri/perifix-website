import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  User,
  Save,
  ArrowLeft,
  Mail,
  Shield,
  MessageSquare,
  Eye,
  Clock,
  CheckCircle,
  Flag,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../utils/firebase/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FetchingBadge } from "../components/skeletons/Skeletons";
import { Skeleton } from "../components/ui/skeleton";

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  role: "student" | "admin";
}

type Status = "pending" | "priority" | "resolved" | "waiting_for_response";

interface ThreadMessage {
  id: string;
  text: string;
  at: string;
  by_uid: string;
  by_role: "admin" | "student";
}

interface SupportRow {
  id: string;
  name: string;
  email: string;
  device: string | null;
  issue: string | null;
  description: string;
  status: Status;
  user_id: string | null;
  created_at: string;
  messages: ThreadMessage[];
  last_activity_at: string;
}

const STATUS_META: Record<
  Status,
  { color: string; icon: typeof Clock; label: string }
> = {
  pending: {
    color: "bg-orange-100 text-orange-700 border-orange-300",
    icon: Clock,
    label: "Pending",
  },
  priority: {
    color: "bg-red-100 text-red-700 border-red-300",
    icon: Flag,
    label: "Priority",
  },
  resolved: {
    color: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle,
    label: "Resolved",
  },
  waiting_for_response: {
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: AlertCircle,
    label: "Waiting",
  },
};

function tsToIso(v: unknown): string {
  if (!v) return "";
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "toDate" in (v as Record<string, unknown>)) {
    try {
      return ((v as { toDate: () => Date }).toDate()).toISOString();
    } catch {
      return "";
    }
  }
  return "";
}

function normaliseRow(id: string, data: Record<string, unknown>): SupportRow {
  const created_at = tsToIso(data.created_at);
  const messages = ((data.messages as ThreadMessage[] | undefined) ?? []).map(
    (m) => ({ ...m, at: typeof m.at === "string" ? m.at : tsToIso(m.at) }),
  );
  const latestMsgAt = messages.reduce(
    (max, m) => (m.at && m.at > max ? m.at : max),
    "",
  );
  return {
    id,
    name: (data.name as string) ?? "",
    email: (data.email as string) ?? "",
    device: (data.device as string | null) ?? null,
    issue: (data.issue as string | null) ?? null,
    description: (data.description as string) ?? "",
    status: ((data.status as Status) ?? "pending") as Status,
    user_id: (data.user_id as string | null) ?? null,
    created_at,
    messages,
    last_activity_at: latestMsgAt || created_at,
  };
}

async function fetchMyOwnRequests(uid: string): Promise<SupportRow[]> {
  const q = query(
    collection(db, "support_requests"),
    where("user_id", "==", uid),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => normaliseRow(d.id, d.data()))
    .sort((a, b) => (a.last_activity_at > b.last_activity_at ? -1 : 1));
}

async function fetchAllRequests(): Promise<SupportRow[]> {
  const q = query(
    collection(db, "support_requests"),
    orderBy("created_at", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => normaliseRow(d.id, d.data()))
    .sort((a, b) => (a.last_activity_at > b.last_activity_at ? -1 : 1));
}

async function fetchOwnProfile(userId: string): Promise<ProfileRow> {
  const snap = await getDoc(doc(db, "profiles", userId));
  if (!snap.exists()) throw new Error("Profile not found.");
  const data = snap.data();
  return {
    id: userId,
    email: data.email ?? "",
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    full_name: data.full_name ?? null,
    role: data.role as "student" | "admin",
  };
}

function formatShort(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketRow({
  row,
  onOpen,
}: {
  row: SupportRow;
  onOpen: () => void;
}) {
  const meta = STATUS_META[row.status];
  const StatusIcon = meta.icon;
  const lastMessage = row.messages.length
    ? row.messages[row.messages.length - 1]
    : null;
  const preview = (lastMessage?.text ?? row.description ?? "").trim();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left p-3 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 truncate">
              {row.issue || "(no subject)"}
            </span>
            {row.device && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase bg-gray-100 text-gray-600">
                {row.device}
              </span>
            )}
          </div>
          {preview && (
            <p className="text-xs text-gray-500 line-clamp-1">{preview}</p>
          )}
          <p className="text-[11px] text-gray-400 mt-1">
            {formatShort(row.last_activity_at)}
          </p>
        </div>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] border inline-flex items-center gap-1 ${meta.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {meta.label}
        </span>
      </div>
    </button>
  );
}

function InlineTicketList({
  title,
  description,
  icon: Icon,
  rows,
  isPending,
  emptyText,
  onPick,
  viewAllHref,
  onViewAll,
}: {
  title: string;
  description: string;
  icon: typeof MessageSquare;
  rows: SupportRow[];
  isPending: boolean;
  emptyText: string;
  onPick: (row: SupportRow) => void;
  viewAllHref?: string;
  onViewAll?: () => void;
}) {
  const visible = rows.slice(0, 5);
  return (
    <Card className="p-5 border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{title}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {(viewAllHref || onViewAll) && rows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-blue-600 hover:bg-blue-100"
          >
            View all
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => (
            <TicketRow key={r.id} row={r} onOpen={() => onPick(r)} />
          ))}
          {rows.length > 5 && (
            <p className="text-xs text-gray-500 text-center pt-1">
              Showing 5 of {rows.length}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user) navigate("/login-selection");
  }, [user, navigate]);

  const { data: profile, isPending, isFetching } = useQuery({
    queryKey: ["own-profile", user?.id],
    queryFn: () => fetchOwnProfile(user!.id),
    enabled: !!user,
  });

  // Own support requests — shared cache key with MySupportRequests page.
  const { data: myRequests = [], isPending: myPending } = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: () => fetchMyOwnRequests(user!.id),
    enabled: !!user,
  });

  // All requests — admin-only. Shared key with SupportRequests page.
  const { data: allRequests = [], isPending: allPending } = useQuery({
    queryKey: ["support_requests"],
    queryFn: fetchAllRequests,
    enabled: !!user && isAdmin,
  });

  // Live updates: any change to my own tickets refreshes both lists.
  useEffect(() => {
    if (!user) return;
    const qOwn = query(
      collection(db, "support_requests"),
      where("user_id", "==", user.id),
    );
    const unsub = onSnapshot(qOwn, () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets", user.id] });
    });
    return () => unsub();
  }, [user, queryClient]);

  // Admins additionally watch all requests so Watching stays fresh when
  // someone replies on a ticket they're involved in.
  useEffect(() => {
    if (!user || !isAdmin) return;
    const qAll = query(
      collection(db, "support_requests"),
      orderBy("created_at", "desc"),
    );
    const unsub = onSnapshot(qAll, () => {
      queryClient.invalidateQueries({ queryKey: ["support_requests"] });
    });
    return () => unsub();
  }, [user, isAdmin, queryClient]);

  const watching = useMemo<SupportRow[]>(() => {
    if (!isAdmin || !user) return [];
    return allRequests.filter(
      (r) =>
        r.user_id !== user.id &&
        r.messages.some((m) => m.by_uid === user.id),
    );
  }, [allRequests, isAdmin, user]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setEmail(profile.email ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();
    const emailChanged = isAdmin && trimmedEmail && trimmedEmail !== profile?.email;
    try {
      // Email change has to go through the admin SDK (Vercel route).
      if (emailChanged) {
        const idToken = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/admin/update-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken ?? ""}`,
          },
          body: JSON.stringify({ userId: user.id, newEmail: trimmedEmail }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Failed to update email.");
        }
      }
      await updateDoc(doc(db, "profiles", user.id), {
        first_name: trimmedFirst || null,
        last_name: trimmedLast || null,
        full_name: fullName || null,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      setIsSaving(false);
      toast.error((err as Error).message || "Failed to save profile.");
      return;
    }
    setIsSaving(false);
    toast.success(emailChanged ? "Profile and email updated." : "Profile updated.");
    queryClient.invalidateQueries({ queryKey: ["own-profile", user.id] });
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
    queryClient.invalidateQueries({ queryKey: ["admin-user-counts"] });
  };

  if (!user) return null;

  const dirty =
    firstName.trim() !== (profile?.first_name ?? "") ||
    lastName.trim() !== (profile?.last_name ?? "") ||
    (isAdmin && email.trim().toLowerCase() !== (profile?.email ?? ""));

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

        {isPending ? (
          <Card className="p-6 shadow-sm border border-gray-200 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-72" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
          </Card>
        ) : (
          <Card className="p-6 shadow-sm border border-gray-200 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-2"
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
        )}

        <div className="mt-4 space-y-4">
          <InlineTicketList
            title="My Support Requests"
            description="Tickets you've submitted. Click one to open the conversation."
            icon={MessageSquare}
            rows={myRequests}
            isPending={myPending}
            emptyText="You haven't submitted any tickets yet."
            onPick={() => navigate("/my-tickets")}
            onViewAll={() => navigate("/my-tickets")}
          />

          {isAdmin && (
            <InlineTicketList
              title="Watching"
              description="Support requests you've replied to as admin."
              icon={Eye}
              rows={watching}
              isPending={allPending}
              emptyText="You haven't replied to any support requests yet."
              onPick={(r) => navigate(`/support-requests?open=${r.id}`)}
              onViewAll={() => navigate("/support-requests")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
