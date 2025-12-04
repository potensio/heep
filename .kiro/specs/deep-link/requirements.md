# Deep Link Capability

## Overview

Implementasi deep link untuk SwissBelHotel App agar user bisa navigate ke halaman tertentu melalui URL scheme atau Universal Links, terutama saat tap push notification dari OneSignal.

## Goals

- User bisa membuka halaman spesifik di app melalui deep link
- Push notification dari OneSignal bisa redirect ke halaman yang dituju
- Support both cold start (app closed) dan warm start (app in background)

## Acceptance Criteria

### AC1: URL Scheme Deep Link

- App bisa handle URL dengan format `swissbelhotelapp://[path]`
- Supported paths:
  - `swissbelhotelapp://booking` → Booking WebView
  - `swissbelhotelapp://membership` → Member Loyalty WebView
  - `swissbelhotelapp://home` → Home/Tabs screen
- App harus bisa handle deep link saat cold start dan warm start

### AC2: OneSignal Notification Deep Link

- Notification payload bisa include deep link URL
- Saat user tap notification, app navigate ke halaman sesuai deep link
- Handle case ketika app dalam state: foreground, background, dan killed

### AC3: Query Parameters Support

- Deep link bisa include query params untuk data tambahan
- Contoh: `swissbelhotelapp://booking?hotelId=123&checkIn=2024-01-15`
- Query params harus bisa di-pass ke target screen

### AC4: Fallback Handling

- Jika path tidak dikenali, redirect ke home screen
- Jika deep link malformed, app tidak crash dan fallback ke home

## Out of Scope

- Universal Links / App Links (iOS/Android) - bisa di-implement di phase berikutnya
- Deep link analytics tracking
- Deferred deep linking (untuk user yang belum install app)

## Technical Notes

- Existing setup: `expo-linking` sudah terinstall, scheme `swissbelhotelapp` sudah configured
- OneSignal sudah terintegrasi di `_layout.tsx`
- Gunakan Expo Router untuk navigation
