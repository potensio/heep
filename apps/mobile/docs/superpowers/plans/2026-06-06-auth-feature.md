# Auth Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement production-grade auth feature with login, signup, and OTP screens using nested stack navigation, form validation, and i18n.

**Architecture:** Feature-first structure with screens in `features/auth/screens/`, shared components in `features/auth/components/`, and thin route wrappers in `app/auth/`. All navigation handled via callbacks passed as props.

**Tech Stack:** React Hook Form, Zod, expo-localization, Gluestack UI

**Spec:** See `docs/superpowers/specs/2026-06-06-auth-feature-design.md`

---

## File Structure

```
features/auth/
├── components/
│   ├── auth-layout.tsx
│   ├── password-input.tsx
│   └── otp-input.tsx
├── screens/
│   ├── login-screen.tsx
│   ├── signup-screen.tsx
│   └── otp-screen.tsx
├── hooks/
│   └── use-auth-form.ts
├── schemas/
│   └── auth-schemas.ts
├── i18n/
│   ├── index.ts
│   └── translations/
│       ├── en.json
│       └── fr.json
└── types.ts

app/auth/
├── _layout.tsx
├── index.tsx
├── login.tsx
├── signup.tsx
└── otp.tsx
```

---

## Task 1: Install Dependencies

- [ ] Install packages: `npm install react-hook-form zod @hookform/resolvers expo-localization`
- [ ] Verify installation

---

## Task 2: Setup i18n

- [ ] Create `features/auth/i18n/translations/` directory
- [ ] Create `features/auth/i18n/translations/en.json` with English translations (see spec)
- [ ] Create `features/auth/i18n/translations/fr.json` with French translations (see spec)
- [ ] Create `features/auth/i18n/index.ts` with `useAuthTranslation()` hook
- [ ] Commit

---

## Task 3: Create Zod Schemas

- [ ] Create `features/auth/schemas/` directory
- [ ] Create `features/auth/schemas/auth-schemas.ts` with:
  - `loginSchema` (email, password)
  - `signupSchema` (nama, email, password)
  - `otpSchema` (otp - 6 digits)
  - Export types: `LoginFormData`, `SignupFormData`, `OtpFormData`
- [ ] Commit

---

## Task 4: Create Types

- [ ] Create `features/auth/types.ts` with:
  - Re-export form data types from schemas
  - `AuthFlowType = 'login' | 'signup'`
  - `LoginScreenProps` interface
  - `SignupScreenProps` interface
  - `OtpScreenProps` interface
- [ ] Commit

---

## Task 5: Create useAuthForm Hook

- [ ] Create `features/auth/hooks/` directory
- [ ] Create `features/auth/hooks/use-auth-form.ts`:
  - Generic hook using `useForm` + `zodResolver`
  - Default mode: 'onChange'
- [ ] Commit

---

## Task 6: Create AuthLayout Component

- [ ] Create `features/auth/components/` directory
- [ ] Create `features/auth/components/auth-layout.tsx`:
  - Props: `illustration`, `title`, `subtitle`, `children`
  - Box + KeyboardAvoidingView + ScrollView
  - Safe area padding
  - Title with font-heading
  - VStack for children
- [ ] Commit

---

## Task 7: Create PasswordInput Component

- [ ] Create `features/auth/components/password-input.tsx`:
  - Props: `value`, `onChangeText`, `placeholder`, `error`, `isDisabled`
  - Input + InputField from Gluestack
  - InputSlot with EyeIcon/EyeOffIcon toggle
  - Error text display
- [ ] Ensure InputSlot and InputIcon exist in Gluestack components
- [ ] Commit

---

## Task 8: Create OtpInput Component

- [ ] Create `features/auth/components/otp-input.tsx`:
  - Props: `value`, `onChangeText`, `length` (default 6), `error`, `isDisabled`
  - HStack with 6 Input boxes
  - Auto-focus next on input
  - Backspace focus previous
  - Paste support
  - Error text display
- [ ] Commit

---

## Task 9: Create LoginScreen

- [ ] Delete existing `features/auth/screens/login-screen.tsx`
- [ ] Create new `features/auth/screens/login-screen.tsx`:
  - Use `AuthLayout` with i18n title/subtitle
  - Use `useAuthForm` with `loginSchema`
  - Controller-wrapped inputs for email and password
  - `PasswordInput` for password field
  - Submit button with loading state
  - "Don't have an account? Sign up" link
  - Props: `onSubmit`, `onNavigateToSignup`, `isLoading`
- [ ] Commit

---

## Task 10: Create SignupScreen

- [ ] Delete existing `features/auth/screens/signup-screen.tsx`
- [ ] Create new `features/auth/screens/signup-screen.tsx`:
  - Use `AuthLayout` with i18n title/subtitle
  - Use `useAuthForm` with `signupSchema`
  - Controller-wrapped inputs for nama, email, password
  - `PasswordInput` for password field
  - Submit button with loading state
  - "Already have an account? Login" link
  - Props: `onSubmit`, `onNavigateToLogin`, `isLoading`
- [ ] Commit

---

## Task 11: Create OtpScreen

- [ ] Create `features/auth/screens/otp-screen.tsx`:
  - Use `AuthLayout` with i18n title/subtitle (interpolated email)
  - Use `useAuthForm` with `otpSchema`
  - `OtpInput` component
  - "Resend code" link
  - Verify button with loading state
  - Props: `email`, `type`, `onSubmit`, `onResendOtp`, `isLoading`
- [ ] Commit

---

## Task 12: Create Auth Layout Route

- [ ] Create `app/auth/_layout.tsx`:
  - Stack navigator with 3 screens
  - All screens with `headerShown: false`
  - Screens: login, signup, otp

---

## Task 13: Create Login Route

- [ ] Update `app/auth/index.tsx`:
  - Redirect to `/auth/login` using `Redirect` from expo-router

- [ ] Update `app/auth/login.tsx`:
  - Import `LoginScreen`
  - Use `useRouter` for navigation
  - Pass `onSubmit` → navigate to `/auth/otp` with params
  - Pass `onNavigateToSignup` → navigate to `/auth/signup`

---

## Task 14: Create Signup Route

- [ ] Update `app/auth/signup.tsx`:
  - Import `SignupScreen`
  - Use `useRouter` for navigation
  - Pass `onSubmit` → navigate to `/auth/otp` with params
  - Pass `onNavigateToLogin` → navigate to `/auth/login`

---

## Task 15: Create OTP Route

- [ ] Create `app/auth/otp.tsx`:
  - Import `OtpScreen`
  - Use `useRouter` and `useLocalSearchParams` for email/type params
  - Pass `onSubmit` → navigate to `/(tabs)` on success
  - Pass `onResendOtp` → TODO: implement resend logic
  - Mock loading state for now

---

## Task 16: Fetch Missing Gluestack Components

- [ ] Check existing components in `components/ui/`
- [ ] Fetch/create `FormControl` components if missing
- [ ] Fetch/create `Link` component if missing
- [ ] Fetch/create `Spinner` component if missing
- [ ] Ensure `Input` has `InputSlot` and `InputIcon`
- [ ] Commit if changes made

---

## Task 17: Test Navigation Flow

- [ ] Run `npx expo start`
- [ ] Test `/auth` redirects to `/auth/login`
- [ ] Test login → signup navigation
- [ ] Test signup → login navigation
- [ ] Test login → OTP navigation (mock submit)
- [ ] Test signup → OTP navigation (mock submit)
- [ ] Test OTP → tabs navigation (mock submit)
- [ ] Fix any issues

---

## Task 18: Final Commit & Cleanup

- [ ] Remove old `app/auth/signup.tsx` if duplicated
- [ ] Run type check: `npx tsc --noEmit`
- [ ] Final commit with all changes
