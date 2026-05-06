import { QueryClient } from "@tanstack/react-query";

// In-memory query cache. Deliberately NOT persisted to localStorage —
// per Charlie's preference, we'd rather show a fresh loading state than
// flash stale data that could be wrong.
//
// staleTime: 30s lets quick back-and-forth navigations reuse cached data
// without a refetch. After 30s the data is "stale" and react-query
// background-refetches on next access (but still hands the cached value
// to components first if available).
//
// gcTime: 5 min keeps unmounted query data around long enough that
// returning to a page within a few minutes feels instant.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
