import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

/**
 * HTTP endpoint to receive OneSignal Event Stream webhooks
 * and create notification documents in Firestore.
 *
 * URL: https://us-central1-sbi-app-c440c.cloudfunctions.net/createNotification
 */
export const createNotificationV2 = onRequest(
  { cors: true, invoker: "public", region: "asia-southeast1" },
  async (req, res) => {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    console.log("Received body:", JSON.stringify(req.body));
    const { title, body, isRead, createdAt, data } = req.body;

    // Extract English text from OneSignal's language object format
    // OneSignal sends: {'en':'the message'} or just a string
    const extractText = (value: unknown): string => {
      if (typeof value === "string") return value;
      if (typeof value === "object" && value !== null && "en" in value) {
        return String((value as Record<string, unknown>).en);
      }
      return "";
    };

    const notification = {
      title: extractText(title),
      body: extractText(body),
      isRead: isRead ?? false,
      createdAt: createdAt ? new Date(createdAt) : FieldValue.serverTimestamp(),
      data: data || null,
    };

    const docRef = await db.collection("notifications").add(notification);

    console.log(`Created notification: ${docRef.id}`);
    res.status(200).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ 
      error: "Failed to create notification",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
