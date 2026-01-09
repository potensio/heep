import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
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
 * Custom hook for notifications using Firestore subscription.
 * Uses initial fetch + real-time subscription for reliability.
 */
export function useNotifications(): UseNotificationsReturn {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.notifications.list();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const hasInitialFetch = useRef(false);

  const setupSubscription = useCallback(() => {
    // Cleanup existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    // Get current user's OneSignal subscription ID
    const subscriptionId =
      OneSignal.User.pushSubscription.getPushSubscriptionId();

    if (!subscriptionId) {
      console.log(
        "[useNotifications] No subscription ID found, showing empty list"
      );
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    console.log(
      "[useNotifications] Filtering by subscriptionId:",
      subscriptionId
    );

    try {
      // Query notifications filtered by user's subscription ID
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where("data.subscriptionId", "==", subscriptionId),
        orderBy("createdAt", "desc")
      );

      // Initial fetch untuk memastikan data ter-load
      if (!hasInitialFetch.current) {
        getDocs(q)
          .then((snapshot) => {
            const data = snapshot.docs.map(fromFirestoreDoc);
            console.log(
              "[useNotifications] Initial fetch:",
              data.length,
              "items"
            );
            setNotifications(data);
            setIsLoading(false);
            queryClient.setQueryData(queryKey, data);
            hasInitialFetch.current = true;
          })
          .catch((err) => {
            console.error("[useNotifications] Initial fetch error:", err);
            setError(err);
            setIsLoading(false);
          });
      }

      // Setup real-time subscription
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map(fromFirestoreDoc);
          console.log(
            "[useNotifications] Snapshot update:",
            data.length,
            "items"
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
            (err as { code?: string }).code
          );
          setError(err);
          setIsLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error("[useNotifications] Setup error:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to setup Firestore")
      );
      setIsLoading(false);
    }
  }, [queryClient, queryKey]);

  useEffect(() => {
    setupSubscription();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [setupSubscription]);

  const unreadCount = useMemo(
    () => computeUnreadCount(notifications),
    [notifications]
  );

  const refetch = useCallback(() => {
    hasInitialFetch.current = false;
    setupSubscription();
  }, [setupSubscription]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      const previousNotifications = notifications;
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
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
    [notifications]
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
