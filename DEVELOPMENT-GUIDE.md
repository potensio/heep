# Development Guide - SwissBelhotel App

## Prerequisites

- Node.js & npm
- Android Studio + Emulator (untuk Android)
- Xcode (untuk iOS, macOS only)
- EAS CLI: `npm install -g eas-cli`

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start
```

---

## 📱 Run di Emulator/Device

### Android

```bash
# Development build (pertama kali / ada native module baru)
npm run android
# atau
npx expo run:android

# Fast reload (JS/TS changes only)
npx expo start --dev-client
# Tekan 'a' untuk Android
```

### iOS (macOS only)

```bash
npm run ios
# atau
npx expo run:ios
```

### Web Preview

```bash
npm run web
```

---

## 🔨 Build dengan EAS

### Preview Build (Internal Testing)

```bash
# Android
eas build --profile preview --platform android

# iOS
eas build --profile preview --platform ios
```

### Production Build

```bash
# Android (AAB untuk Play Store)
eas build --profile production --platform android

# Android (APK langsung install)
eas build --profile production-apk --platform android

# iOS
eas build --profile production --platform ios --non-interactive
```

### Build Keduanya

```bash
eas build --profile production --platform all
```

---

## 📤 Submit ke Store

```bash
# Google Play Store
eas submit --platform android

# App Store
eas submit --platform ios
```

---

## 🔧 Useful Commands

```bash
# Check devices
adb devices

# Start emulator manual
emulator -avd <EMULATOR_NAME> &

# Uninstall app
adb uninstall com.sbi.swissbelhotelapp

# Clear Metro cache
npx expo start --clear

# Lint
npm run lint
```

---

## ⚠️ Kapan Perlu Rebuild?

| Situasi              | Command                |
| -------------------- | ---------------------- |
| Edit JS/TS code      | Hot reload otomatis    |
| Tambah native module | `npx expo run:android` |
| Update `app.json`    | `npx expo run:android` |
| Update native deps   | `npx expo run:android` |

---

## 📁 Build Profiles (eas.json)

| Profile          | Kegunaan                     |
| ---------------- | ---------------------------- |
| `development`    | Dev client dengan hot reload |
| `preview`        | Internal testing (APK/IPA)   |
| `production`     | Store release (AAB)          |
| `production-apk` | Direct install APK           |
