import type { BubbleConversation, PaginatedResult } from './data-client';

interface BubbleObjConversation {
  _id: string;
  is_ai_disabled?: boolean;
  social_media?: string;
  first_name?: string;
  last_name?: string;
  whatsapp_number_formatted?: string;
  profile_picture?: string;
  email_client?: string;
  email_subject?: string;
  last_message_date?: string;
  restaurant?: string;
  messages?: string[];
}

interface BubbleObjMessage {
  _id: string;
  content?: string;
  message_type?: string;
  'Created Date': string;
  Conversation?: string;
  is_manual_response?: boolean;
}

interface BubbleObjResponse<T> {
  response: {
    results: T[];
    count: number;
    remaining: number;
    cursor: number;
  };
}

function normalizeChannel(raw: string | undefined): BubbleConversation['channel'] {
  const map: Record<string, BubbleConversation['channel']> = {
    'whatsapp': 'whatsapp',
    'sms': 'sms',
    'sms / rcs': 'sms-/-rcs',
    'email': 'email',
    'instagram': 'instagram',
    'messenger': 'messenger',
    'telegram': 'telegram',
    'voice': 'voice',
    'playground': 'playground',
    'heep copilot': 'heep-copilot',
    'imessage': 'imessage',
  };
  return map[(raw ?? '').toLowerCase()] ?? 'whatsapp';
}

export interface GetConversationMessagesOptions {
  bubbleToken: string;
  dataUrl: string;
  conversationId: string;
  cursor: number;
  limit: number;
}

export interface MessagePage {
  data: Array<{
    id: string;
    text: string;
    sent_by: 'bot' | 'user';
    is_manual_response: boolean;
    sent_at: string;
  }>;
  pagination: { cursor: number | null; has_more: boolean };
}

export async function getConversationMessages({
  bubbleToken,
  dataUrl,
  conversationId,
  cursor,
  limit,
}: GetConversationMessagesOptions): Promise<MessagePage> {
  const constraints = encodeURIComponent(JSON.stringify([
    { key: 'Conversation', constraint_type: 'equals', value: conversationId },
    { key: 'message_type', constraint_type: 'not equal', value: 'System' },
  ]));
  const res = await fetch(
    `${dataUrl}/Messages?constraints=${constraints}&sort_field=Created+Date&descending=true&cursor=${cursor}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${bubbleToken}` } },
  );
  if (!res.ok) throw new Error(`Bubble Messages fetch failed: ${res.status}`);
  const data = await res.json() as BubbleObjResponse<BubbleObjMessage>;

  return {
    data: data.response.results.map((m) => ({
      id: m._id,
      text: m.content ?? '',
      sent_by: m.message_type === 'Bot' ? 'bot' : 'user',
      is_manual_response: m.is_manual_response ?? false,
      sent_at: m['Created Date'],
    })),
    pagination: {
      cursor: data.response.remaining > 0 ? cursor + data.response.count : null,
      has_more: data.response.remaining > 0,
    },
  };
}

export interface ConversationFilters {
  /** Scope to one restaurant (selected location). */
  restaurantId?: string;
  /** social_media values (match any). */
  platform?: string[];
  /** priority_status values (match any). */
  priority?: string[];
  /** conversation_tags ids (must have all). */
  tags?: string[];
  isSpam?: boolean;
  isArchived?: boolean;
  /** Free-text search over message content (last 90 days, non-System). */
  search?: string;
}

/** Window for message-content search, in days. */
const SEARCH_WINDOW_DAYS = 90;
/** Max matching messages scanned to collect conversation ids per search. */
const SEARCH_MESSAGE_LIMIT = 100;

/**
 * Finds conversation ids whose recent (<=90d), non-System messages contain the
 * query. Scoped by restaurant when provided. Returns at most ~SEARCH_MESSAGE_LIMIT
 * conversations (the most recent matches) — keeps the Data API query fast.
 */
async function searchConversationIdsByMessage(opts: {
  bubbleToken: string;
  dataUrl: string;
  query: string;
  restaurantId?: string;
  now: number;
}): Promise<Map<string, string>> {
  const since = new Date(opts.now - SEARCH_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const constraints: BubbleConstraint[] = [];
  if (opts.restaurantId) {
    constraints.push({ key: 'Restaurant', constraint_type: 'equals', value: opts.restaurantId });
  }
  constraints.push(
    { key: 'message_type', constraint_type: 'not equal', value: 'System' },
    { key: 'Created Date', constraint_type: 'greater than', value: since },
    { key: 'content', constraint_type: 'text contains', value: opts.query },
  );

  const enc = encodeURIComponent(JSON.stringify(constraints));
  const res = await fetch(
    `${opts.dataUrl}/Messages?constraints=${enc}&sort_field=Created+Date&descending=true&limit=${SEARCH_MESSAGE_LIMIT}`,
    { headers: { Authorization: `Bearer ${opts.bubbleToken}` } },
  );
  if (!res.ok) throw new Error(`Bubble message search failed: ${res.status}`);
  const data = await res.json() as BubbleObjResponse<BubbleObjMessage>;

  // Insertion order = most-recent first (sorted desc). Keep the first
  // (newest) matching message per conversation as the snippet.
  const matches = new Map<string, string>();
  for (const m of data.response.results) {
    if (m.Conversation && !matches.has(m.Conversation)) {
      matches.set(m.Conversation, m.content ?? '');
    }
  }
  return matches;
}

type BubbleConstraint = {
  key: string;
  constraint_type: string;
  value?: unknown;
};

/** Builds Bubble Data API constraints for the Conversations query from filters. */
function buildConversationConstraints(f: ConversationFilters): BubbleConstraint[] {
  const constraints: BubbleConstraint[] = [];
  if (f.restaurantId) {
    constraints.push({ key: 'restaurant', constraint_type: 'equals', value: f.restaurantId });
  }
  if (f.platform?.length) {
    constraints.push({ key: 'social_media', constraint_type: 'in', value: f.platform });
  }
  if (f.priority?.length) {
    constraints.push({ key: 'priority_status', constraint_type: 'in', value: f.priority });
  }
  if (f.isSpam) {
    constraints.push({ key: 'is_spam', constraint_type: 'equals', value: true });
  }
  if (f.isArchived) {
    constraints.push({ key: 'is_archived', constraint_type: 'equals', value: true });
  }
  // conversation_tags is a list; `contains` takes a single id. Multiple tags ->
  // multiple contains = conversation must have ALL selected tags (AND).
  for (const tagId of f.tags ?? []) {
    constraints.push({ key: 'conversation_tags', constraint_type: 'contains', value: tagId });
  }
  return constraints;
}

export interface GetConversationsV2Options {
  bubbleToken: string;
  dataUrl: string;
  cursor?: number;
  limit: number;
  messagesLimit: number;
  filters?: ConversationFilters;
}

export async function getConversationsV2({
  bubbleToken,
  dataUrl,
  cursor = 0,
  limit,
  messagesLimit,
  filters = {},
}: GetConversationsV2Options): Promise<PaginatedResult<BubbleConversation>> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bubbleToken}`,
  };

  const convConstraints = buildConversationConstraints(filters);

  // Free-text search: resolve matching conversation ids from message content,
  // then constrain the list to those ids (combined with any active filters).
  let searchMatches: Map<string, string> | null = null;
  if (filters.search) {
    searchMatches = await searchConversationIdsByMessage({
      bubbleToken,
      dataUrl,
      query: filters.search,
      restaurantId: filters.restaurantId,
      now: Date.now(),
    });
    const ids = [...searchMatches.keys()];
    if (ids.length === 0) {
      return { data: [], pagination: { cursor: null, has_more: false } };
    }
    convConstraints.push({ key: '_id', constraint_type: 'in', value: ids });
  }

  const constraintsParam = convConstraints.length
    ? `&constraints=${encodeURIComponent(JSON.stringify(convConstraints))}`
    : '';

  const convRes = await fetch(
    `${dataUrl}/Conversations?sort_field=last_message_date&descending=true&limit=${limit}&cursor=${cursor}${constraintsParam}`,
    { headers },
  );
  if (!convRes.ok) throw new Error(`Bubble Conversations fetch failed: ${convRes.status}`);
  const convData = await convRes.json() as BubbleObjResponse<BubbleObjConversation>;

  const convIds = convData.response.results.map((c) => c._id);
  if (convIds.length === 0) {
    return { data: [], pagination: { cursor: null, has_more: false } };
  }

  const msgConstraints = encodeURIComponent(JSON.stringify([
    { key: 'Conversation', constraint_type: 'in', value: convIds },
    { key: 'message_type', constraint_type: 'not equal', value: 'System' },
  ]));
  const msgRes = await fetch(
    `${dataUrl}/Messages?constraints=${msgConstraints}&sort_field=Created+Date&descending=true&limit=${convIds.length * messagesLimit}`,
    { headers },
  );
  if (!msgRes.ok) throw new Error(`Bubble Messages fetch failed: ${msgRes.status}`);
  const msgData = await msgRes.json() as BubbleObjResponse<BubbleObjMessage>;

  // Group messages by conversation, exclude System messages
  const msgsByConv = new Map<string, BubbleObjMessage[]>();
  for (const msg of msgData.response.results) {
    if (!msg.Conversation) continue;
    const list = msgsByConv.get(msg.Conversation) ?? [];
    list.push(msg);
    msgsByConv.set(msg.Conversation, list);
  }

  const conversations: BubbleConversation[] = convData.response.results.map((conv) => {
    const msgs = (msgsByConv.get(conv._id) ?? []).slice(0, messagesLimit);
    const lastMsg = msgs[0];

    return {
      id: conv._id,
      is_heep_member: false,
      is_ai_paused: conv.is_ai_disabled ?? false,
      email_subject: conv.email_subject ?? '',
      channel: normalizeChannel(conv.social_media),
      contact: {
        name: [conv.first_name, conv.last_name].filter(Boolean).join(' ')
          || conv.email_client
          || conv.whatsapp_number_formatted
          || '—',
        avatar_url: conv.profile_picture
          ? conv.profile_picture.startsWith('//')
            ? `https:${conv.profile_picture}`
            : conv.profile_picture
          : null,
        phone: conv.whatsapp_number_formatted ?? null,
      },
      property: {
        id: conv.restaurant ?? '',
        name: '',
      },
      last_message: {
        text: lastMsg?.content ?? '',
        sent_at: conv.last_message_date ?? '',
      },
      search_match: searchMatches?.get(conv._id),
      messages: msgs.map((m) => ({
        id: m._id,
        text: m.content ?? '',
        sent_by: m.message_type === 'Bot' ? 'bot' : 'user',
        is_manual_response: m.is_manual_response ?? false,
        sent_at: m['Created Date'],
      })),
      messages_pagination: {
        cursor: msgs.length,
        has_more: ((conv.messages?.length ?? 0) - msgs.length) > 0,
        remaining: Math.max(0, (conv.messages?.length ?? 0) - msgs.length),
      },
    };
  });

  return {
    data: conversations,
    pagination: {
      cursor: convData.response.remaining > 0 ? cursor + convData.response.count : null,
      has_more: convData.response.remaining > 0,
    },
  };
}
