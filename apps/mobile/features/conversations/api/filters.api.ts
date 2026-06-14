import { getBubbleToken, getTeamId } from "@/features/auth/store/auth.store";

const BUBBLE_API_URL = process.env.EXPO_PUBLIC_BUBBLE_API_URL;

export interface FilterTag {
  id: string;
  label: string;
}

interface TagResult {
  tag_id: string;
  label: string;
}

export async function fetchFilterTags(): Promise<FilterTag[]> {
  const token = await getBubbleToken();
  const teamId = await getTeamId();
  if (!token || !teamId) return [];

  const res = await fetch(`${BUBBLE_API_URL}/hono-filters-tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ team_id: teamId }),
  });

  if (!res.ok) throw new Error("Failed to load tags");

  const { results } = (await res.json()) as { results: TagResult[] };
  // Some tags come back with an empty label; drop those.
  return results
    .filter((r) => r.label.trim().length > 0)
    .map((r) => ({ id: String(r.tag_id), label: r.label }));
}
