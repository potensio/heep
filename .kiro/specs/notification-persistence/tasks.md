# Implementation Plan

- [x] 1. Initialize Firebase in the app
  - [x] 1.1 Configure Firebase initialization in app entry point
    - Import and initialize Firebase app with existing google-services.json config
    - Ensure Firebase is initialized before any Firestore operations
    - _Requirements: 2.1_

- [x] 2. Create NotificationService for Firestore operations
  - [x] 2.1 Create notification type definitions
    - Create `types/notification.ts` with Notification interface
    - _Requirements: 2.3_
  - [x] 2.2 Implement Firestore deserialization function
    - Create `services/notification-service.ts`
    - Implement `fromFirestoreDoc` to convert Firestore documents to Notification objects
    - Handle missing fields with defaults
    - _Requirements: 5.2_
  - [x]\* 2.3 Write property test for deserialization
    - **Property 4: Deserialization produces valid Notification objects**
    - **Validates: Requirements 5.2**
  - [x] 2.4 Implement getNotifications function
    - Fetch all notifications from Firestore 'notifications' collection
    - Order by createdAt descending
    - _Requirements: 2.1, 2.2_
  - [x]\* 2.5 Write property test for sorting
    - **Property 1: Notifications are sorted by timestamp descending**
    - **Validates: Requirements 2.2**
  - [x] 2.6 Implement subscribeToNotifications function
    - Create real-time listener for notifications collection
    - Return unsubscribe function for cleanup
    - _Requirements: 5.1, 5.2_
  - [x] 2.7 Implement markAsRead function
    - Update notification document's isRead field to true
    - _Requirements: 4.1_
  - [x]\* 2.8 Write property test for mark as read
    - **Property 3: Mark as read updates status**
    - **Validates: Requirements 4.1**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create NotificationContext for state management
  - [x] 4.1 Create NotificationContext with provider
    - Create `contexts/NotificationContext.tsx`
    - Implement context with notifications, unreadCount, loading, error states
    - Subscribe to Firestore on mount, unsubscribe on unmount
    - _Requirements: 2.1, 5.1_
  - [x] 4.2 Implement unread count calculation
    - Calculate unreadCount from notifications where isRead is false
    - _Requirements: 3.3_
  - [x]\* 4.3 Write property test for unread count
    - **Property 2: Unread count equals unread notifications**
    - **Validates: Requirements 3.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update Notifications Screen to use real data
  - [x] 6.1 Integrate NotificationContext into app
    - Wrap app with NotificationProvider in \_layout.tsx
    - _Requirements: 2.1_
  - [x] 6.2 Update notifications.tsx to use context
    - Replace DUMMY_NOTIFICATIONS with context data
    - Remove tab filtering UI (All/Booking/Loyalty tabs)
    - Use loading and error states from context
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 6.3 Implement mark as read on notification tap
    - Call markAsRead when user taps an unread notification
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.4 Implement relative time display
    - Create helper function to format createdAt as relative time (e.g., "2 min ago")
    - _Requirements: 2.3_

- [x] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
