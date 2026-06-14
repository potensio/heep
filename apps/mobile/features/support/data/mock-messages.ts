import type { SupportMessage } from "../types";

/**
 * Placeholder threads while the backend tickets endpoint is wired up.
 * Keyed by ticket id, ordered oldest -> newest. Tickets not listed here fall
 * back to a single message synthesised from their `last_message`.
 */
export const MOCK_MESSAGES: Record<string, SupportMessage[]> = {
  "1": [
    {
      id: "1-1",
      text: "Hi, my order arrived but one of the dishes was missing. Can someone help?",
      sent_by: "user",
      sent_at: "2026-06-14T08:12:00.000Z",
    },
    {
      id: "1-2",
      text: "Hi Olivia, so sorry about that! Could you tell me which dish was missing?",
      sent_by: "support",
      sent_at: "2026-06-14T08:15:00.000Z",
    },
    {
      id: "1-3",
      text: "The green curry. Everything else was there.",
      sent_by: "user",
      sent_at: "2026-06-14T08:16:00.000Z",
    },
    {
      id: "1-4",
      text: "Got it. I've issued a refund for the green curry and added a credit for the trouble. It should land within 3-5 business days.",
      sent_by: "support",
      sent_at: "2026-06-14T08:19:00.000Z",
    },
  ],
  "6": [
    {
      id: "6-1",
      text: "I was charged but never received a confirmation for the refund.",
      sent_by: "user",
      sent_at: "2026-06-12T14:10:00.000Z",
    },
    {
      id: "6-2",
      text: "I can see the refund was processed this morning. It can take a couple of days to show on your statement.",
      sent_by: "support",
      sent_at: "2026-06-12T14:32:00.000Z",
    },
    {
      id: "6-3",
      text: "Thanks, the refund came through. Appreciate the quick help!",
      sent_by: "user",
      sent_at: "2026-06-12T14:40:00.000Z",
    },
  ],
};
