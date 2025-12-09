/**
 * Hooks barrel export file.
 * Centralizes all hook exports for cleaner imports throughout the app.
 *
 * Requirements: 6.3 - Place TanStack Query hooks in a dedicated hooks directory
 */

// Notification hooks (TanStack Query)
export {
  useNotifications,
  computeUnreadCount,
  type UseNotificationsReturn,
} from "./use-notifications";
export { useMarkAsRead, type UseMarkAsReadReturn } from "./use-mark-as-read";
export { useFirestoreSubscription } from "./use-firestore-subscription";

// Theme hooks
export { useColorScheme } from "./use-color-scheme";
export { useThemeColor } from "./use-theme-color";

// Notification preference hook
export {
  useNotificationPreference,
  type UseNotificationPreferenceReturn,
} from "./use-notification-preference";
