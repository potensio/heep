import type { BubbleConversation, PaginatedResult } from './data-client';

interface BubbleObjConversation {
  _id: string;
  'AI desactivated'?: boolean;
  'Social media'?: string;
  'First name'?: string;
  Last_name?: string;
  'WhatsApp number formatted'?: string;
  'Profile picture'?: string;
  'Email (client)'?: string;
  'Subject (email)'?: string;
  Last_message_date?: string;
  Restaurant?: string;
  Messages?: string[];
}

interface BubbleObjMessage {
  _id: string;
  Content?: string;
  'Type de message'?: string;
  'Created Date': string;
  Conversation?: string;
  'réponse manuelle?'?: boolean;
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
    { key: 'Type de message', constraint_type: 'not equal', value: 'System' },
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
      text: m.Content ?? '',
      sent_by: m['Type de message'] === 'Bot' ? 'bot' : 'user',
      is_manual_response: m['réponse manuelle?'] ?? false,
      sent_at: m['Created Date'],
    })),
    pagination: {
      cursor: data.response.remaining > 0 ? cursor + data.response.count : null,
      has_more: data.response.remaining > 0,
    },
  };
}

export interface GetConversationsV2Options {
  bubbleToken: string;
  dataUrl: string;
  cursor?: number;
  limit: number;
  messagesLimit: number;
}

export async function getConversationsV2({
  bubbleToken,
  dataUrl,
  cursor = 0,
  limit,
  messagesLimit,
}: GetConversationsV2Options): Promise<PaginatedResult<BubbleConversation>> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bubbleToken}`,
  };

  const convRes = await fetch(
    `${dataUrl}/Conversations?sort_field=Last_message_date&descending=true&limit=${limit}&cursor=${cursor}`,
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
    { key: 'Type de message', constraint_type: 'not equal', value: 'System' },
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
      is_ai_paused: conv['AI desactivated'] ?? false,
      email_subject: conv['Subject (email)'] ?? '',
      channel: normalizeChannel(conv['Social media']),
      contact: {
        name: [conv['First name'], conv.Last_name].filter(Boolean).join(' ')
          || conv['Email (client)']
          || conv['WhatsApp number formatted']
          || '—',
        avatar_url: conv['Profile picture']
          ? conv['Profile picture'].startsWith('//')
            ? `https:${conv['Profile picture']}`
            : conv['Profile picture']
          : null,
        phone: conv['WhatsApp number formatted'] ?? null,
      },
      property: {
        id: conv.Restaurant ?? '',
        name: '',
      },
      last_message: {
        text: lastMsg?.Content ?? '',
        sent_at: conv.Last_message_date ?? '',
      },
      messages: msgs.map((m) => ({
        id: m._id,
        text: m.Content ?? '',
        sent_by: m['Type de message'] === 'Bot' ? 'bot' : 'user',
        is_manual_response: m['réponse manuelle?'] ?? false,
        sent_at: m['Created Date'],
      })),
      messages_pagination: {
        cursor: msgs.length,
        has_more: ((conv.Messages?.length ?? 0) - msgs.length) > 0,
        remaining: Math.max(0, (conv.Messages?.length ?? 0) - msgs.length),
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
