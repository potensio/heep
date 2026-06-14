import { getBubbleToken } from "@/features/auth/store/auth.store";
import type { KnowledgeEntry } from "../types";

const BUBBLE_API_URL = process.env.EXPO_PUBLIC_BUBBLE_API_URL;

interface MemoryResult {
  id: string;
  metadata_text: string;
  pinecone_id: string;
  is_activated: boolean;
}

export async function fetchMemories(
  restaurantId: string,
): Promise<KnowledgeEntry[]> {
  const token = await getBubbleToken();
  if (!token || !restaurantId) return [];

  const res = await fetch(`${BUBBLE_API_URL}/hono-memory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ restaurant_id: restaurantId }),
  });

  if (!res.ok) throw new Error("Failed to load knowledge");

  const { results } = (await res.json()) as { results: MemoryResult[] };
  return results.map((r) => ({
    id: String(r.id),
    text: r.metadata_text ?? "",
    isActivated: r.is_activated,
  }));
}

export async function createMemory(
  restaurantId: string,
  text: string,
): Promise<void> {
  const token = await getBubbleToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BUBBLE_API_URL}/hono-memory-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ restaurant_id: restaurantId, metadata_text: text }),
  });

  if (!res.ok) throw new Error("Failed to create knowledge");
}

export async function deleteMemory(memoryId: string): Promise<void> {
  const token = await getBubbleToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BUBBLE_API_URL}/hono-memory-delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ memory_id: memoryId }),
  });

  if (!res.ok) throw new Error("Failed to delete knowledge");
}
