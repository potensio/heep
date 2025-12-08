import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/lib/query-keys";
import { Notification } from "@/src/types/notification";
import { markAsRead as markAsReadService } from "@/src/services/notification-service";

/**
 * Return type for the useMarkAsRead hook.
 * Provides mutation function and state for marking notifications as read.
 */
export interface UseMarkAsReadReturn {
  /** Function to mark a notification as read by ID */
  markAsRead: (notificationId: string) => Promise<void>;
  /** True while the mutation is in progress */
  isPending: boolean;
  /** True if the mutation encountered an error */
  isError: boolean;
  /** Error object if mutation failed, null otherwise */
  error: Error | null;
}

/**
 * Context type for optimistic update rollback.
 * Stores the previous notifications state before mutation.
 */
interface MutationContext {
  previousNotifications: Notification[] | undefined;
}

/**
 * Custom hook for marking notifications as read using TanStack Query mutations.
 * Implements optimistic updates with automatic rollback on failure.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * - 4.1: Marks notification as read using useMutation
 * - 4.2: Updates local cache optimistically before server confirmation
 * - 4.3: Rolls back optimistic update on failure
 * - 4.4: Updates unread count immediately on mutation
 *
 * Property 2: Optimistic update correctness
 * Property 3: Optimistic rollback on failure
 */
export function useMarkAsRead(): UseMarkAsReadReturn {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.notifications.list();

  const mutation = useMutation<void, Error, string, MutationContext>({
    mutationFn: markAsReadService,

    // Optimistic update: update cache before server responds
    onMutate: async (notificationId: string) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value for potential rollback
      const previousNotifications =
        queryClient.getQueryData<Notification[]>(queryKey);

      // Optimistically update the cache
      // Property 2: Cache immediately reflects isRead: true and unread count decreases by 1
      queryClient.setQueryData<Notification[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        );
      });

      // Return context with previous value for rollback
      return { previousNotifications };
    },

    // Rollback on error
    // Property 3: On failure, cache reverts to previous state
    onError: (_error, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKey, context.previousNotifications);
      }
    },

    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Wrap mutateAsync for cleaner API
  const markAsRead = useCallback(
    async (notificationId: string): Promise<void> => {
      await mutation.mutateAsync(notificationId);
    },
    [mutation]
  );

  return {
    markAsRead,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error ?? null,
  };
}
