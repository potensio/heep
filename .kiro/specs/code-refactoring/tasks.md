# Implementation Plan

- [x] 1. Set up new folder structure and path aliases
  - [x] 1.1 Create src/ directory structure with components/ui, components/features, contexts, services, hooks, types, utils, and constants subdirectories
    - Create all necessary directories under src/
    - _Requirements: 5.1, 5.2_
  - [x] 1.2 Update tsconfig.json with src/ path alias
    - Add "@/src/*" path mapping
    - _Requirements: 5.3_

- [x] 2. Create reusable WebViewScreen component
  - [x] 2.1 Implement WebViewScreen component in src/components/ui/
    - Create WebViewScreen.tsx with url and backText props
    - Include header with back navigation and WebView
    - Use StyleSheet for consistent styling
    - _Requirements: 1.1, 1.2_
  - [ ]* 2.2 Write property test for WebViewScreen URL rendering
    - **Property 1: WebViewScreen URL rendering**
    - **Validates: Requirements 1.1, 1.2**
  - [x] 2.3 Create index.ts barrel export for ui components
    - Export WebViewScreen from index.ts
    - _Requirements: 5.2_

- [x] 3. Refactor WebView route files to use reusable component
  - [x] 3.1 Simplify app/booking-webview.tsx
    - Replace implementation with WebViewScreen component
    - Pass Swiss-Belhotel booking URL
    - _Requirements: 1.3_
  - [x] 3.2 Simplify app/member-loyalty-webview.tsx
    - Replace implementation with WebViewScreen component
    - Pass Swiss-Belhotel loyalty URL
    - _Requirements: 1.4_

- [x] 4. Implement Error Boundary components
  - [x] 4.1 Create ErrorFallback component in src/components/ui/
    - Display error message and retry button
    - Style with SafeAreaView and centered layout
    - _Requirements: 3.2_
  - [x] 4.2 Create ErrorBoundary class component in src/components/ui/
    - Implement componentDidCatch and getDerivedStateFromError
    - Manage hasError and error state
    - Provide retry function to reset state
    - _Requirements: 3.1, 3.3_
  - [ ]* 4.3 Write property test for ErrorBoundary error capture
    - **Property 2: ErrorBoundary error capture and display**
    - **Validates: Requirements 3.1, 3.2**
  - [ ]* 4.4 Write property test for ErrorBoundary retry reset
    - **Property 3: ErrorBoundary retry reset**
    - **Validates: Requirements 3.3**
  - [x] 4.5 Update ui/index.ts to export ErrorBoundary and ErrorFallback
    - Add exports for new components
    - _Requirements: 5.2_

- [x] 5. Integrate ErrorBoundary into app layout
  - [x] 5.1 Update app/_layout.tsx to wrap content with ErrorBoundary
    - Import ErrorBoundary from src/components/ui
    - Wrap NotificationProvider and Stack with ErrorBoundary
    - _Requirements: 3.1, 3.2_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Move existing files to new src/ structure
  - [x] 7.1 Move contexts/NotificationContext.tsx to src/contexts/
    - Update import paths in files that use it
    - _Requirements: 5.1_
  - [x] 7.2 Move services/ to src/services/
    - Move notification-service.ts and __tests__/ directory
    - Update import paths
    - _Requirements: 5.1_
  - [x] 7.3 Move hooks/ to src/hooks/
    - Move use-color-scheme.ts, use-color-scheme.web.ts, use-theme-color.ts
    - Update import paths
    - _Requirements: 5.1_
  - [x] 7.4 Move types/ to src/types/
    - Move notification.ts
    - Update import paths
    - _Requirements: 5.1_
  - [x] 7.5 Move constants/ to src/constants/
    - Move theme.ts
    - Update import paths
    - _Requirements: 5.1_

- [x] 8. Clean up dead code and console statements
  - [x] 8.1 Delete contexts/WebViewContext.tsx
    - Remove unused WebViewContext file
    - _Requirements: 2.1, 2.2_
  - [x] 8.2 Remove console.log statements from app/_layout.tsx
    - Remove all console.log, console.error calls
    - _Requirements: 6.1, 6.2_
  - [x] 8.3 Remove console.log statements from other files
    - Search and remove debug statements from remaining files
    - _Requirements: 6.1, 6.2_

- [ ] 9. Create environment documentation
  - [ ] 9.1 Create .env.example file
    - Document EXPO_PUBLIC_ONESIGNAL_APP_ID with placeholder
    - Add comments explaining each variable
    - _Requirements: 4.1, 4.2_

- [ ] 10. Update README with proper documentation
  - [ ] 10.1 Rewrite README.md with project documentation
    - Add project description and features
    - Add setup instructions referencing .env.example
    - Add architecture overview
    - Add development commands
    - _Requirements: 7.1, 7.2_

- [x] 11. Clean up old empty directories
  - [x] 11.1 Remove old empty directories after migration
    - Delete contexts/, hooks/, types/, constants/, services/ if empty
    - _Requirements: 5.1_

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
