// apps/backend/src/core/bubble/data-client.ts

export interface BubbleConversation {
  id: string;
  contact: {
    name: string;
    avatar_url: string | null;
  };
  channel: 'whatsapp' | 'sms' | 'email';
  property: {
    id: string;
    name: string;
  };
  last_message: {
    text: string;
    sent_at: string;
  };
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
    cursor: number | null;
    has_more: boolean;
  };
}

export interface GetConversationsOptions {
  bubbleToken: string;
  cursor?: number;
  limit: number;
}

export interface GetMessagesOptions {
  bubbleToken: string;
  cursor?: number;
  limit: number;
}

export interface BubbleDataClient {
  getConversations(options: GetConversationsOptions): Promise<PaginatedResult<BubbleConversation>>;
  getMessages(conversationId: string, options: GetMessagesOptions): Promise<PaginatedResult<BubbleMessage>>;
}

export function createBubbleDataClient(apiUrl: string): BubbleDataClient {
  return {
    async getConversations({ bubbleToken, cursor, limit }) {
      const res = await fetch(`${apiUrl}/hono-my-conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bubbleToken}`,
        },
        body: JSON.stringify({ cursor: cursor ?? 0, limit }),
      });
      if (!res.ok) throw new Error(`Bubble getConversations failed: ${res.status}`);

      const json = await res.json() as {
        status: string;
        response: {
          results: BubbleConversation[];
          pagination: {
            cursor: number;
            count: number;
            remaining: number;
          };
        };
      };

      const { results, pagination } = json.response;

      return {
        data: results,
        pagination: {
          cursor: pagination.remaining > 0 ? pagination.cursor : null,
          has_more: pagination.remaining > 0,
        },
      };
    },

    async getMessages(_conversationId: string, _options: GetMessagesOptions): Promise<PaginatedResult<BubbleMessage>> {
      throw new Error('getMessages workflow not yet configured in Bubble.io');
    },
  };
}
