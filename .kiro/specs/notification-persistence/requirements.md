# Requirements Document

## Introduction

This feature enables persistent notification storage and display for the SwissBelhotel mobile app. When users receive push notifications via OneSignal, these notifications will be stored in Firebase Firestore and displayed in the app's notification screen. Unread notifications will be visually highlighted with an orange/red background and a red dot indicator.

## Glossary

- **Notification_System**: The combined system of OneSignal push notifications, Firebase Firestore storage, and the React Native notification UI
- **Notification**: A message sent to users containing a title, body, type, and metadata
- **Unread_Notification**: A notification that has not been marked as read by the user
- **Read_Notification**: A notification that has been viewed/acknowledged by the user

- **Firebase_Firestore**: Cloud-hosted NoSQL database used to persist notification data
- **OneSignal**: Third-party push notification service already integrated in the app

## Requirements

### Requirement 1

**User Story:** As a user, I want my push notifications to be saved so that I can view them later in the notification screen.

#### Acceptance Criteria

1. WHEN a push notification is received from OneSignal THEN the Notification_System SHALL store the notification data in Firebase Firestore with title, body, timestamp, and read status
2. WHEN a notification is stored THEN the Notification_System SHALL set the initial read status to unread (false)
3. WHEN storing a notification THEN the Notification_System SHALL associate the notification with the device identifier for user-specific retrieval

### Requirement 2

**User Story:** As a user, I want to see all my notifications in the notification screen so that I can review past messages.

#### Acceptance Criteria

1. WHEN the notification screen loads THEN the Notification_System SHALL fetch all notifications from Firebase Firestore for the current device
2. WHEN displaying notifications THEN the Notification_System SHALL order notifications by timestamp with newest first
3. WHEN notifications are fetched THEN the Notification_System SHALL display the notification title, message body, and relative time

### Requirement 3

**User Story:** As a user, I want to easily identify unread notifications so that I know which messages are new.

#### Acceptance Criteria

1. WHILE a notification has unread status THEN the Notification_System SHALL display the notification with an orange/red highlighted background (#FFF6F4)
2. WHILE a notification has unread status THEN the Notification_System SHALL display a red dot indicator (#F04F31) next to the timestamp
3. WHEN displaying the "All" tab THEN the Notification_System SHALL show a badge count of unread notifications

### Requirement 4

**User Story:** As a user, I want to mark notifications as read so that I can track which messages I have seen.

#### Acceptance Criteria

1. WHEN a user taps on an unread notification THEN the Notification_System SHALL update the read status to true in Firebase Firestore
2. WHEN a notification is marked as read THEN the Notification_System SHALL remove the highlighted background and red dot indicator
3. WHEN a notification is marked as read THEN the Notification_System SHALL update the unread count badge in the "All" tab

### Requirement 5

**User Story:** As a user, I want notifications to update in real-time so that I see new messages without refreshing.

#### Acceptance Criteria

1. WHILE the notification screen is open THEN the Notification_System SHALL listen for real-time updates from Firebase Firestore
2. WHEN a new notification is added to Firestore THEN the Notification_System SHALL automatically display the new notification in the list
3. WHEN a notification's read status changes THEN the Notification_System SHALL automatically update the visual indicators

### Requirement 7

**User Story:** As a developer, I want notification data to be serialized and deserialized correctly so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN storing a notification to Firestore THEN the Notification_System SHALL serialize the notification object to a valid Firestore document format
2. WHEN retrieving a notification from Firestore THEN the Notification_System SHALL deserialize the Firestore document to a valid Notification object
3. WHEN serializing and deserializing a notification THEN the Notification_System SHALL preserve all original field values (round-trip consistency)
