import { getBubbleToken } from '@/features/auth/store/auth.store';

const BUBBLE_API_URL = process.env.EXPO_PUBLIC_BUBBLE_API_URL;

export interface HomepageStats {
  messages_count: number;
  booking_confirmed: number;
  chat_responded: number;
  revenue_with_heep: number;
  credit: number;
  avg_daily_usage: number;
  project_usage: number;
  unfulfilled_request: number;
  most_requested_time: string;
}

// Bubble filters by date using the timezone we send — passing device offset ensures 'today' matches the user's local day.
function getTodayWithDeviceTimezone(): string {
  const now = new Date();
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mo}-${dd}T00:00:00.000${sign}${hh}:${mm}`;
}

export async function fetchHomepageStats(): Promise<HomepageStats | null> {
  const token = await getBubbleToken();
  if (!token) return null;

  const res = await fetch(`${BUBBLE_API_URL}/hono-homepage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ date: getTodayWithDeviceTimezone() }),
  });

  if (!res.ok) throw new Error('Failed to load homepage stats');

  const { response } = await res.json() as { status: string; response: HomepageStats };
  return response;
}
