import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Notification } from "@/types/notification";
import {
  subscribeToNotifications,
  markAsRead as markAsReadService,
} from "@/services/notification-service";

/**
 * NotificationContext type definition.
 * Provides notifications state and actions for the app.
 */
interface NotificationContextType {
  /** Array of notifications from Firestore */
  notifications: Notification[];
  /** Count of unread notifications (isRead === false) */
  unreadCount: number;
  /** Loading state while fetching notifications */
  loading: boolean;
  /** Error state if fetching fails */
  error: Error | null;
  /** Mark a notification as read by ID */
  markAsRead: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * NotificationProvider component.
 * Subscribes to Firestore notifications on mount and provides state to children.
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to Firestore notifications on mount
  // Use a small delay to ensure Firebase is fully initialized
  useEffect(() => {
    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    // Delay subscription to allow Firebase to fully initialize
    const timeoutId = setTimeout(() => {
      if (!isMounted) return;

      try {
        unsubscribe = subscribeToNotifications((updatedNotifications) => {
          if (isMounted) {
            setNotifications(updatedNotifications);
            setLoading(false);
          }
        });
      } catch (err) {
        console.warn("Firebase subscription failed:", err);
        if (isMounted) {
          setLoading(false);
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to connect to Firebase")
          );
        }
      }
    }, 500); // 500ms delay untuk tunggu Firebase ready

    // Cleanup: unsubscribe on unmount
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Calculate unread count from notifications where isRead is false
  // Requirements 3.3: Unread count equals count of notifications where isRead is false
  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.isRead).length;
  }, [notifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadService(notificationId);
      // Note: The real-time subscription will automatically update the notifications state
    } catch (err) {
      console.error("Error marking notification as read:", err);
      throw err;
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access the NotificationContext.
 * Must be used within a NotificationProvider.
 */
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
