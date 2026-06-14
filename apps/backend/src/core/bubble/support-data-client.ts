/**
 * Reads "Ticket Reports" from the Bubble Data API (the user's support tickets).
 * Mirrors data-client-v2 (conversations) but reads a different type and shape.
 *
 * Scoped to the current user via `User = <bubbleUserId>` as a defense-in-depth
 * belt on top of Bubble privacy rules. The list card only needs three fields:
 * restaurant id, last-updated date, and the report text (`detail`).
 */

interface BubbleObjTicketReport {
  _id: string;
  restaurant?: string;
  detail?: string;
  'Modified Date'?: string;
}

interface BubbleObjResponse<T> {
  response: {
    results: T[];
    count: number;
    remaining: number;
    cursor: number;
  };
}

export interface SupportTicketSummary {
  id: string;
  restaurant_id: string;
  last_updated: string;
  last_message: { text: string };
}

export interface SupportTicketPage {
  data: SupportTicketSummary[];
  pagination: { cursor: number | null; has_more: boolean };
}

export interface GetSupportTicketsOptions {
  bubbleToken: string;
  dataUrl: string;
  bubbleUserId: string;
  cursor?: number;
  limit: number;
}

export async function getSupportTickets({
  bubbleToken,
  dataUrl,
  bubbleUserId,
  cursor = 0,
  limit,
}: GetSupportTicketsOptions): Promise<SupportTicketPage> {
  const constraints = encodeURIComponent(
    JSON.stringify([{ key: 'User', constraint_type: 'equals', value: bubbleUserId }]),
  );
  const res = await fetch(
    `${dataUrl}/${encodeURIComponent('Ticket Reports')}?constraints=${constraints}&sort_field=Modified+Date&descending=true&cursor=${cursor}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${bubbleToken}` } },
  );
  if (!res.ok) throw new Error(`Bubble Ticket Reports fetch failed: ${res.status}`);
  const data = (await res.json()) as BubbleObjResponse<BubbleObjTicketReport>;

  return {
    data: data.response.results.map((t) => ({
      id: t._id,
      restaurant_id: t.restaurant ?? '',
      last_updated: t['Modified Date'] ?? '',
      last_message: { text: t.detail ?? '' },
    })),
    pagination: {
      cursor: data.response.remaining > 0 ? cursor + data.response.count : null,
      has_more: data.response.remaining > 0,
    },
  };
}
