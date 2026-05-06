import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

// Persist the query cache to localStorage so revisits render instantly from
// cache while a background refetch runs. The Supabase project is in Singapore
// (ap-southeast-1) so cold round-trips are 200-500ms each — caching is the
// single biggest perceived-speed lever we have.
//
// staleTime: 2min — repeat visits within this window skip the network entirely.
// Long-lived tables (devices/problems) override to 30min in their own queries.
// gcTime: 24h keeps the persisted cache across sessions.
// refetchOnWindowFocus: false — the auto-refetch on tab return is the main
// reason pages flash a "Refreshing" badge constantly.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000,
      gcTime: 24 * 60 * 60_000,
      refetchOnWindowFocus: false,
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
