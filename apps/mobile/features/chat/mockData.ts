import type { Conversation, Message } from '@/lib/types';

const hoursAgo = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const messagesConversation1: Message[] = [
  {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'user2',
    text: 'Halo kak, apakah stok masih ada?',
    timestamp: hoursAgo(3),
    isRead: true,
  },
  {
    id: 'm2',
    conversationId: 'c1',
    senderId: 'user1',
    text: 'Halo! Masih ada kak, mau yang warna apa?',
    timestamp: hoursAgo(2),
    isRead: true,
  },
  {
    id: 'm3',
    conversationId: 'c1',
    senderId: 'user2',
    text: 'Yang warna hitam kak, bisa COD?',
    timestamp: hoursAgo(1),
    isRead: false,
  },
];

const messagesConversation2: Message[] = [
  {
    id: 'm4',
    conversationId: 'c2',
    senderId: 'user3',
    text: 'Min, harga bisa nego nggak?',
    timestamp: daysAgo(1),
    isRead: true,
  },
  {
    id: 'm5',
    conversationId: 'c2',
    senderId: 'user1',
    text: 'Bisa dikit kak, berminat?',
    timestamp: daysAgo(1),
    isRead: true,
  },
  {
    id: 'm6',
    conversationId: 'c2',
    senderId: 'user3',
    image: 'https://picsum.photos/seed/chatimg1/400/300',
    timestamp: daysAgo(1),
    isRead: true,
  },
];

const messagesConversation3: Message[] = [
  {
    id: 'm7',
    conversationId: 'c3',
    senderId: 'user4',
    text: 'Terima kasih kak, barang sudah sampai dengan baik!',
    timestamp: daysAgo(3),
    isRead: true,
  },
  {
    id: 'm8',
    conversationId: 'c3',
    senderId: 'user1',
    text: 'Sama-sama kak! Senang bisa membantu',
    timestamp: daysAgo(3),
    isRead: true,
  },
];

const messagesConversation4: Message[] = [
  {
    id: 'm9',
    conversationId: 'c4',
    senderId: 'user5',
    text: 'Kak, ukuran L masih ada?',
    timestamp: hoursAgo(5),
    isRead: false,
  },
  {
    id: 'm10',
    conversationId: 'c4',
    senderId: 'user5',
    text: 'Aku mau order 2 pcs',
    timestamp: hoursAgo(5),
    isRead: false,
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    otherUser: { id: 'user2', name: 'Budi Santoso' },
    product: {
      id: 'p1',
      name: 'Sepatu Sneakers Pria - Premium Quality',
      price: 450000,
      image: 'https://picsum.photos/seed/product1/200/200',
    },
    lastMessage: messagesConversation1[messagesConversation1.length - 1],
    unreadCount: 1,
    updatedAt: hoursAgo(1),
  },
  {
    id: 'c4',
    otherUser: { id: 'user5', name: 'Dewi Lestari' },
    product: {
      id: 'p4',
      name: 'Kaos Polos Premium Cotton',
      price: 85000,
      image: 'https://picsum.photos/seed/product4/200/200',
    },
    lastMessage: messagesConversation4[messagesConversation4.length - 1],
    unreadCount: 2,
    updatedAt: hoursAgo(5),
  },
  {
    id: 'c2',
    otherUser: { id: 'user3', name: 'Siti Rahayu' },
    product: {
      id: 'p2',
      name: 'Tas Ransel Waterproof',
      price: 275000,
      image: 'https://picsum.photos/seed/product2/200/200',
    },
    lastMessage: messagesConversation2[messagesConversation2.length - 1],
    unreadCount: 0,
    updatedAt: daysAgo(1),
  },
  {
    id: 'c3',
    otherUser: { id: 'user4', name: 'Ahmad Wijaya' },
    product: {
      id: 'p3',
      name: 'Kemeja Flanel Pria',
      price: 185000,
      image: 'https://picsum.photos/seed/product3/200/200',
    },
    lastMessage: messagesConversation3[messagesConversation3.length - 1],
    unreadCount: 0,
    updatedAt: daysAgo(3),
  },
];

export const mockMessagesByConversation: Record<string, Message[]> = {
  c1: messagesConversation1,
  c2: messagesConversation2,
  c3: messagesConversation3,
  c4: messagesConversation4,
};

export const CURRENT_USER_ID = 'user1';
