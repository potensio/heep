// Order types
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  productImage?: string;
}

export interface OrderSummary {
  totalRevenue: number;
  totalTransactions: number;
}

export interface StoreStats {
  productViews: number;
}

// Navigation types
export type TabScreen = 'index' | 'pesanan' | 'jual' | 'chat' | 'akun';

export type TabParamList = {
  index: undefined;
  pesanan: undefined;
  jual: undefined;
  chat: undefined;
  akun: undefined;
};

// Notification types
export interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  url?: string;
  subscriptionId?: string;
}
