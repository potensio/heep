export interface Location {
  name: string;
  placeId: string;
  lat: number;
  lng: number;
}

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
  seller?: string;
  sellerId?: string;
  category?: string;
  location?: Location;
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

export interface Order {
  orderNumber: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  productImage?: string;
}

