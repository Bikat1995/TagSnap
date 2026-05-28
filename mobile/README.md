# TagSnap - React Native Expo App

Industrial Estate Management mobile application built with React Native and Expo.

## Features

- ✅ Login and Registration
- ✅ Estate Management Dashboard
- ✅ Analytics & Reports with Charts
- ✅ Offline Support with Data Caching
- ✅ Bottom Navigation
- ✅ Dark Theme UI matching Flutter version

## Setup

1. Install dependencies:
```bash
npm install
```

2. **IMPORTANT: Update API URLs for Physical Devices**

   If you're running on a physical device (not emulator), you need to update the API URLs:
   
   - Find your computer's IP address:
     - Windows: Run `ipconfig` and look for IPv4 Address
     - Mac/Linux: Run `ifconfig` and look for inet address
   
   - Update these files:
     - `src/services/ApiService.js` - Replace `YOUR_COMPUTER_IP` with your IP
     - `src/screens/LoginScreen.js` - Replace `YOUR_COMPUTER_IP` with your IP
     - `src/screens/RegisterScreen.js` - Replace `YOUR_COMPUTER_IP` with your IP
     - `src/screens/ReportsScreen.js` - Replace `YOUR_COMPUTER_IP` with your IP

3. Make sure your backend server is running on port 5000

## Running the App

### Using Expo Go (Recommended for Testing)

1. Install Expo Go on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the development server:
```bash
npm start
```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Using Emulator/Simulator

```bash
# For Android
npm run android

# For iOS (Mac only)
npm run ios

# For Web
npm run web
```

## Project Structure

```
mobile-rn/
├── App.js                 # Main app entry with navigation
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   └── ReportsScreen.js
│   └── services/
│       ├── ApiService.js
│       └── OfflineStorageService.js
└── package.json
```

## Dependencies

- `@react-navigation/native` - Navigation
- `@react-navigation/bottom-tabs` - Bottom tab navigation
- `@react-navigation/stack` - Stack navigation
- `@react-native-async-storage/async-storage` - Local storage
- `axios` - HTTP client
- `@react-native-community/netinfo` - Network connectivity
- `react-native-chart-kit` - Charts for reports
- `react-native-svg` - SVG support for charts

## Notes

- The app uses the same API endpoints as the Flutter version
- Offline functionality is supported through AsyncStorage
- Charts are rendered using react-native-chart-kit
- UI matches the Flutter version's dark theme

