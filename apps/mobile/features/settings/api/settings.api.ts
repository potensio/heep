import { getBubbleToken, getAccessToken } from '@/features/auth/store/auth.store';
import { patchProfileApi } from '@/features/auth/api/auth.api';

const BUBBLE_API_URL = process.env.EXPO_PUBLIC_BUBBLE_API_URL;

export interface RestaurantSetting {
  restaurant_id: string;
  restaurant_name: string;
  is_active: boolean;
}

export async function updateAccount(firstName: string, lastName: string): Promise<void> {
  const [bubbleToken, accessToken] = await Promise.all([getBubbleToken(), getAccessToken()]);
  if (!bubbleToken || !accessToken) throw new Error('Not authenticated');

  await Promise.all([
    fetch(`${BUBBLE_API_URL}/hono-settings-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bubbleToken}`,
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update account in Bubble'); }),
    patchProfileApi(accessToken, firstName, lastName),
  ]);
}

export async function fetchNotifications(): Promise<RestaurantSetting[]> {
  const token = await getBubbleToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${BUBBLE_API_URL}/hono-settings-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) throw new Error('Failed to load notifications settings');

  const data = await res.json() as { results: RestaurantSetting[] };
  return data.results;
}

export async function fetchActivation(): Promise<RestaurantSetting[]> {
  const token = await getBubbleToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${BUBBLE_API_URL}/hono-settings-activation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) throw new Error('Failed to load activation settings');

  const data = await res.json() as { results: RestaurantSetting[] };
  return data.results;
}

export async function updateActivation(restaurantId: string, isActivated: boolean): Promise<void> {
  const token = await getBubbleToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${BUBBLE_API_URL}/hono-settings-activation-activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ restaurant_id: restaurantId, is_activated: isActivated }),
  });

  if (!res.ok) throw new Error('Failed to update activation');
}

export async function updateNotificationActivation(restaurantId: string, isActivated: boolean): Promise<void> {
  const token = await getBubbleToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${BUBBLE_API_URL}/hono-settings-notification-activation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ restaurant_id: restaurantId, is_activated: isActivated }),
  });

  if (!res.ok) throw new Error('Failed to update notification setting');
}
