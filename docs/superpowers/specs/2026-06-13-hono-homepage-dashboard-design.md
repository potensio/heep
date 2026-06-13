# Dashboard Homepage API Integration

## Summary

Wire up the `hono-homepage` Bubble endpoint to the dashboard screen, replacing all hardcoded stat values with live data.

## Architecture

Three files:

- `apps/mobile/features/dashboard/api/homepage.api.ts` — new API function
- `apps/mobile/features/dashboard/hooks/use-homepage.ts` — new React Query hook
- `apps/mobile/features/dashboard/screens/dashboard-screen.tsx` — consume hook, replace hardcoded values

Follows the exact same pattern as `locations.api.ts` / `use-locations.ts`.

## Data Flow

1. Hook calls API function after interactions settle (`InteractionManager`)
2. API function gets `bubble_token` via `getBubbleToken()`, POSTs to `EXPO_PUBLIC_BUBBLE_API_URL/hono-homepage` with `{ date }` body
3. `date` = start of today in device timezone: `YYYY-MM-DDT00:00:00.000±HH:MM`, computed from `new Date().getTimezoneOffset()` — no external library needed
4. Response is typed as `HomepageStats`, returned to the screen

## Field Mapping

| Response field       | UI element                          |
|----------------------|-------------------------------------|
| `messages_count`     | Greeting: "Heep has handled X messages" |
| `booking_confirmed`  | Bookings confirmed today            |
| `chat_responded`     | Chats responded                     |
| `revenue_with_heep`  | Revenue with heep                   |
| `credit`             | Credits remaining                   |
| `avg_daily_usage`    | Avg daily usage                     |
| `unfulfilled_request`| Unfulfilled Requests pill           |
| `most_requested_time`| Most Requested Time pill            |

## Error Handling

Follows existing pattern: if `getBubbleToken()` returns null, return null. If fetch fails, throw — React Query handles retry. Screen shows hardcoded fallback (`0` / `-`) while loading.
