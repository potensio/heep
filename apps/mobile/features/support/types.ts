export type SupportTicketStatus = "open" | "resolved";

export interface SupportTicket {
  id: string;
  contact: { name: string };
  status: SupportTicketStatus;
  last_message: { text: string; sent_at: string };
}
