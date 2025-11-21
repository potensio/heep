# Developer Guide: Building & Testing

## Prerequisites

### Required Tools

- Node.js (v18+)
- pnpm
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- EAS CLI: `npm install -g eas-cli`

### Android SDK Setup (First Time Only)

1. Install Android Studio
2. Open Android Studio → Settings → Android SDK
3. Install required SDK platforms and build tools
4. Set environment variables in `~/.zshrc` or `~/.bash_profile`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
5. Reload shell: `source ~/.zshrc`

### Verify Setup

```bash
# Check Android SDK
echo $ANDROID_HOME

# Check ADB
adb devices
```

## Development Workflow

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
npx expo start --dev-client
```

This starts Metro bundler. Keep this running in a terminal.

### 3. Run on Device/Emulator

#### Android

```bash
# Start Android emulator first, then:
npx expo run:android
```

#### iOS (macOS only)

```bash
npx expo run:ios
```

### Hot Reload

- Press `r` in Metro terminal to reload
- Or shake device/press `R` twice in emulator

## Building APK/IPA

### Local Development Build

**Android (5-10 minutes)**

```bash
npx expo run:android
```

- Builds debug APK
- Installs to connected device/emulator
- Faster iteration for testing
- Output: `android/app/build/outputs/apk/debug/app-debug.apk`

**iOS (macOS only)**

```bash
npx expo run:ios
```

### Cloud Build via EAS

**Login to EAS**

```bash
eas login
```

**Preview Build (10-15 minutes)**

```bash
# Android
eas build --profile preview --platform android

# iOS
eas build --profile preview --platform ios

# Both
eas build --profile preview --platform all
```

- Optimized build
- Suitable for internal testing
- Downloadable APK/IPA

**Production Build (15-20 minutes)**

```bash
# Android
eas build --profile production --platform android

# iOS
eas build --profile production --platform ios

# Both
eas build --profile production --platform all
```

- Release-ready build
- Code signing applied
- Ready for app store submission

## Troubleshooting

### "SDK location not found"

Ensure `ANDROID_HOME` is set:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### "Signature Mismatch" Error

Uninstall old app first:

```bash
adb uninstall com.sbi.swissbelhotelapp
npx expo run:android
```

### "Unable to load script" Error

Metro bundler not running. Start it:

```bash
npx expo start --dev-client
```

Then reload app (press R twice in emulator)

### TypeScript Errors

Check for errors before building:

```bash
npx tsc --noEmit
```

### Clear Cache

```bash
# Clear Metro bundler cache
npx expo start --clear

# Clear Android build cache
cd android && ./gradlew clean && cd ..

# Clear all caches
rm -rf node_modules
pnpm install
npx expo start --clear
```

## Testing Before Production

1. **Type Check**: `npx tsc --noEmit`
2. **Local Build**: `npx expo run:android` or `npx expo run:ios`
3. **Test on Device**: Install and test all features
4. **Preview Build**: `eas build --profile preview --platform all`
5. **Final Test**: Download and test preview build
6. **Production Build**: `eas build --profile production --platform all`

## Build Profiles

Configured in `eas.json`:

- **development**: Development client with debugging
- **preview**: Internal testing build
- **production**: App store release build

## Useful Commands

```bash
# Check EAS build status
eas build:list

# View build logs
eas build:view [build-id]

# Submit to app stores
eas submit --platform android
eas submit --platform ios

# Update app without rebuild (OTA)
eas update

# Check device logs
npx react-native log-android
npx react-native log-ios
```

## Notes

- First build takes longer (downloads dependencies)
- Subsequent builds use cache (faster)
- Local builds are faster for development
- EAS builds are required for production
- Keep Metro bundler running during development
