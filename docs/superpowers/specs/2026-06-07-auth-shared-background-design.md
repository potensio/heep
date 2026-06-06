# Auth Shared Background Design

**Date:** 2026-06-07  
**Status:** Approved

## Problem

Auth screens (login, signup, otp) each render their own `ImageBackground` with the same image. When the Stack navigator transitions between them, both backgrounds are simultaneously visible and slide over each other — causing a visible double-background glitch. Native back gesture must be preserved.

## Solution

Move the `ImageBackground` and dark overlay into `auth/_layout.tsx` so it is mounted once and stays static during all Stack transitions. Each screen becomes transparent and only slides its form content.

## Changes

### `app/auth/_layout.tsx`
- Wrap the `Stack` in `ImageBackground` pointing to `public/auth-image-bg.webp` with `resizeMode="cover"`
- Add the `bg-black/30` overlay `View` with `absolute inset-0`
- Add `contentStyle: { backgroundColor: 'transparent' }` to `Stack screenOptions` — prevents the Stack's default opaque background from covering the shared image

### `features/auth/screens/login-screen.tsx`
- Remove `ImageBackground` wrapper and overlay `View`
- Root element becomes `KeyboardAvoidingView` directly
- No other changes

### `features/auth/screens/signup-screen.tsx`
- Same as login-screen: remove `ImageBackground` and overlay, root becomes `KeyboardAvoidingView`

### `features/auth/screens/otp-screen.tsx`
- Same pattern: remove `ImageBackground` and overlay, root becomes `KeyboardAvoidingView`

## What stays the same

- Stack navigator and all routes — no routing changes
- Native iOS swipe-back gesture — Stack is still used, so gesture works as before
- All form logic, props, and navigation callbacks — untouched
- Default Stack slide animation — now correct since background is static

## Out of scope

- OTP screen styling differences (currently uses `typography-*` colors vs white text in login/signup) — separate concern
