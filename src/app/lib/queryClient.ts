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

// Prefetch helpers — call these from Navbar onMouseEnter so the data is
// already in cache by the time the user clicks the link.
export const prefetchers = {
  troubleshooting: () =>
    queryClient.prefetchQuery({
      queryKey: ["troubleshooting-tree"],
      staleTime: 30 * 60_000,
      queryFn: async () => {
        const [devs, probs] = await Promise.all([
          supabase
            .from("devices")
            .select("id, slug, name, category, icon_name, color_class, display_order")
            .order("display_order", { ascending: true }),
          supabase
            .from("problems")
            .select("id, device_id, slug, title, severity, steps, display_order")
            .order("display_order", { ascending: true }),
        ]);
        if (devs.error) throw devs.error;
        if (probs.error) throw probs.error;
        return { devices: devs.data ?? [], problems: probs.data ?? [] };
      },
    }),
  supportRequests: () =>
    queryClient.prefetchQuery({
      queryKey: ["support_requests"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("support_requests")
          .select("id, name, email, device, issue, description, status, source, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data ?? [];
      },
    }),
  userAccounts: () =>
    queryClient.prefetchQuery({
      queryKey: ["profiles"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, full_name, role, created_at, last_login_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data ?? [];
      },
    }),
  accountRequests: () =>
    queryClient.prefetchQuery({
      queryKey: ["account_requests"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("account_requests")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data ?? [];
      },
    }),
};

export type PrefetchKey = keyof typeof prefetchers;
