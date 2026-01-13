# SwissBelhotel App - Developer Onboarding Guide

Welcome! This guide will help you set up the SwissBelhotel React Native app from scratch and get it running on your machine.

---

## 📋 What You'll Need

Before starting, make sure you have:

- **macOS** (required for iOS development) or **Windows/Linux** (for Android only)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Code Editor** - VS Code recommended
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

---

## 🚀 Step 1: Clone the Repository

Open your terminal and run:

```bash
# Clone the repo
git clone <REPOSITORY_URL>

# Navigate into the project
cd swissbelhotel-app
```

---

## 📦 Step 2: Install Dependencies

```bash
# Install Node.js packages
npm install

# Install EAS CLI globally (for building)
npm install -g eas-cli
```

This will install all the required packages including:

- React Native
- Expo SDK
- Firebase
- OneSignal (push notifications)
- Navigation libraries
- And more...

---

## 🔑 Step 3: Set Up Environment Variables

The project uses a `.env` file for configuration. It should already exist in the root directory with:

```
EXPO_PUBLIC_ONESIGNAL_APP_ID=7ab0d4c8-2a8c-45f4-a878-1ff82ea87380
```

If it's missing, create a `.env` file in the root directory with the content above.

---

## 🤖 Step 4: Set Up Android Development

### Install Android Studio

1. Download [Android Studio](https://developer.android.com/studio)
2. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)

### Configure Android SDK

1. Open Android Studio
2. Go to **Settings/Preferences** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Install the following:
   - Android 13.0 (Tiramisu) or higher
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools

### Set Up Environment Variables

Add these to your shell profile (`~/.zshrc` on macOS or `~/.bashrc` on Linux):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Then reload your shell:

```bash
source ~/.zshrc  # or source ~/.bashrc
```

### Create an Android Emulator

1. Open Android Studio
2. Go to **Tools** → **Device Manager**
3. Click **Create Device**
4. Select a device (e.g., Pixel 5)
5. Download and select a system image (Android 13+ recommended)
6. Finish setup

---

## 🍎 Step 5: Set Up iOS Development (macOS Only)

### Install Xcode

1. Download Xcode from the Mac App Store (this takes a while, it's ~15GB)
2. Open Xcode and accept the license agreement
3. Install Command Line Tools:

```bash
xcode-select --install
```

### Install CocoaPods

```bash
sudo gem install cocoapods
```

### Install iOS Simulator

1. Open Xcode
2. Go to **Xcode** → **Settings** → **Platforms**
3. Download iOS simulators (iOS 17+ recommended)

---

## ▶️ Step 6: Run the App

### Start the Development Server

```bash
npm start
```

This starts the Metro bundler. You'll see a QR code and options to run on different platforms.

### Run on Android

**Option 1: Using Expo Dev Client (Recommended)**

```bash
# First time or when native code changes
npx expo run:android
```

This will:

- Build the native Android app
- Install it on your emulator/device
- Start the app

**Option 2: Quick Start (after first build)**

```bash
npm start
# Then press 'a' for Android
```

### Run on iOS (macOS only)

```bash
# First time or when native code changes
npx expo run:ios
```

### Run on Web (for quick testing)

```bash
npm run web
```

---

## 🔍 Step 7: Verify Everything Works

Once the app launches, you should see:

- The SwissBelhotel splash screen
- The onboarding screens
- The main app interface

Try these to confirm everything is working:

- Navigate between screens
- Check if images load
- Test any interactive features

---

## 🐛 Common Issues & Solutions

### "Metro bundler not found"

```bash
npx expo start --clear
```

### "Android SDK not found"

Make sure `ANDROID_HOME` is set correctly and Android Studio is installed.

### "No devices found"

```bash
# Check connected devices
adb devices

# Start emulator manually
emulator -avd <EMULATOR_NAME>
```

### "CocoaPods error" (iOS)

```bash
cd ios
pod install
cd ..
```

### "Port 8081 already in use"

```bash
# Kill the process
lsof -ti:8081 | xargs kill -9

# Or use a different port
npx expo start --port 8082
```

### Build fails with native module errors

```bash
# Clean and rebuild
rm -rf node_modules
npm install
npx expo run:android  # or npx expo run:ios
```

---

## 📱 Understanding the Project Structure

```
swissbelhotel-app/
├── app/                    # Expo Router screens (file-based routing)
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/           # Screen components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and service integrations
│   └── ...
├── assets/                # Images, fonts, etc.
├── android/               # Native Android code
├── ios/                   # Native iOS code
├── .env                   # Environment variables
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── eas.json              # Build configuration
```

---

## 🔄 Development Workflow

### Making Changes

1. **JavaScript/TypeScript changes**: Hot reload works automatically
2. **Native code changes**: Rebuild with `npx expo run:android` or `npx expo run:ios`
3. **Configuration changes** (`app.json`): Rebuild required

### Testing Your Changes

```bash
# Run linter
npm run lint

# Clear cache if something seems wrong
npx expo start --clear
```

---

## 🏗️ Building for Testing

### Create a Preview Build (APK/IPA)

```bash
# Android APK
eas build --profile preview --platform android

# iOS IPA
eas build --profile preview --platform ios
```

You'll need to:

1. Log in to your Expo account: `eas login`
2. Wait for the build to complete (10-20 minutes)
3. Download the APK/IPA from the provided link

---

## 📚 Key Technologies Used

- **React Native**: Mobile app framework
- **Expo**: Development platform and tooling
- **Expo Router**: File-based navigation
- **Firebase**: Backend services
- **OneSignal**: Push notifications
- **NativeWind**: Tailwind CSS for React Native
- **React Query**: Data fetching and caching

---

## 🆘 Getting Help

### Useful Commands

```bash
# Check Node version
node --version  # Should be 18+

# Check npm version
npm --version

# Check connected devices
adb devices  # Android
xcrun simctl list  # iOS

# View Metro bundler logs
npx expo start --verbose

# Reset everything
rm -rf node_modules
npm install
npx expo start --clear
```

### Documentation Links

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

### Still Stuck?

- Check the existing `DEVELOPMENT-GUIDE.md` for build commands
- Ask the team for help
- Check the project's issue tracker

---

## ✅ Quick Checklist

Before you start coding, make sure:

- [ ] Repository cloned
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Android Studio set up (for Android)
- [ ] Xcode installed (for iOS, macOS only)
- [ ] `.env` file exists
- [ ] App runs on emulator/simulator
- [ ] Hot reload works
- [ ] You can navigate through the app

---

## 🎯 Next Steps

Now that you're set up:

1. Familiarize yourself with the codebase
2. Check the bug tracker for issues to fix
3. Create a new branch for your work
4. Make your changes
5. Test thoroughly
6. Submit a pull request

Happy coding! 🚀
