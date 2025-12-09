# Implementation Plan

- [x] 1. Update SLIDES array in OnboardingScreen
  - [x] 1.1 Modify SLIDES constant to contain exactly 2 slides
    - Remove slides 1 and 2 (Seamless hotel booking, Swiss-Belexecutive member benefits)
    - Keep slide 3 content as new slide 1 ("One app, two experiences")
    - Add new slide 2 ("Enable Notification") with appropriate description
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_
  - [ ]\* 1.2 Write property test for slide count
    - **Property 1: Slide count is exactly two**
    - **Validates: Requirements 1.1**

- [x] 2. Update button logic for notification flow
  - [x] 2.1 Modify handleNext function for new flow
    - On slide 1: Navigate to slide 2 (existing behavior)
    - On slide 2: Call requestNotificationPermission function
    - _Requirements: 1.4, 2.4, 2.5_
  - [x] 2.2 Add requestNotificationPermission function
    - Import OneSignal from react-native-onesignal
    - Call OneSignal.Notifications.requestPermission(true)
    - Navigate to "/(tabs)" after permission flow completes (in finally block)
    - _Requirements: 2.4, 2.5_
  - [x] 2.3 Update button text logic
    - Slide 1: Display "Next"
    - Slide 2: Display "I'm in"
    - _Requirements: 1.4, 2.3_
  - [ ]\* 2.4 Write property test for button text
    - **Property 2: Button text changes based on slide position**
    - **Validates: Requirements 1.4, 2.3**

- [x] 3. Add "Maybe later" secondary action
  - [x] 3.1 Modify secondary button visibility and text
    - Show "Maybe later" only on slide 2 (last slide)
    - Hide secondary button on slide 1
    - _Requirements: 3.1_
  - [x] 3.2 Implement handleSkip for slide 2
    - Navigate directly to "/(tabs)" without calling OneSignal
    - _Requirements: 3.2_
  - [ ]\* 3.3 Write property test for secondary action visibility
    - **Property 3: Secondary action visibility on last slide**
    - **Validates: Requirements 3.1**

- [x] 4. Checkpoint - Make sure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
