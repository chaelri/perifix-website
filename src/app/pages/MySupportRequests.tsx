import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Mail,
  Clock,
  CheckCircle,
  Flag,
  MessageSquare,
  Send,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useSupportInbox } from "../hooks/useSupportInbox";
import { auth, db } from "../utils/firebase/client";
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListSkeleton, FetchingBadge } from "../components/skeletons/Skeletons";

type Status = "pending" | "priority" | "resolved" | "waiting_for_response";

interface ThreadMessage {
  id: string;
  text: string;
  at: string;
  by_uid: string;
  by_role: "admin" | "student";
}

interface MyTicket {
  id: string;
  name: string;
  email: string;
  device: string | null;
  issue: string | null;
  description: string;
  status: Status;
  source: "contact" | "troubleshooting";
  created_at: string;
  user_id: string | null;
  messages: ThreadMessage[];
  last_reply: string | null;
  last_reply_at: string | null;
  last_reply_by: string | null;
}

async function fetchMyTickets(uid: string): Promise<MyTicket[]> {
  const { getDocs } = await import("firebase/firestore");
  const q = query(
    collection(db, "support_requests"),
    where("user_id", "==", uid),
  );
  const snap = await getDocs(q);
  const ts = (v: unknown) =>
    v instanceof Timestamp ? v.toDate().toISOString() : ((v as string) ?? null);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? "",
        email: data.email ?? "",
        device: data.device ?? null,
        issue: data.issue ?? null,
        description: data.description ?? "",
        status: (data.status as Status) ?? "pending",
        source: (data.source as MyTicket["source"]) ?? "contact",
        user_id: data.user_id ?? null,
        created_at: ts(data.created_at) ?? "",
        messages: ((data.messages as ThreadMessage[] | undefined) ?? []).map(
          (m) => ({
            ...m,
            at:
              typeof m.at === "string"
                ? m.at
                : ((m.at as unknown) as Timestamp)?.toDate?.().toISOString?.() ?? "",
          }),
        ),
        last_reply: data.last_reply ?? null,
        last_reply_at: ts(data.last_reply_at),
        last_reply_by: data.last_reply_by ?? null,
      };
    })
    .sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
}

const STATUS_BADGE: Record<Status, { color: string; icon: typeof Clock; label: string }> = {
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
    icon: MessageSquare,
    label: "Waiting for your response",
  },
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketRow({ ticket }: { ticket: MyTicket }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const badge = STATUS_BADGE[ticket.status];
  const StatusIcon = badge.icon;

  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    try {
      const me = auth.currentUser;
      const message: ThreadMessage = {
        id: crypto.randomUUID(),
        text,
        at: new Date().toISOString(),
        by_uid: me?.uid ?? "",
        by_role: "student",
      };
      await updateDoc(doc(db, "support_requests", ticket.id), {
        messages: arrayUnion(message),
        status: "pending",
        updated_at: serverTimestamp(),
      });
      toast.success("Reply sent. Admin will review it.");
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const messages: ThreadMessage[] =
    (ticket.messages ?? []).length > 0
      ? (ticket.messages ?? [])
      : ticket.last_reply && ticket.last_reply_by
        ? [
            {
              id: "legacy",
              text: ticket.last_reply,
              at: ticket.last_reply_at ?? "",
              by_uid: ticket.last_reply_by,
              by_role:
                ticket.last_reply_by === auth.currentUser?.uid
                  ? "student"
                  : "admin",
            },
          ]
        : [];

  return (
    <Card className="p-5 border border-gray-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base mb-0">{ticket.issue || "(no subject)"}</h3>
            {ticket.device && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-gray-100 text-gray-600">
                {ticket.device}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted {formatDate(ticket.created_at)}
          </p>
        </div>
        <span
          className={`shrink-0 px-3 py-1 rounded-full text-xs border inline-flex items-center gap-1 ${badge.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {badge.label}
        </span>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700 whitespace-pre-wrap">
        {ticket.description}
      </div>

      {messages.length > 0 && (
        <div className="mt-3 space-y-3">
          {messages.map((m) => {
            const isMe = m.by_uid === auth.currentUser?.uid;
            // Same chat-app palette as the admin view: "you" right-aligned in
            // emerald, the other party left-aligned in indigo (admin) or blue.
            const tone = isMe
              ? {
                  bubble: "bg-emerald-50 border-emerald-200",
                  role: "text-emerald-700",
                  meta: "text-emerald-700/70",
                  text: "text-emerald-900",
                }
              : {
                  bubble: "bg-indigo-50 border-indigo-200",
                  role: "text-indigo-700",
                  meta: "text-indigo-700/70",
                  text: "text-indigo-900",
                };
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className={`flex items-center gap-2 mb-1 px-1 ${tone.meta}`}>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${tone.role}`}
                  >
                    {isMe ? "You" : "Admin"}
                  </span>
                  <span className="text-[10px]">
                    {m.at ? formatDate(m.at) : ""}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl border px-3.5 py-2 ${tone.bubble} ${
                    isMe ? "rounded-tr-sm" : "rounded-tl-sm"
                  }`}
                >
                  <p className={`text-sm whitespace-pre-wrap ${tone.text}`}>
                    {m.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ticket.status === "waiting_for_response" && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-800 mb-2">
            Admin is waiting for your reply
          </p>
          <Textarea
            placeholder="Type your reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            disabled={sending}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function MySupportRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { markAllRead, latestAdminAt } = useSupportInbox(user?.id, user?.role);

  useEffect(() => {
    if (!user) navigate("/login-selection");
  }, [user, navigate]);

  // Visiting this page acknowledges any new admin replies. Re-runs when a new
  // admin message arrives while the page is already open.
  useEffect(() => {
    if (!user) return;
    markAllRead();
  }, [user, latestAdminAt, markAllRead]);

  const {
    data: tickets = [],
    isPending,
    isFetching,
  } = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: () => fetchMyTickets(user!.id),
    enabled: !!user,
  });

  // Live-refresh: any change to this user's tickets re-runs the query.
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "support_requests"),
      where("user_id", "==", user.id),
    );
    const unsub = onSnapshot(q, () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets", user.id] });
    });
    return () => unsub();
  }, [user, queryClient]);

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="mb-1">My Support Requests</h1>
            <p className="text-muted-foreground">
              Track the status of tickets you've submitted.
            </p>
          </div>
          <FetchingBadge isFetching={isFetching} isPending={isPending} />
        </div>

        {isPending ? (
          <ListSkeleton count={3} />
        ) : tickets.length === 0 ? (
          <Card className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl mb-2">No requests yet</h3>
            <p className="text-muted-foreground mb-6">
              Submit a question or report a device issue and you'll see its
              status here.
            </p>
            <Link to="/contact">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Send a message
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <TicketRow key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
