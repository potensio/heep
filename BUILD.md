# Development Preview Guide

## Setup (Sekali Doang)

1. Install Android Studio
2. Setup emulator di Device Manager
3. Environment variables udah auto-configured di `~/.zshrc`

## Daily Development

### First Time / Setelah Install Native Module Baru

```bash
npx expo run:android
```

Ini akan:

- Build development build
- Install app ke emulator
- Start Metro bundler
- Auto-reload on code changes

### Fast Reload (Kalo Cuma Edit JS/TS)

```bash
npx expo start --dev-client
# Tekan 'a' untuk buka Android
```

App yang udah ke-install akan auto-reload.

## Useful Commands

```bash
# List installed packages
adb shell pm list packages | grep swissbelhotel

# Uninstall app
adb uninstall com.sbi.swissbelhotelapp

# Start emulator manual
emulator -avd Medium_Phone_API_36.1 &

# Check connected devices
adb devices
```

## Kapan Perlu Rebuild?

Rebuild (`npx expo run:android`) kalo:

- Nambah native module (OneSignal, camera, etc)
- Update `app.json` / `app.config.js`
- Update native dependencies

Kalo cuma edit code JS/TS → gak perlu rebuild, hot reload aja.

# For Preview
`eas build --profile preview --platform android`

 # For Production
`eas build --profile production --platform android`