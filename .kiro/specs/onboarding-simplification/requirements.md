# Requirements Document

## Introduction

Modifikasi OnboardingScreen yang sudah ada (`src/screens/OnboardingScreen.tsx`) untuk menyederhanakan alur onboarding dari tiga slide menjadi dua slide. Slide pertama menampilkan "One app, two experiences" dan slide kedua menampilkan "Enable Notification" dengan tombol "I'm in" untuk memicu proses enable notification.

## Glossary

- **OnboardingScreen**: Komponen React Native yang sudah ada di `src/screens/OnboardingScreen.tsx` yang menampilkan carousel onboarding
- **Notification_Permission**: Izin sistem yang diperlukan untuk mengirim push notification ke perangkat pengguna
- **OneSignal**: Layanan push notification yang digunakan aplikasi

## Requirements

### Requirement 1

**User Story:** As a new user, I want to see a simplified onboarding experience, so that I can quickly understand the app's value proposition.

#### Acceptance Criteria

1. WHEN the onboarding screen loads THEN the OnboardingScreen SHALL display exactly two slides (reduced from three)
2. WHEN the first slide is displayed THEN the OnboardingScreen SHALL show "One app, two experiences" as the title
3. WHEN the first slide is displayed THEN the OnboardingScreen SHALL show the existing illustration (`onboarding-3-illustration-3420cb.png`)
4. WHEN the user is on the first slide THEN the OnboardingScreen SHALL display a "Next" button to proceed to the second slide

### Requirement 2

**User Story:** As a new user, I want to enable notifications during onboarding, so that I can receive important updates from the app.

#### Acceptance Criteria

1. WHEN the second slide is displayed THEN the OnboardingScreen SHALL show "Enable Notification" as the title
2. WHEN the second slide is displayed THEN the OnboardingScreen SHALL show a description explaining the benefit of enabling notifications
3. WHEN the second slide is displayed THEN the OnboardingScreen SHALL display an "I'm in" button as the primary action
4. WHEN the user taps the "I'm in" button THEN the OnboardingScreen SHALL trigger the system notification permission request via OneSignal
5. WHEN the notification permission flow completes (granted or denied) THEN the OnboardingScreen SHALL navigate the user to the main app screen

### Requirement 3

**User Story:** As a new user, I want the option to skip enabling notifications, so that I can proceed without granting notification permission.

#### Acceptance Criteria

1. WHEN the second slide is displayed THEN the OnboardingScreen SHALL display a "Maybe later" option as secondary action
2. WHEN the user taps the "Maybe later" option THEN the OnboardingScreen SHALL navigate the user to the main app screen without requesting notification permission
