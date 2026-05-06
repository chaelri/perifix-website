import { useState, useEffect, useMemo } from "react";
import { Card } from "../components/ui/card";
import {
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search as SearchIcon,
  Eye,
  EyeOff,
  Trash2,
  Flag,
  Pencil,
  Save,
  X as XIcon,
  MessageCircle,
  Send,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../utils/firebase/client";
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { auth } from "../utils/firebase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListSkeleton, StatRowSkeleton, FetchingBadge } from "../components/skeletons/Skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface SupportRequest {
  id: string;
  name: string;
  email: string;
  device: string | null;
  issue: string | null;
  description: string;
  created_at: string;
  status: "pending" | "resolved" | "priority" | "waiting_for_response";
  source: "contact" | "troubleshooting";
  user_id: string | null;
  messages: ThreadMessage[];
  // Legacy fields, kept for backwards compatibility with old rows that don't
  // have a messages[] yet. Surface as a synthesised first message in the UI.
  last_reply: string | null;
  last_reply_at: string | null;
  last_reply_by: string | null;
}

interface ThreadMessage {
  id: string;
  text: string;
  at: string; // ISO
  by_uid: string;
  by_role: "admin" | "student";
}

/** Combine the legacy `last_reply` snapshot with the new `messages[]` thread
 *  so old rows still render a single message instead of an empty thread. */
function threadMessages(r: SupportRequest): ThreadMessage[] {
  const msgs = r.messages ?? [];
  if (msgs.length > 0) return msgs;
  if (r.last_reply && r.last_reply_by) {
    return [
      {
        id: "legacy",
        text: r.last_reply,
        at: r.last_reply_at ?? "",
        by_uid: r.last_reply_by,
        // Heuristic: if the legacy reply was authored by the ticket's user,
        // it's a student reply; otherwise treat it as an admin note.
        by_role: r.last_reply_by === r.user_id ? "student" : "admin",
      },
    ];
  }
  return [];
}

type DisplayMessage = ThreadMessage & { hidden: boolean };

function ThreadView({
  messages,
  hiddenMessages = [],
  adminUid,
  onHide,
  onUnhide,
}: {
  messages: ThreadMessage[];
  hiddenMessages?: ThreadMessage[];
  adminUid?: string;
  onHide?: (m: ThreadMessage) => void;
  onUnhide?: (m: ThreadMessage) => void;
}) {
  // Merge visible + admin-only-hidden messages, sort by their original `at`
  // so the conversation order is preserved even with hidden ones interleaved.
  const merged: DisplayMessage[] = useMemo(() => {
    const visible = messages.map((m) => ({ ...m, hidden: false }));
    const hidden = hiddenMessages.map((m) => ({ ...m, hidden: true }));
    return [...visible, ...hidden].sort((a, b) =>
      (a.at || "") < (b.at || "") ? -1 : 1,
    );
  }, [messages, hiddenMessages]);

  if (merged.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
        No messages yet. Send the first reply below.
      </div>
    );
  }
  return (
    <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
      {merged.map((m) => {
        const isMe = adminUid && m.by_uid === adminUid;
        const isAdmin = m.by_role === "admin";
        const isHidden = m.hidden;
        const canToggle = m.id !== "legacy" && (onHide || onUnhide);
        return (
          <div
            key={`${isHidden ? "h" : "v"}-${m.id}`}
            className={`group rounded-lg border p-3 transition-opacity ${
              isHidden
                ? "bg-gray-50 border-gray-300 border-dashed opacity-80"
                : isAdmin
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isHidden
                      ? "text-gray-600"
                      : isAdmin
                        ? "text-emerald-700"
                        : "text-blue-700"
                  }`}
                >
                  {isAdmin ? (isMe ? "You (admin)" : "Admin") : "User"}
                </p>
                {isHidden && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-gray-200 text-gray-700">
                    Hidden from student
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p
                  className={`text-[10px] ${
                    isHidden
                      ? "text-gray-500"
                      : isAdmin
                        ? "text-emerald-700/70"
                        : "text-blue-700/70"
                  }`}
                >
                  {m.at ? new Date(m.at).toLocaleString() : ""}
                </p>
                {canToggle && (
                  <button
                    type="button"
                    onClick={() =>
                      isHidden ? onUnhide?.(m) : onHide?.(m)
                    }
                    className="text-gray-500 hover:text-gray-900 opacity-60 group-hover:opacity-100 transition-opacity"
                    title={
                      isHidden ? "Unhide (visible to student again)" : "Hide from student"
                    }
                    aria-label={isHidden ? "Unhide message" : "Hide message"}
                  >
                    {isHidden ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <p
              className={`text-sm whitespace-pre-wrap ${
                isHidden
                  ? "text-gray-700"
                  : isAdmin
                    ? "text-emerald-900"
                    : "text-blue-900"
              }`}
            >
              {m.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}

async function fetchSupportRequests(): Promise<SupportRequest[]> {
  const q = query(collection(db, "support_requests"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const ts = (v: unknown) =>
      v instanceof Timestamp ? v.toDate().toISOString() : ((v as string) ?? null);
    return {
      id: d.id,
      name: data.name ?? "",
      email: data.email ?? "",
      device: data.device ?? null,
      issue: data.issue ?? null,
      description: data.description ?? "",
      status: (data.status as SupportRequest["status"]) ?? "pending",
      source: (data.source as SupportRequest["source"]) ?? "contact",
      user_id: data.user_id ?? null,
      created_at: ts(data.created_at) ?? "",
      messages: ((data.messages as ThreadMessage[] | undefined) ?? []).map((m) => ({
        ...m,
        at: typeof m.at === "string" ? m.at : ((m.at as unknown) as Timestamp)?.toDate?.().toISOString?.() ?? "",
      })),
      last_reply: data.last_reply ?? null,
      last_reply_at: ts(data.last_reply_at),
      last_reply_by: data.last_reply_by ?? null,
    };
  });
}

export function SupportRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    device: "",
    issue: "",
    description: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [askForResponse, setAskForResponse] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  // Admin-only archive of messages hidden from the student. Sourced from the
  // hidden_messages subcollection of the currently-open ticket.
  const [hiddenMessages, setHiddenMessages] = useState<ThreadMessage[]>([]);

  const { data: requests = [], isPending, isFetching } = useQuery({
    queryKey: ["support_requests"],
    queryFn: fetchSupportRequests,
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
      return;
    }
    if (user?.role !== "admin") return;

    // Realtime subscription via Firestore onSnapshot — invalidate the query cache
    // on any change so the list updates live.
    const q = query(collection(db, "support_requests"), orderBy("created_at", "desc"));
    const unsub = onSnapshot(q, () => {
      queryClient.invalidateQueries({ queryKey: ["support_requests"] });
    });
    return () => unsub();
  }, [user, navigate, queryClient]);

  // Subscribe to the open ticket's hidden_messages subcollection so admin
  // sees archived messages live (e.g. another admin tab toggling visibility).
  useEffect(() => {
    if (!selectedRequest) {
      setHiddenMessages([]);
      return;
    }
    const ref = collection(
      db,
      "support_requests",
      selectedRequest.id,
      "hidden_messages",
    );
    const unsub = onSnapshot(ref, (snap) => {
      setHiddenMessages(
        snap.docs.map((d) => {
          const data = d.data();
          const at = data.at;
          return {
            id: d.id,
            text: (data.text as string) ?? "",
            at:
              typeof at === "string"
                ? at
                : (at as Timestamp | undefined)?.toDate?.().toISOString?.() ?? "",
            by_uid: (data.by_uid as string) ?? "",
            by_role: (data.by_role as "admin" | "student") ?? "admin",
          };
        }),
      );
    });
    return () => unsub();
  }, [selectedRequest?.id]);

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query) ||
          (r.device ?? "").toLowerCase().includes(query) ||
          (r.issue ?? "").toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    return filtered;
  }, [requests, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      resolved: requests.filter((r) => r.status === "resolved").length,
      priority: requests.filter((r) => r.status === "priority").length,
    };
  }, [requests]);

  const sendAdminReply = async () => {
    if (!selectedRequest) return;
    const text = adminReply.trim();
    if (!text) return;
    setSendingReply(true);
    try {
      const me = auth.currentUser;
      const message: ThreadMessage = {
        id: crypto.randomUUID(),
        text,
        at: new Date().toISOString(),
        by_uid: me?.uid ?? "",
        by_role: "admin",
      };
      const newStatus = askForResponse ? "waiting_for_response" : selectedRequest.status;
      await updateDoc(doc(db, "support_requests", selectedRequest.id), {
        messages: arrayUnion(message),
        status: newStatus,
        updated_at: serverTimestamp(),
      });
      // Optimistic UI: append locally without re-fetching.
      setSelectedRequest((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, message], status: newStatus }
          : prev,
      );
      queryClient.setQueryData<SupportRequest[]>(["support_requests"], (rows) =>
        (rows ?? []).map((r) =>
          r.id === selectedRequest.id
            ? { ...r, messages: [...r.messages, message], status: newStatus }
            : r,
        ),
      );
      setAdminReply("");
      setAskForResponse(false);
      toast.success(askForResponse ? "Reply sent — user can now respond." : "Reply sent.");
    } catch (err) {
      toast.error((err as Error).message || "Failed to send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  // Hide a message from the student. The original is moved to a subcollection
  // that only admins can read, then removed from the doc's messages[] so the
  // student can no longer fetch it — even via direct Firestore reads.
  const hideMessage = async (msg: ThreadMessage) => {
    if (!selectedRequest) return;
    if (msg.id === "legacy") {
      toast.error("Legacy messages can't be hidden.");
      return;
    }
    try {
      const reqRef = doc(db, "support_requests", selectedRequest.id);
      const snap = await getDoc(reqRef);
      const current = ((snap.data()?.messages as ThreadMessage[] | undefined) ?? []);
      // 1. Archive the original to the admin-only subcollection.
      await setDoc(
        doc(db, "support_requests", selectedRequest.id, "hidden_messages", msg.id),
        {
          id: msg.id,
          text: msg.text,
          at: msg.at,
          by_uid: msg.by_uid,
          by_role: msg.by_role,
          hidden_at: serverTimestamp(),
          hidden_by_uid: auth.currentUser?.uid ?? "",
        },
      );
      // 2. Strip from the doc's messages array. Overwrite the whole array
      //    rather than arrayRemove() to avoid deep-equality mismatches when
      //    Firestore stored `at` as a Timestamp but we hold an ISO string.
      const next = current.filter((m) => m.id !== msg.id);
      await updateDoc(reqRef, {
        messages: next,
        updated_at: serverTimestamp(),
      });
      // Optimistic UI: subscription will also refresh, but update now.
      setSelectedRequest((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== msg.id) } : prev,
      );
      queryClient.setQueryData<SupportRequest[]>(["support_requests"], (rows) =>
        (rows ?? []).map((r) =>
          r.id === selectedRequest.id
            ? { ...r, messages: r.messages.filter((m) => m.id !== msg.id) }
            : r,
        ),
      );
      toast.success("Message hidden from student.");
    } catch (err) {
      toast.error((err as Error).message || "Failed to hide message.");
    }
  };

  // Restore a previously-hidden message: put it back into messages[] and
  // delete the subcollection record.
  const unhideMessage = async (msg: ThreadMessage) => {
    if (!selectedRequest) return;
    try {
      await updateDoc(doc(db, "support_requests", selectedRequest.id), {
        messages: arrayUnion({
          id: msg.id,
          text: msg.text,
          at: msg.at,
          by_uid: msg.by_uid,
          by_role: msg.by_role,
        }),
        updated_at: serverTimestamp(),
      });
      await deleteDoc(
        doc(db, "support_requests", selectedRequest.id, "hidden_messages", msg.id),
      );
      setSelectedRequest((prev) =>
        prev ? { ...prev, messages: [...prev.messages, msg] } : prev,
      );
      toast.success("Message restored.");
    } catch (err) {
      toast.error((err as Error).message || "Failed to unhide message.");
    }
  };

  const updateRequestStatus = async (id: string, status: SupportRequest["status"]) => {
    try {
      await updateDoc(doc(db, "support_requests", id), {
        status,
        updated_at: serverTimestamp(),
      });
      queryClient.setQueryData<SupportRequest[]>(["support_requests"], (prev) =>
        (prev ?? []).map((r) => (r.id === id ? { ...r, status } : r)),
      );
      setSelectedRequest((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      toast.success("Request updated", {
        description: `Status changed to ${status}`,
      });
    } catch (err) {
      toast.error((err as Error).message || "Failed to update status.");
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, "support_requests", id));
      queryClient.setQueryData<SupportRequest[]>(["support_requests"], (prev) =>
        (prev ?? []).filter((r) => r.id !== id),
      );
      if (selectedRequest?.id === id) {
        setViewModalOpen(false);
        setSelectedRequest(null);
      }
      toast.success("Request deleted");
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete request.");
    }
  };

  const viewRequest = (request: SupportRequest) => {
    setSelectedRequest(request);
    setEditing(false);
    setViewModalOpen(true);
  };

  const startEdit = (r: SupportRequest) => {
    setEditForm({
      name: r.name,
      email: r.email,
      device: r.device ?? "",
      issue: r.issue ?? "",
      description: r.description,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selectedRequest) return;
    setSavingEdit(true);
    const patch = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      device: editForm.device.trim() || null,
      issue: editForm.issue.trim() || null,
      description: editForm.description.trim(),
    };
    try {
      await updateDoc(doc(db, "support_requests", selectedRequest.id), {
        ...patch,
        updated_at: serverTimestamp(),
      });
      queryClient.setQueryData<SupportRequest[]>(["support_requests"], (prev) =>
        (prev ?? []).map((r) => (r.id === selectedRequest.id ? { ...r, ...patch } : r)),
      );
      setSelectedRequest((prev) => (prev ? { ...prev, ...patch } : prev));
      setEditing(false);
      toast.success("Request updated.");
    } catch (err) {
      toast.error((err as Error).message || "Failed to save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: SupportRequest["status"]) => {
    const badges = {
      pending: {
        color: "bg-orange-100 text-orange-700 border-orange-300",
        icon: Clock,
        label: "Pending",
      },
      resolved: {
        color: "bg-green-100 text-green-700 border-green-300",
        icon: CheckCircle,
        label: "Resolved",
      },
      priority: {
        color: "bg-red-100 text-red-700 border-red-300",
        icon: Flag,
        label: "Priority",
      },
      waiting_for_response: {
        color: "bg-blue-100 text-blue-700 border-blue-300",
        icon: AlertCircle,
        label: "Waiting",
      },
    };
    return badges[status];
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2">Support Requests</h1>
              <p className="text-xl text-muted-foreground">
                Manage and respond to user support tickets
              </p>
            </div>
            <FetchingBadge isFetching={isFetching} isPending={isPending} />
          </div>
        </div>

        {/* Stats Cards */}
        {isPending && (
          <div className="mb-8">
            <StatRowSkeleton count={4} />
          </div>
        )}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 ${isPending ? "hidden" : ""}`}>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <h3 className="text-2xl">{stats.total}</h3>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <h3 className="text-2xl">{stats.pending}</h3>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-white border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <h3 className="text-2xl">{stats.priority}</h3>
              </div>
              <Flag className="w-8 h-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <h3 className="text-2xl">{stats.resolved}</h3>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search requests by name, email, device, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl"
            />
          </div>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px] bg-white border-2 border-gray-300 rounded-xl h-12 gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="waiting_for_response">Waiting for response</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests Table */}
        <Card className="overflow-hidden">
          {isPending ? (
            <div className="p-6">
              <ListSkeleton count={4} />
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Requester
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Device
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Issue
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => {
                    const badge = getStatusBadge(request.status);
                    const StatusIcon = badge.icon;

                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-blue-100 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {request.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {request.device}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {request.issue}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs border inline-flex items-center gap-1 ${badge.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewRequest(request)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteRequest(request.id)}
                              className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl mb-2 text-gray-700">No requests found</h3>
              <p className="text-gray-500">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Support requests will appear here"}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* View Request Modal */}
      <AnimatePresence>
        {viewModalOpen && selectedRequest && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden max-h-[90vh] flex flex-col mx-4"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-white text-2xl">Support Request Details</h2>
                  <p className="text-sm text-blue-100">
                    Submitted {formatDate(selectedRequest.created_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-xl"
                >
                  <span className="text-2xl">&times;</span>
                </Button>
              </div>

              {/* Content — two columns on lg+, single column on smaller screens.
                  Each column scrolls independently so the conversation is
                  visible without scrolling the whole modal. */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x lg:divide-gray-200 min-h-0">
                {/* Left column — ticket details */}
                <div className="overflow-y-auto p-6">
                  <div className="space-y-6">
                  {/* Edit toggle */}
                  <div className="flex items-center justify-end gap-2">
                    {editing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditing(false)}
                          disabled={savingEdit}
                        >
                          <XIcon className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={saveEdit}
                          disabled={savingEdit}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {savingEdit ? "Saving…" : "Save"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(selectedRequest)}
                        className="border-blue-300 text-blue-700"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit fields
                      </Button>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Name</Label>
                      {editing ? (
                        <Input
                          className="mt-1"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <p className="text-lg text-gray-900 mt-1">{selectedRequest.name}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      {editing ? (
                        <Input
                          type="email"
                          className="mt-1"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      ) : (
                        <p className="text-lg text-gray-900 mt-1">{selectedRequest.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Device & Issue */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Device</Label>
                      {editing ? (
                        <Input
                          className="mt-1"
                          value={editForm.device}
                          onChange={(e) => setEditForm({ ...editForm, device: e.target.value })}
                        />
                      ) : (
                        <p className="text-lg text-gray-900 mt-1">{selectedRequest.device}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Issue Type</Label>
                      {editing ? (
                        <Input
                          className="mt-1"
                          value={editForm.issue}
                          onChange={(e) => setEditForm({ ...editForm, issue: e.target.value })}
                        />
                      ) : (
                        <p className="text-lg text-gray-900 mt-1">{selectedRequest.issue}</p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">
                      Problem Description
                    </Label>
                    {editing ? (
                      <Textarea
                        rows={5}
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                      />
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                        <p className="text-gray-800 leading-relaxed">
                          {selectedRequest.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status Update */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-3">Update Status</p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          updateRequestStatus(selectedRequest.id, "pending")
                        }
                        variant={
                          selectedRequest.status === "pending" ? "default" : "outline"
                        }
                        className={
                          selectedRequest.status === "pending"
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "border-orange-300 text-orange-700 hover:bg-orange-100"
                        }
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Mark as Pending
                      </Button>
                      <Button
                        onClick={() =>
                          updateRequestStatus(selectedRequest.id, "priority")
                        }
                        variant={
                          selectedRequest.status === "priority" ? "default" : "outline"
                        }
                        className={
                          selectedRequest.status === "priority"
                            ? "bg-red-600 hover:bg-red-700"
                            : "border-red-300 text-red-700 hover:bg-red-100"
                        }
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Mark as Priority
                      </Button>
                      <Button
                        onClick={() =>
                          updateRequestStatus(selectedRequest.id, "resolved")
                        }
                        variant={
                          selectedRequest.status === "resolved" ? "default" : "outline"
                        }
                        className={
                          selectedRequest.status === "resolved"
                            ? "bg-green-600 hover:bg-green-700"
                            : "border-green-300 text-green-700 hover:bg-green-100"
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Resolved
                      </Button>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Right column — conversation thread + composer.
                    Thread takes remaining height; composer pinned at bottom. */}
                <div className="flex flex-col p-6 bg-gray-50/40 min-h-0">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4 text-blue-700" />
                    <p className="text-sm font-medium text-gray-700">Conversation</p>
                  </div>
                  <ThreadView
                    messages={threadMessages(selectedRequest)}
                    hiddenMessages={hiddenMessages}
                    adminUid={user?.id}
                    onHide={hideMessage}
                    onUnhide={unhideMessage}
                  />

                  {/* Reply composer */}
                  <div className="mt-3 space-y-2 shrink-0">
                    <label
                      htmlFor="ask-toggle"
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                        askForResponse
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <MessageCircle
                          className={`w-4 h-4 ${
                            askForResponse ? "text-blue-700" : "text-gray-500"
                          }`}
                        />
                        <span
                          className={
                            askForResponse ? "text-blue-900" : "text-gray-700"
                          }
                        >
                          Ask user for a response after sending
                        </span>
                      </div>
                      <Switch
                        id="ask-toggle"
                        checked={askForResponse}
                        onCheckedChange={setAskForResponse}
                      />
                    </label>
                    <div className="rounded-lg border-2 border-gray-200 bg-white">
                      <Textarea
                        placeholder="Write a reply to the user…"
                        value={adminReply}
                        onChange={(e) => setAdminReply(e.target.value)}
                        rows={3}
                        className="border-0 focus-visible:ring-0 resize-none"
                      />
                      <div className="flex items-center justify-end p-2 border-t border-gray-100 bg-gray-50/40">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={sendAdminReply}
                          disabled={sendingReply || !adminReply.trim()}
                        >
                          <Send className="w-4 h-4 mr-1.5" />
                          {sendingReply ? "Sending…" : "Send reply"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setViewModalOpen(false)}
                    className="flex-1 border-gray-300 hover:bg-gray-100 h-12 rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => deleteRequest(selectedRequest.id)}
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-100 h-12 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Request
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
