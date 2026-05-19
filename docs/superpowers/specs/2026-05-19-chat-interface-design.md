# Chat Interface Design

**Date:** 2026-05-19  
**Feature:** Buyer-Seller Chat Interface  
**Scope:** UI only with mock data

---

## Overview

A two-screen chat experience for buyer-seller communication about products. marketplace-style with product context always visible during conversations.

---

## Screen 1: Conversations List (ChatScreen)

### Purpose
Show all recent conversations sorted by activity, allowing users to quickly find and continue chats.

### Layout

**Header:**
- Title: "Chat" 
- Optional unread badge indicator in header

**Conversation List:**
- Scrollable list of conversation cards
- Sorted by most recent message timestamp
- Pull-to-refresh support (visual only for mock)

### Conversation Card

Each card displays:
- **Avatar** - User's initial letter or profile image (48x48, circular)
- **User name** - Bold, 16px, single line
- **Last message preview** - Gray text, truncated to 1 line
- **Timestamp** - Relative time ("2 jam lalu", "Kemarin", "20 Mei")
- **Unread badge** - Red circle with count (if > 0)
- **Product thumbnail** - Small (40x40), positioned at right or corner

### Empty State

Shown when no conversations exist:
- Chat/message icon illustration
- Title: "Belum ada pesan"
- Subtitle: "Chat akan muncul ketika ada pembeli yang menghubungi kamu"

---

## Screen 2: Chat Detail (ChatDetailScreen)

### Purpose
Display conversation history with product context and enable sending messages.

### Layout

**Header:**
- Back button (left)
- Other user's avatar (32x32)
- Other user's name
- Tap header to view user profile (future)

**Pinned Product Card:**
Positioned below header, sticky:
- Product image thumbnail (56x56)
- Product name (truncated to 2 lines)
- Price formatted with "Rp"
- Label: "Sedang membahas produk ini"
- Optional: tap to navigate to product detail

**Message Area:**
- Scrollable message list
- Auto-scroll to latest message
- Date separators between message groups
- Messages grouped by sender in clusters

**Date Separators:**
- "Hari ini" for today
- "Kemarin" for yesterday
- Full date (e.g., "20 Mei 2026") for older

**Message Bubbles:**

Sent messages (current user):
- Right-aligned
- Primary blue background (#155DFC)
- White text
- Rounded corners (top-left, top-right, bottom-left)
- Image messages: rounded, max width 70%

Received messages (other user):
- Left-aligned
- Light gray background (#F3F4F6)
- Dark text (#0A0A0A)
- Rounded corners (top-left, top-right, bottom-right)
- Image messages: rounded, max width 70%

**Input Area:**
Fixed at bottom:
- Photo attachment button (camera icon) - opens image picker
- Text input field with placeholder "Tulis pesan..."
- Send button (arrow icon) - enabled when text not empty or image selected
- Safe area aware padding

---

## Data Structures

```typescript
interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  image?: string;
  timestamp: Date;
  isRead: boolean;
}

interface Conversation {
  id: string;
  otherUser: User;
  product: Product;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
}
```

---

## Mock Data

Create realistic mock data with:
- 3-5 conversations with different states
- Mix of read/unread conversations
- Messages with text and image types
- Various timestamps (recent, yesterday, older)

---

## Navigation Flow

```
Tab Bar "Chat" → ChatScreen (list)
     ↓ tap conversation
ChatDetailScreen (push navigation)
     ↓ back button
ChatScreen (list)
```

Route structure:
- `app/(tabs)/chat.tsx` - ChatScreen (existing, update)
- `app/chat/[id].tsx` - ChatDetailScreen (new)

---

## Component Structure

```
features/chat/
├── ChatScreen.tsx           (update existing)
├── ChatDetailScreen.tsx     (new)
├── components/
│   ├── ConversationCard.tsx
│   ├── ProductContextCard.tsx
│   ├── MessageBubble.tsx
│   ├── ChatInput.tsx
│   ├── DateSeparator.tsx
│   └── EmptyChatState.tsx
├── types.ts
└── mockData.ts
```

---

## Styling

Follow existing app patterns:
- Background: #F9F2E6 (warm beige)
- Cards: White with subtle shadow
- Primary: #155DFC (blue)
- Text: #0A0A0A, #101828, #666666
- Fonts: Plus Jakarta Sans (body), Fjalla One (headings)
- Rounded corners: 8-12px
- Shadows: Subtle elevation

---

## Out of Scope (Future)

- Real-time messaging / WebSocket
- Backend integration
- Push notifications
- Typing indicators
- Read receipts
- Message deletion
- Voice notes
- Location sharing
- Video/image camera capture (gallery only for now)
