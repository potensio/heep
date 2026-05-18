# BantuJual

A mobile marketplace app for buying and selling products, built with React Native and Expo.

## Features

- **Browse Products** - Discover items for sale in your area
- **Sell Items** - List your products with photos and descriptions
- **Chat** - Communicate with buyers and sellers
- **Orders** - Track your purchases and sales
- **Account** - Manage your profile and settings

## Tech Stack

- [Expo](https://expo.dev/) - React Native framework
- [React Native](https://reactnative.dev/) - Mobile app framework
- [NativeWind](https://www.nativewind.dev/) - Tailwind CSS for React Native
- [React Navigation](https://reactnavigation.org/) - Navigation library

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
app/              # App routes and screens
├── (tabs)/       # Tab navigation screens
├── product/      # Product detail pages
└── sell/         # Selling flow

features/         # Feature modules
├── home/         # Home feature
├── chat/         # Chat feature
├── orders/       # Orders feature
├── sell/         # Sell feature
└── account/      # Account feature

components/       # Shared UI components
hooks/            # Custom React hooks
lib/              # Utilities and helpers
assets/           # Images and fonts
```

## Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## License

Private - All rights reserved.
