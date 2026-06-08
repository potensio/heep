// apps/backend/src/core/bubble/data-client.ts

export interface BubbleContact {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
}

export interface BubbleConversation {
  id: string;
  contact: BubbleContact;
  channel: 'whatsapp' | 'sms' | 'email';
  property_id: string;
  property_name: string;
  last_message_text: string;
  last_message_sent_at: string;
  unread_count: number;
  updated_at: string;
}

export interface BubbleMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  sent_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    has_more: boolean;
  };
}

export interface GetConversationsOptions {
  bubbleUserId: string;
  cursor?: string;
  limit: number;
  propertyId?: string;
  q?: string;
}

export interface GetMessagesOptions {
  cursor?: string;
  limit: number;
}

export interface BubbleDataClient {
  getConversations(options: GetConversationsOptions): Promise<PaginatedResult<BubbleConversation>>;
  getMessages(conversationId: string, options: GetMessagesOptions): Promise<PaginatedResult<BubbleMessage>>;
}

export function createBubbleDataClient(dataUrl: string, apiKey: string): BubbleDataClient {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  return {
    async getConversations({ bubbleUserId, cursor, limit, propertyId, q }) {
      const constraints: object[] = [
        { key: 'Host', constraint_type: 'equals', value: bubbleUserId },
      ];
      if (propertyId) {
        constraints.push({ key: 'Property', constraint_type: 'equals', value: propertyId });
      }
      if (q) {
        constraints.push({ key: 'Contact Name', constraint_type: 'contains', value: q });
      }

      const params = new URLSearchParams({
        limit: String(limit),
        sort_field: 'Modified Date',
        descending: 'true',
        constraints: JSON.stringify(constraints),
      });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${dataUrl}/conversation?${params}`, { headers });
      if (!res.ok) throw new Error(`Bubble getConversations failed: ${res.status}`);

      const json = await res.json() as {
        response: {
          results: Record<string, unknown>[];
          cursor: number;
          count: number;
          remaining: number;
        };
      };

      const { results, cursor: nextCursor, remaining } = json.response;

      return {
        data: results.map(mapConversation),
        pagination: {
          cursor: remaining > 0 ? String(nextCursor) : null,
          has_more: remaining > 0,
        },
      };
    },

    async getMessages(conversationId, { cursor, limit }) {
      const constraints = [
        { key: 'Conversation', constraint_type: 'equals', value: conversationId },
      ];

      const params = new URLSearchParams({
        limit: String(limit),
        sort_field: 'Created Date',
        descending: 'false',
        constraints: JSON.stringify(constraints),
      });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${dataUrl}/message?${params}`, { headers });
      if (!res.ok) throw new Error(`Bubble getMessages failed: ${res.status}`);

      const json = await res.json() as {
        response: {
          results: Record<string, unknown>[];
          cursor: number;
          remaining: number;
        };
      };

      const { results, cursor: nextCursor, remaining } = json.response;

      return {
        data: results.map(mapMessage),
        pagination: {
          cursor: remaining > 0 ? String(nextCursor) : null,
          has_more: remaining > 0,
        },
      };
    },
  };
}

// ─── Field mapping ──────────────────────────────────────────────────────────
// These field names match Bubble.io's data type field labels.
// Update if the actual Bubble field names differ.

function mapConversation(raw: Record<string, unknown>): BubbleConversation {
  return {
    id: raw._id as string,
    contact: {
      id: ((raw['Contact'] as Record<string, unknown>)?._id as string) ?? '',
      name: (raw['Contact Name'] as string) ?? '',
      phone: (raw['Contact Phone'] as string) ?? '',
      avatar_url: (raw['Contact Avatar'] as string | null) ?? null,
    },
    channel: (raw['Channel'] as 'whatsapp' | 'sms' | 'email') ?? 'whatsapp',
    property_id: ((raw['Property'] as Record<string, unknown>)?._id as string) ?? '',
    property_name: (raw['Property Name'] as string) ?? '',
    last_message_text: (raw['Last Message Text'] as string) ?? '',
    last_message_sent_at: (raw['Last Message Date'] as string) ?? (raw['Modified Date'] as string),
    unread_count: Number((raw['Unread Count'] as number | undefined) ?? 0),
    updated_at: raw['Modified Date'] as string,
  };
}

function mapMessage(raw: Record<string, unknown>): BubbleMessage {
  return {
    id: raw._id as string,
    text: (raw['Text'] as string) ?? '',
    sender: (raw['Direction'] as string) === 'outbound' ? 'me' : 'them',
    sent_at: raw['Created Date'] as string,
  };
}
