import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { Notification } from "@/types/notification";

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Convert a Firestore document to a Notification object.
 * Handles missing fields with sensible defaults.
 *
 * @param doc - Firestore document snapshot
 * @returns Notification object with all fields populated
 */
export function fromFirestoreDoc(
  doc: FirebaseFirestoreTypes.DocumentSnapshot
): Notification {
  const data = doc.data();

  if (!data) {
    // Return a default notification if document has no data
    return {
      id: doc.id,
      title: "",
      body: "",
      isRead: false,
      createdAt: new Date(),
      data: undefined,
    };
  }

  // Handle createdAt - could be Firestore Timestamp, string, or missing
  let createdAt: Date;
  if (data.createdAt) {
    if (typeof data.createdAt.toDate === "function") {
      // Firestore Timestamp
      createdAt = data.createdAt.toDate();
    } else if (typeof data.createdAt === "string") {
      // ISO string
      createdAt = new Date(data.createdAt);
    } else if (data.createdAt instanceof Date) {
      createdAt = data.createdAt;
    } else {
      createdAt = new Date();
    }
  } else {
    createdAt = new Date();
  }

  return {
    id: doc.id,
    title: typeof data.title === "string" ? data.title : "",
    body: typeof data.body === "string" ? data.body : "",
    isRead: typeof data.isRead === "boolean" ? data.isRead : false,
    createdAt,
    data: data.data && typeof data.data === "object" ? data.data : undefined,
  };
}

/**
 * Fetch all notifications from Firestore, ordered by createdAt descending (newest first).
 *
 * @returns Promise resolving to array of Notification objects
 */
export async function getNotifications(): Promise<Notification[]> {
  const snapshot = await firestore()
    .collection(NOTIFICATIONS_COLLECTION)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(fromFirestoreDoc);
}

/**
 * Subscribe to real-time updates from the notifications collection.
 * Notifications are ordered by createdAt descending (newest first).
 *
 * @param callback - Function called with updated notifications array whenever data changes
 * @returns Unsubscribe function to stop listening for updates
 */
export function subscribeToNotifications(
  callback: (notifications: Notification[]) => void
): () => void {
  const unsubscribe = firestore()
    .collection(NOTIFICATIONS_COLLECTION)
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        const notifications = snapshot.docs.map(fromFirestoreDoc);
        callback(notifications);
      },
      (error) => {
        console.error("Error subscribing to notifications:", error);
      }
    );

  return unsubscribe;
}

/**
 * Mark a notification as read by updating its isRead field to true in Firestore.
 *
 * @param notificationId - The Firestore document ID of the notification to mark as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await firestore()
    .collection(NOTIFICATIONS_COLLECTION)
    .doc(notificationId)
    .update({ isRead: true });
}
