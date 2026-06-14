export interface SupportTicket {
  id: string;
  restaurant_id: string;
  last_updated: string;
  last_message: { text: string };
}

export interface SupportTicketListResponse {
  data: SupportTicket[];
  pagination: { cursor: number | null; has_more: boolean };
}

export interface SupportMessage {
  id: string;
  text: string;
  /** "user" = the app user (me), "support" = the Heep support team. */
  sent_by: "user" | "support";
  sent_at: string;
}
