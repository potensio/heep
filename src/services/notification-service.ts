import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  DocumentSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Notification } from "@/src/types/notification";

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Convert a Firestore document to a Notification object.
 * Handles missing fields with sensible defaults.
 *
 * @param doc - Firestore document snapshot
 * @returns Notification object with all fields populated
 */
export function fromFirestoreDoc(doc: DocumentSnapshot): Notification {
  const data = doc.data();

  if (!data) {
    // Return a default notification if document has no data
    return {
      id: doc.id,
      title: "",
      body: "",
      isRead: false,
      createdAt: new Date(),
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

  // Extract nested data fields
  const nestedData =
    data.data && typeof data.data === "object" ? data.data : {};

  return {
    id: doc.id,
    title: typeof data.title === "string" ? data.title : "",
    body: typeof data.body === "string" ? data.body : "",
    isRead: typeof data.isRead === "boolean" ? data.isRead : false,
    createdAt,
    url: typeof nestedData.url === "string" ? nestedData.url : undefined,
    subscriptionId:
      typeof nestedData.subscriptionId === "string"
        ? nestedData.subscriptionId
        : undefined,
  };
}

/**
 * Fetch all notifications from Firestore, ordered by createdAt descending (newest first).
 *
 * @returns Promise resolving to array of Notification objects
 */
export async function getNotifications(): Promise<Notification[]> {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

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
): Unsubscribe {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map(fromFirestoreDoc);
      callback(notifications);
    },
    () => {
      // Error handled silently - subscription will retry automatically
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
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(docRef, { isRead: true });
}
