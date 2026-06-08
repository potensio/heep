import { getBubbleToken } from '@/features/auth/store/auth.store';
import type { Location } from '../types';

const BUBBLE_API_URL = process.env.EXPO_PUBLIC_BUBBLE_API_URL;

export async function fetchLocations(): Promise<Location[]> {
  const token = await getBubbleToken();
  if (!token) return [];

  const res = await fetch(`${BUBBLE_API_URL}/hono-restaurants`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to load locations');

  const { results } = await res.json() as { results: Array<{ id: string; name: string }> };
  return results.map((r) => ({ id: String(r.id), name: r.name }));
}
