export interface BubbleMessage {
  id: string;
  text: string;
  sent_by: 'bot' | 'user';
  is_manual_response: boolean;
  sent_at: string;
}

export interface BubbleConversation {
  id: string;
  is_heep_member: boolean;
  is_ai_paused: boolean;
  email_subject: string;
  contact: {
    name: string;
    avatar_url: string | null;
    phone: string | null;
  };
  channel: 'whatsapp' | 'sms' | 'sms-/-rcs' | 'email' | 'instagram' | 'messenger' | 'telegram' | 'voice' | 'playground' | 'heep-copilot' | 'imessage';
  property: {
    id: string;
    name: string;
  };
  last_message: {
    text: string;
    sent_at: string;
  };
  /** When the list came from a message-content search, the matching message
   *  snippet (so the card can show why this conversation matched). */
  search_match?: string;
  messages: BubbleMessage[];
  messages_pagination: {
    cursor: number;
    has_more: boolean;
    remaining: number;
  };
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
  messagesLimit?: number;
}

export interface BubbleDataClient {
  getConversations(options: GetConversationsOptions): Promise<PaginatedResult<BubbleConversation>>;
}

export function createBubbleDataClient(apiUrl: string): BubbleDataClient {
  return {
    async getConversations({ bubbleToken, cursor, limit, messagesLimit = 20 }) {
      const res = await fetch(`${apiUrl}/hono-my-conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bubbleToken}`,
        },
        body: JSON.stringify({ cursor: cursor ?? 0, limit, messages_limit: messagesLimit }),
      });
      if (!res.ok) throw new Error(`Bubble getConversations failed: ${res.status}`);

      const { results, pagination } = await res.json() as { results: BubbleConversation[]; pagination: { cursor: number; count: number; remaining: number } };

      return {
        data: results.map((conv) => ({
          ...conv,
          messages_pagination: {
            ...conv.messages_pagination,
            cursor: conv.messages_pagination.cursor + conv.messages.length,
          },
        })),
        pagination: {
          cursor: pagination.remaining > 0 ? pagination.cursor + pagination.count : null,
          has_more: pagination.remaining > 0,
        },
      };
    },
  };
}
