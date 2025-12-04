/**
 * Notification interface representing a notification stored in Firebase Firestore.
 * Used for displaying notifications in the app's notification screen.
 */
export interface Notification {
  /** Firestore document ID */
  id: string;
  /** Notification title */
  title: string;
  /** Notification message body */
  body: string;
  /** Read status (default: false) */
  isRead: boolean;
  /** Timestamp when notification was created */
  createdAt: Date;
  /** Optional additional payload data */
  data?: Record<string, unknown>;
}
