# Auth Feature Design

**Date:** 2026-06-06
**Status:** Approved

## Overview

Production-grade authentication feature dengan nested stack navigation, form validation, dan internationalization (English + French).

## Requirements

### Flows

1. **Login Flow:** Email + Password → OTP Verification → Home
2. **Signup Flow:** Email + Nama + Password → OTP Verification → Home

### No Social Login
- Hanya email + password authentication

### Post-Auth
- User langsung diarahkan ke home (tabs) setelah OTP verified

---

## File Structure

```
features/auth/
├── components/
│   ├── auth-layout.tsx       # Shared layout untuk semua auth screens
│   ├── password-input.tsx    # Input password dengan show/hide toggle
│   └── otp-input.tsx         # OTP input dengan 6 digit boxes
│
├── screens/
│   ├── login-screen.tsx      # Email + password login
│   ├── signup-screen.tsx     # Email + nama + password signup
│   └── otp-screen.tsx        # OTP verification screen
│
├── hooks/
│   └── use-auth-form.ts      # React Hook Form + Zod setup
│
├── schemas/
│   └── auth-schemas.ts       # Zod validation schemas
│
├── i18n/
│   ├── index.ts              # Translation hook
│   └── translations/
│       ├── en.json           # English translations
│       └── fr.json           # French translations
│
└── types.ts                  # TypeScript types

app/auth/
├── _layout.tsx               # Nested stack untuk auth flow
├── index.tsx                 # Redirect ke /auth/login
├── login.tsx                 # Login screen wrapper
├── signup.tsx                # Signup screen wrapper
└── otp.tsx                   # OTP verification wrapper
```

---

## Routing & Navigation

### URL Structure

| Route | Screen | Params |
|-------|--------|--------|
| `/auth/login` | LoginScreen | - |
| `/auth/signup` | SignupScreen | - |
| `/auth/otp` | OtpScreen | `email`, `type` ("login" \| "signup") |

### Navigation Flow

```
                    ┌─────────────┐
                    │ /auth/login │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               │
    (submit email    (link to         │
     + password)      signup)          │
           │               │               │
           ▼               ▼               │
    ┌─────────────┐  ┌─────────────┐       │
    │ /auth/otp   │  │ /auth/signup│◄──────┘
    │ type=login  │  └──────┬──────┘
    └─────────────┘         │
                            │ (submit email +
                            │  nama + password)
                            │
                            ▼
                     ┌─────────────┐
                     │ /auth/otp   │
                     │ type=signup │
                     └─────────────┘
```

### Layout (app/auth/_layout.tsx)

```tsx
<Stack>
  <Stack.Screen name="login" options={{ headerShown: false }} />
  <Stack.Screen name="signup" options={{ headerShown: false }} />
  <Stack.Screen name="otp" options={{ headerShown: false }} />
</Stack>
```

---

## Screen Components

### LoginScreen

**Props:**
```tsx
interface LoginScreenProps {
  onSubmit: (data: LoginFormData) => void;
  onNavigateToSignup: () => void;
  isLoading?: boolean;
}
```

**Form Fields:**
- Email (email input, required, valid email format)
- Password (password input, required, min 8 characters)

**UI Elements:**
- Illustration placeholder
- Title: "Login or Register"
- Subtitle: "Enter your email to continue"
- Email input
- Password input dengan show/hide toggle
- "Forgot password?" link (non-functional, for future)
- "Continue" button (primary)
- "Don't have an account?" + "Sign up" link

---

### SignupScreen

**Props:**
```tsx
interface SignupScreenProps {
  onSubmit: (data: SignupFormData) => void;
  onNavigateToLogin: () => void;
  isLoading?: boolean;
}
```

**Form Fields:**
- Nama (text input, required, min 2 characters)
- Email (email input, required, valid email format)
- Password (password input, required, min 8 characters)

**UI Elements:**
- Illustration placeholder
- Title: "Create Account"
- Subtitle: "Enter your details to get started"
- Name input
- Email input
- Password input dengan show/hide toggle
- "Create Account" button (primary)
- "Already have an account?" + "Login" link

---

### OtpScreen

**Props:**
```tsx
interface OtpScreenProps {
  email: string;
  type: "login" | "signup";
  onSubmit: (otp: string) => void;
  onResendOtp: () => void;
  isLoading?: boolean;
}
```

**UI Elements:**
- Illustration placeholder
- Title: "Verify Your Email"
- Subtitle: "We sent a code to {email}"
- 6-digit OTP input boxes
- "Resend code" link
- "Verify" button (primary)

---

## Form Validation (Zod Schemas)

### Login Schema
```tsx
const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});
```

### Signup Schema
```tsx
const signupSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});
```

### OTP Schema
```tsx
const otpSchema = z.object({
  otp: z.string().length(6, "OTP harus 6 digit"),
});
```

---

## Shared Components

### AuthLayout

**Props:**
```tsx
interface AuthLayoutProps {
  illustration?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}
```

**Implementation:**
- `Box` as container (bg-background-50)
- `KeyboardAvoidingView` + `ScrollView`
- `VStack` untuk content layout
- `Text` dengan font-heading untuk title
- Safe area padding

---

### PasswordInput

**Props:**
```tsx
interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  isDisabled?: boolean;
}
```

**Implementation:**
- `Input` with `InputField` from Gluestack
- `InputSlot` + `Pressable` untuk eye icon toggle
- `Icon` component untuk eye/eye-off
- Error state dengan `isInvalid`

---

### OtpInput

**Props:**
```tsx
interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number; // default 6
  error?: string;
  isDisabled?: boolean;
}
```

**Implementation:**
- `HStack` untuk 6 boxes layout
- `Input` dengan `InputField` untuk setiap box
- Square styling (equal width/height)
- Auto-focus next box on input
- Paste support (paste full OTP into first box)

---

## Internationalization (i18n)

### Languages
- English (default)
- French

### Implementation
```tsx
// features/auth/i18n/index.ts
import { getLocales } from 'expo-localization';

const translations = {
  en: require('./translations/en.json'),
  fr: require('./translations/fr.json'),
};

export function useAuthTranslation() {
  const locale = getLocales()[0]?.languageCode || 'en';
  const t = (key: string, params?: Record<string, string>) => {
    let text = translations[locale]?.[key] ?? translations['en'][key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, v);
      });
    }
    return text;
  };
  return { t, locale };
}
```

### Translation Keys

**en.json:**
```json
{
  "login.title": "Login or Register",
  "login.subtitle": "Enter your email to continue",
  "login.emailLabel": "Email",
  "login.passwordLabel": "Password",
  "login.submitButton": "Continue",
  "login.forgotPassword": "Forgot password?",
  "login.noAccount": "Don't have an account?",
  "login.signUpLink": "Sign up",

  "signup.title": "Create Account",
  "signup.subtitle": "Enter your details to get started",
  "signup.nameLabel": "Full Name",
  "signup.emailLabel": "Email",
  "signup.passwordLabel": "Password",
  "signup.submitButton": "Create Account",
  "signup.haveAccount": "Already have an account?",
  "signup.loginLink": "Login",

  "otp.title": "Verify Your Email",
  "otp.subtitle": "We sent a code to {{email}}",
  "otp.resend": "Resend code",
  "otp.verifyButton": "Verify",

  "validation.emailInvalid": "Please enter a valid email",
  "validation.passwordMin": "Password must be at least 8 characters",
  "validation.nameMin": "Name must be at least 2 characters",
  "validation.otpLength": "OTP must be 6 digits"
}
```

**fr.json:**
```json
{
  "login.title": "Connexion ou Inscription",
  "login.subtitle": "Entrez votre email pour continuer",
  "login.emailLabel": "Email",
  "login.passwordLabel": "Mot de passe",
  "login.submitButton": "Continuer",
  "login.forgotPassword": "Mot de passe oublié ?",
  "login.noAccount": "Pas encore de compte ?",
  "login.signUpLink": "S'inscrire",

  "signup.title": "Créer un compte",
  "signup.subtitle": "Entrez vos informations pour commencer",
  "signup.nameLabel": "Nom complet",
  "signup.emailLabel": "Email",
  "signup.passwordLabel": "Mot de passe",
  "signup.submitButton": "Créer un compte",
  "signup.haveAccount": "Vous avez déjà un compte ?",
  "signup.loginLink": "Se connecter",

  "otp.title": "Vérifiez votre email",
  "otp.subtitle": "Nous avons envoyé un code à {{email}}",
  "otp.resend": "Renvoyer le code",
  "otp.verifyButton": "Vérifier",

  "validation.emailInvalid": "Veuillez entrer un email valide",
  "validation.passwordMin": "Le mot de passe doit contenir au moins 8 caractères",
  "validation.nameMin": "Le nom doit contenir au moins 2 caractères",
  "validation.otpLength": "L'OTP doit contenir 6 chiffres"
}
```

---

## Gluestack UI Components

### Existing Components
- `Box`, `Button`, `ButtonText`, `Input`, `InputField`
- `VStack`, `HStack`, `Text`

### Components to Fetch from Gluestack (if missing)
- `FormControl`, `FormControlLabel`, `FormControlError`, `FormControlErrorText`
- `FormControlHelper`, `FormControlHelperText`
- `InputSlot`, `InputIcon`
- `Link`, `LinkText`
- `Spinner`

---

## Architecture Rules Compliance

- ✅ **Feature-first:** All logic lives in `features/auth/`
- ✅ **Routes are thin wrappers:** `app/auth/*.tsx` only pass props
- ✅ **Props over routing:** Screens accept callbacks, never use `useRouter` internally
- ✅ **No barrel exports:** Import directly to target file
- ✅ **Shared UI only in `components/ui/`:** Auth-specific components in `features/auth/components/`

---

## Dependencies

### Required Packages
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `@hookform/resolvers` - Zod + React Hook Form integration
- `expo-localization` - Device locale detection

### Install Command
```bash
npm install react-hook-form zod @hookform/resolvers expo-localization
```

---

## Implementation Order

1. Install dependencies
2. Fetch missing Gluestack components
3. Setup i18n (translations + hook)
4. Create schemas (Zod)
5. Create shared components (AuthLayout, PasswordInput, OtpInput)
6. Create use-auth-form hook
7. Create screens (LoginScreen, SignupScreen, OtpScreen)
8. Setup routes (app/auth/*)
9. Test navigation flow
