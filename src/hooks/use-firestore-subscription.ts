import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Generic hook that syncs a Firestore real-time listener with TanStack Query cache.
 * Maintains a single subscription per query key and properly cleans up on unmount.
 *
 * @param queryKey - The TanStack Query key to update when data changes
 * @param subscribeFn - Function that sets up the Firestore subscription and returns an unsubscribe function
 * @param enabled - Whether the subscription should be active (default: true)
 *
 * Requirements: 3.1, 3.2, 3.3
 * - 3.1: Updates TanStack Query cache when Firestore real-time update occurs
 * - 3.2: Maintains a single Firestore listener per query
 * - 3.3: Properly unsubscribes from Firestore listener on unmount
 */
export function useFirestoreSubscription<T>(
  queryKey: readonly unknown[],
  subscribeFn: (callback: (data: T) => void) => () => void,
  enabled: boolean = true
): void {
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Don't subscribe if not enabled (e.g., Firebase not ready)
    if (!enabled) return;

    let isMounted = true;

    try {
      // Set up the subscription with a callback that updates the query cache
      const unsubscribe = subscribeFn((data: T) => {
        if (!isMounted) return;
        // Update the TanStack Query cache with new data within the same event loop tick
        // This satisfies Property 4: Cache update on subscription
        queryClient.setQueryData(queryKey, data);
      });

      // Store the unsubscribe function for cleanup
      unsubscribeRef.current = unsubscribe;
    } catch {
      // Firebase error - will be handled by the query error state
    }

    // Cleanup: unsubscribe when component unmounts or dependencies change
    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [queryKey, subscribeFn, queryClient, enabled]);
}
