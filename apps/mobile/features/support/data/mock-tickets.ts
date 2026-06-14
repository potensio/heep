import type { SupportTicket } from "../types";

/** Placeholder data while the backend tickets endpoint is wired up. */
export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "1",
    contact: { name: "Olivia Bennett" },
    status: "open",
    last_message: {
      text: "My order arrived but one of the dishes was missing. Can someone help?",
      sent_at: "2026-06-14T08:12:00.000Z",
    },
  },
  {
    id: "2",
    contact: { name: "Marcus Lim" },
    status: "open",
    last_message: {
      text: "I was charged twice for my reservation deposit.",
      sent_at: "2026-06-13T19:45:00.000Z",
    },
  },
  {
    id: "3",
    contact: { name: "Sofia Alvarez" },
    status: "open",
    last_message: {
      text: "The table I booked for tonight isn't showing in my confirmation email.",
      sent_at: "2026-06-13T16:30:00.000Z",
    },
  },
  {
    id: "4",
    contact: { name: "Daniel Kim" },
    status: "open",
    last_message: {
      text: "Can I change my booking from 4 people to 6? It won't let me edit.",
      sent_at: "2026-06-13T11:05:00.000Z",
    },
  },
  {
    id: "5",
    contact: { name: "Emma Thompson" },
    status: "open",
    last_message: {
      text: "The delivery driver never showed up and the app says completed.",
      sent_at: "2026-06-12T20:18:00.000Z",
    },
  },
  {
    id: "6",
    contact: { name: "Liam O'Connor" },
    status: "resolved",
    last_message: {
      text: "Thanks, the refund came through. Appreciate the quick help!",
      sent_at: "2026-06-12T14:40:00.000Z",
    },
  },
  {
    id: "7",
    contact: { name: "Aisha Rahman" },
    status: "open",
    last_message: {
      text: "I have a severe nut allergy — can you confirm the pad thai is safe?",
      sent_at: "2026-06-12T12:02:00.000Z",
    },
  },
  {
    id: "8",
    contact: { name: "Noah Williams" },
    status: "open",
    last_message: {
      text: "My loyalty points didn't apply to the last order.",
      sent_at: "2026-06-11T18:55:00.000Z",
    },
  },
  {
    id: "9",
    contact: { name: "Isabella Rossi" },
    status: "resolved",
    last_message: {
      text: "All sorted now, the new reservation time works perfectly.",
      sent_at: "2026-06-11T09:30:00.000Z",
    },
  },
  {
    id: "10",
    contact: { name: "Ethan Walker" },
    status: "open",
    last_message: {
      text: "The promo code SUMMER20 says expired but the banner still shows it.",
      sent_at: "2026-06-10T21:14:00.000Z",
    },
  },
  {
    id: "11",
    contact: { name: "Mia Nakamura" },
    status: "open",
    last_message: {
      text: "Food arrived cold and the soup had leaked all over the bag.",
      sent_at: "2026-06-10T19:47:00.000Z",
    },
  },
  {
    id: "12",
    contact: { name: "James Carter" },
    status: "resolved",
    last_message: {
      text: "Got the replacement order, thank you for sorting it so fast.",
      sent_at: "2026-06-10T13:08:00.000Z",
    },
  },
  {
    id: "13",
    contact: { name: "Chloe Dubois" },
    status: "open",
    last_message: {
      text: "I'd like to cancel my reservation for Friday — how do I get the deposit back?",
      sent_at: "2026-06-09T17:22:00.000Z",
    },
  },
  {
    id: "14",
    contact: { name: "Lucas Martins" },
    status: "open",
    last_message: {
      text: "The app keeps crashing when I try to add a tip at checkout.",
      sent_at: "2026-06-09T15:00:00.000Z",
    },
  },
  {
    id: "15",
    contact: { name: "Hannah Schmidt" },
    status: "resolved",
    last_message: {
      text: "Perfect, the gift card balance is correct now. Cheers!",
      sent_at: "2026-06-08T11:36:00.000Z",
    },
  },
  {
    id: "16",
    contact: { name: "Ravi Patel" },
    status: "open",
    last_message: {
      text: "Can I get an invoice with my company details for last week's dinner?",
      sent_at: "2026-06-08T10:12:00.000Z",
    },
  },
  {
    id: "17",
    contact: { name: "Grace Lee" },
    status: "open",
    last_message: {
      text: "I left my jacket at the table last night — has anyone handed it in?",
      sent_at: "2026-06-07T22:40:00.000Z",
    },
  },
  {
    id: "18",
    contact: { name: "Tomás García" },
    status: "resolved",
    last_message: {
      text: "Thanks for confirming the high chair — see you Saturday.",
      sent_at: "2026-06-07T14:18:00.000Z",
    },
  },
  {
    id: "19",
    contact: { name: "Zoe Anderson" },
    status: "open",
    last_message: {
      text: "Why was my booking auto-cancelled? I never got a notification.",
      sent_at: "2026-06-06T20:05:00.000Z",
    },
  },
  {
    id: "20",
    contact: { name: "Oliver Brown" },
    status: "resolved",
    last_message: {
      text: "Resolved — the duplicate charge dropped off my statement. Thanks!",
      sent_at: "2026-06-06T09:50:00.000Z",
    },
  },
];
