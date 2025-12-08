# Design Document

## Overview

This design document outlines the refactoring approach for the SwissBelhotel App to address code duplication, improve maintainability, and establish better development practices. The refactoring will create a reusable WebView component, add error boundary handling, clean up dead code and console statements, document environment variables, restructure folders for scalability, and update the README.

## Architecture

The refactored architecture follows a modular approach with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        App Layer                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Expo Router (app/)                      │   │
│  │   Routes only - minimal logic, delegates to src/    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Source Layer (src/)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  components/ │  │   screens/   │  │   contexts/  │      │
│  │  - ui/       │  │              │  │              │      │
│  │  - features/ │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   services/  │  │    hooks/    │  │    types/    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │    utils/    │  │  constants/  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. WebViewScreen Component

A reusable component that replaces the duplicated booking-webview.tsx and member-loyalty-webview.tsx files.

```typescript
// src/components/ui/WebViewScreen.tsx
interface WebViewScreenProps {
  url: string;
  backText?: string;
}

export function WebViewScreen({ url, backText = "Back to Home" }: WebViewScreenProps): JSX.Element
```

### 2. ErrorBoundary Component

A class component that catches JavaScript errors and displays a fallback UI.

```typescript
// src/components/ui/ErrorBoundary.tsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
```

### 3. ErrorFallback Component

A functional component displayed when an error is caught.

```typescript
// src/components/ui/ErrorFallback.tsx
interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

export function ErrorFallback({ error, onRetry }: ErrorFallbackProps): JSX.Element
```

## Data Models

No new data models are required for this refactoring. Existing types remain unchanged.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: WebViewScreen URL rendering
*For any* valid URL string passed to WebViewScreen, the component SHALL render a WebView with that exact URL as the source, and display a header with back navigation.
**Validates: Requirements 1.1, 1.2**

### Property 2: ErrorBoundary error capture and display
*For any* JavaScript error thrown by a child component, the ErrorBoundary SHALL catch the error, update its state to hasError: true, and display the fallback UI with retry option.
**Validates: Requirements 3.1, 3.2**

### Property 3: ErrorBoundary retry reset
*For any* ErrorBoundary in error state, calling the retry function SHALL reset hasError to false and error to null, allowing children to re-render.
**Validates: Requirements 3.3**

## Error Handling

### Global Error Boundary Strategy

The app will wrap the main navigation stack with an ErrorBoundary component:

```typescript
// app/_layout.tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <NotificationProvider>
    <Stack>
      {/* routes */}
    </Stack>
  </NotificationProvider>
</ErrorBoundary>
```

### Error Recovery Flow

1. Error occurs in any component
2. ErrorBoundary catches error via componentDidCatch
3. ErrorFallback displays with error message and retry button
4. User taps retry
5. ErrorBoundary resets state, re-renders children

## Testing Strategy

### Dual Testing Approach

This refactoring uses both unit tests and property-based tests:

- **Unit tests**: Verify specific examples and edge cases
- **Property-based tests**: Verify universal properties across all inputs

### Property-Based Testing Library

The project will use **fast-check** for property-based testing in TypeScript/JavaScript.

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with format: `**Feature: code-refactoring, Property {number}: {property_text}**`

### Test Cases

#### WebViewScreen Tests
- Unit: Renders with booking URL
- Unit: Renders with loyalty URL
- Unit: Back button navigates back
- Property: Any valid URL renders correctly

#### ErrorBoundary Tests
- Unit: Renders children when no error
- Unit: Catches error and shows fallback
- Unit: Retry resets error state
- Property: Any error is caught and displayed

## Folder Structure

### New Structure

```
swissbelhotel-app/
├── app/                          # Expo Router - routes only
│   ├── (onboarding)/
│   ├── (tabs)/
│   ├── _layout.tsx
│   ├── booking-webview.tsx       # Simplified, uses WebViewScreen
│   ├── member-loyalty-webview.tsx # Simplified, uses WebViewScreen
│   ├── index.tsx
│   ├── modal.tsx
│   └── notifications.tsx
├── src/
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── WebViewScreen.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorFallback.tsx
│   │   │   └── index.ts
│   │   └── features/             # Feature-specific components
│   ├── contexts/
│   │   └── NotificationContext.tsx
│   ├── services/
│   │   ├── __tests__/
│   │   └── notification-service.ts
│   ├── hooks/
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   └── use-theme-color.ts
│   ├── types/
│   │   └── notification.ts
│   ├── utils/                    # Utility functions
│   └── constants/
│       └── theme.ts
├── assets/
├── .env
├── .env.example                  # NEW: Environment documentation
└── README.md                     # UPDATED: Proper documentation
```

## Files to Delete

1. `contexts/WebViewContext.tsx` - Unused dead code

## Files to Modify

1. `app/booking-webview.tsx` - Simplify to use WebViewScreen
2. `app/member-loyalty-webview.tsx` - Simplify to use WebViewScreen
3. `app/_layout.tsx` - Add ErrorBoundary, remove console.log
4. `app/(tabs)/index.tsx` - Remove console.log if any
5. `README.md` - Complete rewrite with proper documentation
6. `tsconfig.json` - Add src/ path alias

## Files to Create

1. `src/components/ui/WebViewScreen.tsx`
2. `src/components/ui/ErrorBoundary.tsx`
3. `src/components/ui/ErrorFallback.tsx`
4. `src/components/ui/index.ts`
5. `.env.example`
