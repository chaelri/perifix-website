import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
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

const LS_OWN_PREFIX = "perifix-support-last-seen-own:";
const LS_WATCHING_PREFIX = "perifix-support-last-seen-watching:";

type SeenKind = "own" | "watching";
type SeenListener = (kind: SeenKind, userId: string, seenAt: number) => void;
const seenListeners = new Set<SeenListener>();
function broadcastSeen(kind: SeenKind, userId: string, seenAt: number) {
  seenListeners.forEach((l) => l(kind, userId, seenAt));
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

function readSeen(prefix: string, userId: string): number {
  try {
    const raw = localStorage.getItem(prefix + userId);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Tracks two unread streams:
 *   - "own"      → messages someone else sent on tickets you own
 *   - "watching" → messages someone else sent on tickets you (as admin) have
 *                  replied to but don't own
 *
 * Each stream has its own seen-marker in localStorage and an in-process
 * broadcast so every live hook instance updates the moment any of them
 * acknowledges activity (no page refresh needed).
 */
export function useSupportInbox(
  userId: string | undefined,
  role: "student" | "admin" | undefined,
) {
  const [ownLatestAt, setOwnLatestAt] = useState(0);
  const [watchingLatestAt, setWatchingLatestAt] = useState(0);
  const [ownSeenAt, setOwnSeenAt] = useState(0);
  const [watchingSeenAt, setWatchingSeenAt] = useState(0);

  // Seen markers + cross-instance broadcast wiring.
  useEffect(() => {
    if (!userId) {
      setOwnSeenAt(0);
      setWatchingSeenAt(0);
      return;
    }
    setOwnSeenAt(readSeen(LS_OWN_PREFIX, userId));
    setWatchingSeenAt(readSeen(LS_WATCHING_PREFIX, userId));
    const listener: SeenListener = (kind, uid, value) => {
      if (uid !== userId) return;
      if (kind === "own") setOwnSeenAt(value);
      else setWatchingSeenAt(value);
    };
    seenListeners.add(listener);
    return () => {
      seenListeners.delete(listener);
    };
  }, [userId]);

  // Own tickets: latest message authored by anyone other than me.
  useEffect(() => {
    if (!userId) {
      setOwnLatestAt(0);
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
          if (m.by_uid === userId) continue;
          const t = tsToMillis(m.at);
          if (t > maxAt) maxAt = t;
        }
        // Legacy rows: last_reply by someone other than me.
        const lastBy = data.last_reply_by ?? null;
        const lastReply = data.last_reply ?? null;
        if (lastReply && lastBy && lastBy !== userId) {
          const t = tsToMillis(data.last_reply_at);
          if (t > maxAt) maxAt = t;
        }
      });
      setOwnLatestAt(maxAt);
    });
    return () => unsub();
  }, [userId]);

  // Watching (admin only): tickets I've replied to but don't own. Latest
  // message by someone other than me drives the unread state.
  useEffect(() => {
    if (!userId || role !== "admin") {
      setWatchingLatestAt(0);
      return;
    }
    const q = query(
      collection(db, "support_requests"),
      orderBy("created_at", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      let maxAt = 0;
      snap.forEach((d) => {
        const data = d.data();
        const ownerId = (data.user_id as string | null) ?? null;
        if (!ownerId || ownerId === userId) return;
        const messages = (data.messages as ThreadMessage[] | undefined) ?? [];
        const iReplied = messages.some((m) => m.by_uid === userId);
        if (!iReplied) return;
        for (const m of messages) {
          if (m.by_uid === userId) continue;
          const t = tsToMillis(m.at);
          if (t > maxAt) maxAt = t;
        }
      });
      setWatchingLatestAt(maxAt);
    });
    return () => unsub();
  }, [userId, role]);

  const markOwnRead = useCallback(() => {
    if (!userId) return;
    const now = Math.max(Date.now(), ownLatestAt);
    try {
      localStorage.setItem(LS_OWN_PREFIX + userId, String(now));
    } catch {
      // localStorage unavailable — non-fatal.
    }
    broadcastSeen("own", userId, now);
  }, [userId, ownLatestAt]);

  const markWatchingRead = useCallback(() => {
    if (!userId) return;
    const now = Math.max(Date.now(), watchingLatestAt);
    try {
      localStorage.setItem(LS_WATCHING_PREFIX + userId, String(now));
    } catch {
      // localStorage unavailable — non-fatal.
    }
    broadcastSeen("watching", userId, now);
  }, [userId, watchingLatestAt]);

  const markAllRead = useCallback(() => {
    markOwnRead();
    markWatchingRead();
  }, [markOwnRead, markWatchingRead]);

  const hasUnreadOwn = useMemo(
    () => ownLatestAt > 0 && ownLatestAt > ownSeenAt,
    [ownLatestAt, ownSeenAt],
  );
  const hasUnreadWatching = useMemo(
    () => watchingLatestAt > 0 && watchingLatestAt > watchingSeenAt,
    [watchingLatestAt, watchingSeenAt],
  );
  const hasUnread = hasUnreadOwn || hasUnreadWatching;

  return {
    hasUnread,
    hasUnreadOwn,
    hasUnreadWatching,
    ownLatestAt,
    watchingLatestAt,
    markOwnRead,
    markWatchingRead,
    markAllRead,
  };
}
