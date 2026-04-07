import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Unsubscribe,
} from "firebase/firestore";
import { OneSignal } from "react-native-onesignal";
import { db } from "@/src/lib/firebase";
import { queryKeys } from "@/src/lib/query-keys";
import { Notification } from "@/src/types/notification";
import { fromFirestoreDoc } from "@/src/services/notification-service";

const NOTIFICATIONS_COLLECTION = "notifications";
const SUBSCRIPTION_ID_RETRY_INTERVAL = 1000;
const SUBSCRIPTION_ID_MAX_RETRIES = 10;

/**
 * Return type for the useNotifications hook.
 */
export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
}

/**
 * Compute the unread count from a list of notifications.
 */
export function computeUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}

/**
 * Custom hook for notifications using Firestore real-time subscription.
 * Retries getting the OneSignal subscription ID if not immediately available.
 */
export function useNotifications(): UseNotificationsReturn {
  const queryClient = useQueryClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const setupSubscriptionRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const queryKey = queryKeys.notifications.list();

    const cleanup = () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const setupSubscription = async () => {
      // Cleanup existing subscription and retry timers
      cleanup();

      setIsLoading(true);
      setError(null);

      // Get current user's OneSignal subscription ID using the new async method
      const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();

      if (!subscriptionId) {
        // Retry — OneSignal may not have initialized yet
        if (retryCountRef.current < SUBSCRIPTION_ID_MAX_RETRIES) {
          retryCountRef.current += 1;
          console.log(
            `[useNotifications] No subscription ID yet, retrying (${retryCountRef.current}/${SUBSCRIPTION_ID_MAX_RETRIES})...`,
          );
          retryTimerRef.current = setTimeout(
            setupSubscription,
            SUBSCRIPTION_ID_RETRY_INTERVAL,
          );
          return;
        }

        console.warn(
          "[useNotifications] No subscription ID after max retries, showing empty list",
        );
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      // Reset retry counter on success
      retryCountRef.current = 0;

      console.log(
        "[useNotifications] Filtering by subscriptionId:",
        subscriptionId,
      );

      try {
        // Query notifications filtered by user's subscription ID
        const q = query(
          collection(db, NOTIFICATIONS_COLLECTION),
          where("data.subscriptionId", "==", subscriptionId),
          orderBy("createdAt", "desc"),
        );

        // onSnapshot fires immediately with cached/server data — no need for a
        // separate getDocs call, which was causing a redundant double-fetch and
        // slower perceived loading.
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const data = snapshot.docs.map(fromFirestoreDoc);
            console.log(
              "[useNotifications] Snapshot update:",
              data.length,
              "items",
            );
            setNotifications(data);
            setIsLoading(false);
            setError(null);
            queryClient.setQueryData(queryKey, data);
          },
          (err) => {
            console.error(
              "[useNotifications] Subscription error:",
              err.message,
              (err as { code?: string }).code,
            );
            setError(err);
            setIsLoading(false);
          },
        );

        unsubscribeRef.current = unsubscribe;
      } catch (err) {
        console.error("[useNotifications] Setup error:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to setup Firestore"),
        );
        setIsLoading(false);
      }
    };

    setupSubscriptionRef.current = setupSubscription;
    setupSubscription();

    return cleanup;
  }, [queryClient]);

  const unreadCount = useMemo(
    () => computeUnreadCount(notifications),
    [notifications],
  );

  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    if (setupSubscriptionRef.current) {
      setupSubscriptionRef.current();
    }
  }, []);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      const previousNotifications = notifications;
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );

      try {
        const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(docRef, { isRead: true });
      } catch (err) {
        // Rollback on error
        console.error("[useNotifications] markAsRead error:", err);
        setNotifications(previousNotifications);
        throw err;
      }
    },
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    isError: error !== null,
    error,
    refetch,
    markAsRead,
  };
}
