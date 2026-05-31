import type { Location } from '@/lib/types';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';
const BASE = 'https://maps.googleapis.com/maps/api/place';

export interface PlaceSuggestion {
  name: string;
  placeId: string;
}

export async function searchCities(query: string): Promise<PlaceSuggestion[]> {
  if (query.length < 2) return [];
  const url =
    `${BASE}/autocomplete/json` +
    `?input=${encodeURIComponent(query)}` +
    `&types=(cities)` +
    `&components=country:id` +
    `&language=id` +
    `&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    status: string;
    predictions: Array<{
      place_id: string;
      structured_formatting: { main_text: string };
    }>;
  };
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];
  return (data.predictions ?? []).map((p) => ({
    name: p.structured_formatting.main_text,
    placeId: p.place_id,
  }));
}

export async function getCityLocation(placeId: string, name: string): Promise<Location> {
  const url =
    `${BASE}/details/json` +
    `?place_id=${placeId}` +
    `&fields=geometry` +
    `&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Places API error: ${res.status}`);
  const data = (await res.json()) as {
    status: string;
    result: { geometry?: { location: { lat: number; lng: number } } };
  };
  if (data.status !== 'OK') throw new Error(`Places Details API: ${data.status}`);
  const coords = data.result?.geometry?.location;
  if (!coords) throw new Error(`No geometry for place: ${placeId}`);
  return { name, placeId, lat: coords.lat, lng: coords.lng };
}
