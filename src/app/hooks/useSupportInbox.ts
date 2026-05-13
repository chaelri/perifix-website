import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../utils/firebase/client";

interface ThreadMessage {
  by_uid: string;
  by_role: "admin" | "student";
  at: string | Timestamp | { toDate?: () => Date };
}

const LS_PREFIX = "perifix-support-last-seen:";

// Module-level broadcast so every live useSupportInbox instance (e.g. Navbar +
// MySupportRequests mounted at the same time) updates its `seenAt` the moment
// any of them calls markAllRead — no page refresh required.
type SeenListener = (userId: string, seenAt: number) => void;
const seenListeners = new Set<SeenListener>();
function broadcastSeen(userId: string, seenAt: number) {
  seenListeners.forEach((l) => l(userId, seenAt));
}

function tsToMillis(v: unknown): number {
  if (!v) return 0;
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === "string") {
    const n = Date.parse(v);
    return Number.isNaN(n) ? 0 : n;
  }
  if (typeof v === "object" && v && "toDate" in (v as Record<string, unknown>)) {
    try {
      return ((v as { toDate: () => Date }).toDate()).getTime();
    } catch {
      return 0;
    }
  }
  return 0;
}

function readSeen(userId: string): number {
  try {
    const raw = localStorage.getItem(LS_PREFIX + userId);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Subscribes to the current student's `support_requests` and reports whether
 * there's an admin message they haven't acknowledged yet. The "seen" marker is
 * a per-uid timestamp stored in localStorage — no Firestore schema change
 * needed. Admin role short-circuits (admins don't get a self-notification).
 */
export function useSupportInbox(
  userId: string | undefined,
  role: "student" | "admin" | undefined,
) {
  const [latestAdminAt, setLatestAdminAt] = useState(0);
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    if (!userId) {
      setSeenAt(0);
      return;
    }
    setSeenAt(readSeen(userId));
    const listener: SeenListener = (uid, value) => {
      if (uid === userId) setSeenAt(value);
    };
    seenListeners.add(listener);
    return () => {
      seenListeners.delete(listener);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || role !== "student") {
      setLatestAdminAt(0);
      return;
    }
    const q = query(
      collection(db, "support_requests"),
      where("user_id", "==", userId),
    );
    const unsub = onSnapshot(q, (snap) => {
      let maxAt = 0;
      snap.forEach((d) => {
        const data = d.data();
        const messages = (data.messages as ThreadMessage[] | undefined) ?? [];
        for (const m of messages) {
          if (m.by_role !== "admin") continue;
          const t = tsToMillis(m.at);
          if (t > maxAt) maxAt = t;
        }
        // Legacy rows: last_reply authored by someone other than the ticket
        // owner counts as an admin reply.
        const lastReply = data.last_reply ?? null;
        const lastBy = data.last_reply_by ?? null;
        const ownerId = data.user_id ?? null;
        if (lastReply && lastBy && lastBy !== ownerId) {
          const t = tsToMillis(data.last_reply_at);
          if (t > maxAt) maxAt = t;
        }
      });
      setLatestAdminAt(maxAt);
    });
    return () => unsub();
  }, [userId, role]);

  const markAllRead = useCallback(() => {
    if (!userId) return;
    const now = Math.max(Date.now(), latestAdminAt);
    try {
      localStorage.setItem(LS_PREFIX + userId, String(now));
    } catch {
      // localStorage unavailable — non-fatal.
    }
    broadcastSeen(userId, now);
  }, [userId, latestAdminAt]);

  const hasUnread = useMemo(
    () => latestAdminAt > 0 && latestAdminAt > seenAt,
    [latestAdminAt, seenAt],
  );

  return { hasUnread, markAllRead, latestAdminAt };
}
