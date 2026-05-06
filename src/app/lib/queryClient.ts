import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// Persist the query cache to localStorage so a refresh shows cached data
// instantly (with a "Refreshing…" indicator while the background refetch
// runs) instead of an empty page for several seconds.
//
// staleTime: 30s lets quick repeat-visits skip the refetch entirely.
// gcTime: 24h keeps the persisted cache around between sessions.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 24 * 60 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

export const persister =
  typeof window !== "undefined"
    ? createSyncStoragePersister({
        storage: window.localStorage,
        key: "perifix-query-cache",
        // Throttle so we don't flood localStorage on every state change.
        throttleTime: 1_000,
      })
    : undefined;
