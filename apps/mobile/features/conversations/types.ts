export type Channel =
  | 'whatsapp'
  | 'sms'
  | 'sms-/-rcs'
  | 'email'
  | 'instagram'
  | 'messenger'
  | 'telegram'
  | 'voice'
  | 'playground'
  | 'heep-copilot'
  | 'imessage';

export interface Message {
  id: string;
  text: string;
  sent_by: 'bot' | 'user';
  is_manual_response: boolean;
  sent_at: string;
}

export interface Conversation {
  id: string;
  is_heep_member: boolean;
  is_ai_paused: boolean;
  email_subject: string;
  contact: { name: string; avatar_url: string | null; phone: string | null };
  channel: Channel;
  property: { id: string; name: string };
  last_message: { text: string; sent_at: string };
  messages: Message[];
  messages_pagination: { cursor: number; has_more: boolean; remaining: number };
}

export interface ConversationListResponse {
  data: Conversation[];
  pagination: { cursor: number | null; has_more: boolean };
}
