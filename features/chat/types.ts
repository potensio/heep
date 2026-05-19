export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  image?: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  otherUser: User;
  product: Product;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
}
