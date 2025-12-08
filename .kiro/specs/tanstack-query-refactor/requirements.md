# Requirements Document

## Introduction

This document specifies the requirements for refactoring the notification data fetching system from manual `useEffect`-based fetching to TanStack Query (React Query). The goal is to establish a robust, maintainable data fetching pattern that will serve as a benchmark for all future data fetching implementations in the SwissBelHotel mobile app.

The current implementation suffers from race conditions with Firebase initialization, lacks proper retry mechanisms, and uses outdated patterns. TanStack Query provides built-in caching, automatic retries, background refetching, and proper loading/error state management.

## Glossary

- **TanStack Query**: A powerful data-fetching and state management library (formerly React Query) that provides hooks for fetching, caching, and updating asynchronous data
- **QueryClient**: The core client instance that manages all queries and their cache
- **QueryClientProvider**: React context provider that makes QueryClient available throughout the app
- **useQuery**: Hook for fetching and caching data with automatic background updates
- **useMutation**: Hook for performing data mutations with optimistic updates support
- **Firestore**: Firebase's NoSQL cloud database used for storing notifications
- **Real-time Subscription**: Firestore's `onSnapshot` listener that provides live data updates
- **Notification System**: The feature that displays push notification history to users
- **Stale Time**: Duration for which cached data is considered fresh
- **Cache Time**: Duration for which inactive cached data is kept in memory

## Requirements

### Requirement 1

**User Story:** As a developer, I want to set up TanStack Query infrastructure, so that all data fetching in the app follows a consistent, robust pattern.

#### Acceptance Criteria

1. WHEN the app starts THEN the System SHALL initialize a QueryClient with appropriate default configurations for mobile apps
2. WHEN configuring QueryClient THEN the System SHALL set retry count to 3 with exponential backoff for failed queries
3. WHEN configuring QueryClient THEN the System SHALL set stale time appropriate for notification data (30 seconds)
4. WHEN the app component tree renders THEN the System SHALL wrap the root component with QueryClientProvider

### Requirement 2

**User Story:** As a developer, I want a custom hook for fetching notifications using TanStack Query, so that notification data fetching is declarative and handles all edge cases automatically.

#### Acceptance Criteria

1. WHEN the useNotifications hook is called THEN the System SHALL return notifications data, loading state, error state, and refetch function
2. WHEN fetching notifications THEN the System SHALL use TanStack Query's useQuery hook with proper query key
3. WHEN a fetch fails THEN the System SHALL automatically retry up to 3 times with exponential backoff
4. WHEN the app returns to foreground THEN the System SHALL automatically refetch stale notification data
5. WHEN notifications are fetched THEN the System SHALL compute unread count from notifications where isRead equals false

### Requirement 3

**User Story:** As a developer, I want real-time Firestore updates to sync with TanStack Query cache, so that users see live notification updates without manual refresh.

#### Acceptance Criteria

1. WHEN a Firestore real-time update occurs THEN the System SHALL update the TanStack Query cache with new data
2. WHEN the notification subscription is active THEN the System SHALL maintain a single Firestore listener per query
3. WHEN the component unmounts THEN the System SHALL properly unsubscribe from Firestore listener
4. WHEN real-time data arrives THEN the System SHALL merge it with cached data without causing unnecessary re-renders

### Requirement 4

**User Story:** As a user, I want to mark notifications as read, so that I can track which notifications I have already seen.

#### Acceptance Criteria

1. WHEN a user taps a notification THEN the System SHALL mark that notification as read using useMutation
2. WHEN marking as read succeeds THEN the System SHALL update the local cache optimistically
3. WHEN marking as read fails THEN the System SHALL rollback the optimistic update and show error state
4. WHEN a notification is marked as read THEN the System SHALL update the unread count immediately

### Requirement 5

**User Story:** As a user, I want clear feedback when notifications fail to load, so that I understand what happened and can take action.

#### Acceptance Criteria

1. WHEN notifications fail to load THEN the System SHALL display a user-friendly error message
2. WHEN an error occurs THEN the System SHALL provide a retry button for manual refetch
3. WHEN Firebase is not initialized THEN the System SHALL show a specific error message indicating connection issue
4. WHEN retrying after error THEN the System SHALL show loading state during the retry attempt

### Requirement 6

**User Story:** As a developer, I want the notification architecture to follow clean separation of concerns, so that the codebase remains maintainable and testable.

#### Acceptance Criteria

1. WHEN organizing code THEN the System SHALL separate query hooks from UI components
2. WHEN organizing code THEN the System SHALL keep Firestore service functions in the services layer
3. WHEN organizing code THEN the System SHALL place TanStack Query hooks in a dedicated hooks directory
4. WHEN organizing code THEN the System SHALL maintain type definitions in the types directory
