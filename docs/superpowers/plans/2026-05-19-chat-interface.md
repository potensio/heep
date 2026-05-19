# Chat Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-screen buyer-seller chat interface with marketplace-style product context.

**Architecture:** Feature-based structure under `features/chat/` with reusable components. Mock data layer simulates conversations and messages. Navigation uses expo-router with tab screen for list and dynamic route for detail.

**Tech Stack:** React Native, Expo Router, NativeWind (Tailwind), @solar-icons/react-native

---

## File Structure

```
features/chat/
├── ChatScreen.tsx           (modify - list screen)
├── ChatDetailScreen.tsx     (create - detail screen)
├── components/
│   ├── ConversationCard.tsx (create)
│   ├── ProductContextCard.tsx (create)
│   ├── MessageBubble.tsx    (create)
│   ├── ChatInput.tsx        (create)
│   ├── DateSeparator.tsx    (create)
│   └── EmptyChatState.tsx   (create)
├── types.ts                 (create)
└── mockData.ts              (create)

app/chat/
└── [id].tsx                 (create - detail route)

types.ts                     (modify - add Chat types)
```

---

### Task 1: Define Chat Types

**Files:**
- Create: `features/chat/types.ts`
- Modify: `types.ts`

- [ ] **Step 1: Create chat types file**

Create `features/chat/types.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add features/chat/types.ts
git commit -m "feat(chat): add chat type definitions"
```

---

### Task 2: Create Mock Data

**Files:**
- Create: `features/chat/mockData.ts`

- [ ] **Step 1: Create mock data with realistic conversations**

Create `features/chat/mockData.ts`:

```typescript
import type { Conversation, Message } from './types';

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
```

- [ ] **Step 2: Commit**

```bash
git add features/chat/mockData.ts
git commit -m "feat(chat): add mock data for conversations and messages"
```

---

### Task 3: Create DateSeparator Component

**Files:**
- Create: `features/chat/components/DateSeparator.tsx`

- [ ] **Step 1: Create DateSeparator component**

Create `features/chat/components/DateSeparator.tsx`:

```typescript
import { View, Text } from 'react-native';

interface DateSeparatorProps {
  date: Date;
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Hari ini';
  if (isYesterday) return 'Kemarin';

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <View className="items-center my-4">
      <View className="bg-neutral-200 px-3 py-1 rounded-full">
        <Text className="text-xs text-neutral-600 font-medium">
          {formatDate(date)}
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/chat/components/DateSeparator.tsx
git commit -m "feat(chat): add DateSeparator component"
```

---

### Task 4: Create MessageBubble Component

**Files:**
- Create: `features/chat/components/MessageBubble.tsx`

- [ ] **Step 1: Create MessageBubble component**

Create `features/chat/components/MessageBubble.tsx`:

```typescript
import { View, Text, Image } from 'react-native';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  if (message.image) {
    return (
      <View className={`max-w-[70%] ${isCurrentUser ? 'self-end' : 'self-start'}`}>
        <Image
          source={{ uri: message.image }}
          className="w-48 h-36 rounded-2xl"
          resizeMode="cover"
        />
        {message.text && (
          <Text className="text-sm mt-1 text-neutral-800">{message.text}</Text>
        )}
      </View>
    );
  }

  return (
    <View className={`max-w-[75%] ${isCurrentUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`px-4 py-2.5 rounded-2xl ${
          isCurrentUser
            ? 'bg-primary-500 rounded-br-sm'
            : 'bg-neutral-100 rounded-bl-sm'
        }`}
      >
        <Text className={`text-base ${isCurrentUser ? 'text-white' : 'text-neutral-900'}`}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/chat/components/MessageBubble.tsx
git commit -m "feat(chat): add MessageBubble component"
```

---

### Task 5: Create ProductContextCard Component

**Files:**
- Create: `features/chat/components/ProductContextCard.tsx`

- [ ] **Step 1: Create ProductContextCard component**

Create `features/chat/components/ProductContextCard.tsx`:

```typescript
import { View, Text, Image, TouchableOpacity } from 'react-native';
import type { Product } from '../types';

interface ProductContextCardProps {
  product: Product;
  onPress?: () => void;
}

export function ProductContextCard({ product, onPress }: ProductContextCardProps) {
  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className="bg-white mx-4 mb-3 rounded-xl p-3 flex-row items-center border border-neutral-200"
    >
      <Image
        source={{ uri: product.image }}
        className="w-14 h-14 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3">
        <Text className="text-xs text-neutral-500 mb-0.5">
          Sedang membahas produk ini
        </Text>
        <Text className="text-sm font-medium text-neutral-900" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-sm font-semibold text-primary-500 mt-0.5">
          {formatPrice(product.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/chat/components/ProductContextCard.tsx
git commit -m "feat(chat): add ProductContextCard component"
```

---

### Task 6: Create ChatInput Component

**Files:**
- Create: `features/chat/components/ChatInput.tsx`

- [ ] **Step 1: Create ChatInput component**

Create `features/chat/components/ChatInput.tsx`:

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Camera, Send } from '@solar-icons/react-native/Linear';

interface ChatInputProps {
  onSend: (text: string, image?: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSend = () => {
    if (text.trim() || selectedImage) {
      onSend(text.trim(), selectedImage || undefined);
      setText('');
      setSelectedImage(null);
    }
  };

  const handleImagePick = () => {
    const mockImages = [
      'https://picsum.photos/seed/chatnew1/400/300',
      'https://picsum.photos/seed/chatnew2/400/300',
      'https://picsum.photos/seed/chatnew3/400/300',
    ];
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    setSelectedImage(randomImage);
  };

  const canSend = text.trim().length > 0 || selectedImage;

  return (
    <View className="bg-white px-4 py-3 border-t border-neutral-200">
      {selectedImage && (
        <View className="mb-2 relative">
          <Image
            source={{ uri: selectedImage }}
            className="w-20 h-20 rounded-lg"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-neutral-800 rounded-full w-6 h-6 items-center justify-center"
          >
            <Text className="text-white text-xs font-bold">×</Text>
          </TouchableOpacity>
        </View>
      )}
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={handleImagePick}
          className="w-10 h-10 items-center justify-center rounded-full bg-neutral-100"
          activeOpacity={0.7}
        >
          <Camera size={22} color="#666666" />
        </TouchableOpacity>
        <View className="flex-1 bg-neutral-100 rounded-full px-4 py-2.5">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Tulis pesan..."
            placeholderTextColor="#9CA3AF"
            className="text-base text-neutral-900"
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          className={`w-10 h-10 items-center justify-center rounded-full ${
            canSend ? 'bg-primary-500' : 'bg-neutral-200'
          }`}
          activeOpacity={0.7}
        >
          <Send size={20} color={canSend ? '#FFFFFF' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/chat/components/ChatInput.tsx
git commit -m "feat(chat): add ChatInput component"
```

---

### Task 7: Create EmptyChatState Component

**Files:**
- Create: `features/chat/components/EmptyChatState.tsx`

- [ ] **Step 1: Create EmptyChatState component**

Create `features/chat/components/EmptyChatState.tsx`:

```typescript
import { View, Text } from 'react-native';
import { ChatRoundDots } from '@solar-icons/react-native/Linear';

export function EmptyChatState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 bg-neutral-100 rounded-full items-center justify-center mb-4">
        <ChatRoundDots size={40} color="#9CA3AF" />
      </View>
      <Text className="text-lg font-semibold text-neutral-800 mb-2">
        Belum ada pesan
      </Text>
      <Text className="text-sm text-neutral-500 text-center">
        Chat akan muncul ketika ada pembeli yang menghubungi kamu
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/chat/components/EmptyChatState.tsx
git commit -m "feat(chat): add EmptyChatState component"
```

---

### Task 8: Create ConversationCard Component

**Files:**
- Create: `features/chat/components/ConversationCard.tsx`

- [ ] **Step 1: Create ConversationCard component**

Create `features/chat/components/ConversationCard.tsx`:

```typescript
import { View, Text, Image, TouchableOpacity } from 'react-native';
import type { Conversation } from '../types';

interface ConversationCardProps {
 {}