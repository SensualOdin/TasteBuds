# TasteBuds Mobile App

React Native mobile application for TasteBuds - a group restaurant matching app built with Expo.

## 🚀 Features

- **User Authentication** - Register and login with email/password
- **Group Management** - Create and join groups with friends
- **Location-Based Search** - Find restaurants near your location
- **Swipe Interface** - Tinder-style swiping with gesture animations
- **Real-Time Sync** - Socket.io for live session updates
- **Match Notifications** - Get notified when everyone likes a restaurant
- **Results Screen** - View all matched restaurants with details

## 📱 Tech Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Gestures**: react-native-gesture-handler
- **Animations**: react-native-reanimated
- **Real-time**: Socket.io client
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Storage**: AsyncStorage

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (optional, but recommended)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Navigate to the mobile directory:
```bash
cd apps/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your backend URL:
```env
API_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000
```

**Note**: For testing on physical devices, use your computer's local IP:
```env
API_URL=http://192.168.1.XXX:3000
SOCKET_URL=http://192.168.1.XXX:3000
```

### Running the App

Start the Expo development server:

```bash
npm start
```

Then choose your platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## 📂 Project Structure

```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (app)/             # Main app screens
│   │   ├── (tabs)/        # Tab navigation
│   │   │   ├── groups.tsx # Groups list
│   │   │   └── profile.tsx # User profile
│   │   ├── group/         # Group details
│   │   │   └── [id].tsx
│   │   ├── session/       # Swiping session
│   │   │   └── [id].tsx
│   │   └── matches/       # Match results
│   │       └── [id].tsx
│   ├── _layout.tsx        # Root layout with providers
│   └── index.tsx          # Entry point
├── components/            # Reusable components
│   ├── Button.tsx
│   ├── TextInput.tsx
│   ├── Loading.tsx
│   └── SwipeCard.tsx      # Swipeable restaurant card
├── contexts/              # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   └── SocketContext.tsx  # Socket.io connection
├── services/              # API services
│   ├── api.ts             # REST API client
│   └── socket.ts          # Socket.io client
├── types/                 # TypeScript types
│   └── index.ts
├── constants/             # App constants
│   ├── config.ts          # Configuration
│   └── theme.ts           # Colors, spacing, typography
└── package.json
```

## 🎨 Key Components

### SwipeCard

The main swipeable card component with gesture animations:
- Pan gesture recognition
- Smooth animations with Reanimated
- Like/Nope overlays
- Restaurant details display

### AuthContext

Manages authentication state:
- Login/Register/Logout
- Token management
- User data persistence
- Auto-authentication on app launch

### SocketContext

Handles real-time communication:
- Socket.io connection management
- Event listeners for matches and updates
- Automatic reconnection
- Session state synchronization

## 🔐 Authentication Flow

1. User opens app → Check for stored auth token
2. Token found → Validate with backend → Navigate to Groups
3. No token → Show login screen
4. Login/Register → Store token → Navigate to Groups
5. Logout → Clear token → Navigate to login

## 🎯 Swiping Flow

1. User starts session from group
2. App requests location permission
3. Backend fetches nearby restaurants
4. User swipes on restaurants (gesture or buttons)
5. Swipe recorded via API and Socket.io
6. When all members swipe right → Match notification
7. After 3 matches → Session complete
8. View results with matched restaurants

## 🌐 API Integration

The app communicates with the backend via:

### REST API
- Authentication
- Group management
- Session creation
- Restaurant data
- Match retrieval

### Socket.io
- Real-time session updates
- Match notifications
- Member status
- Live swipe broadcasts

## 🐛 Debugging

### Common Issues

**1. Cannot connect to backend**
- Check if backend is running on http://localhost:3000
- For physical devices, use computer's IP address
- Ensure firewall allows connections

**2. Location not working**
- Check location permissions in device settings
- For simulators, use "Features → Location" to set location

**3. Socket connection fails**
- Verify Socket.io server is running
- Check AUTH token is valid
- Ensure correct Socket URL in environment

### Expo Developer Tools

Access dev menu:
- iOS: Cmd + D (simulator) or shake device
- Android: Cmd/Ctrl + M (emulator) or shake device

Options:
- Reload app
- Toggle performance monitor
- Debug remotely
- Show element inspector

## 📦 Building for Production

### iOS (requires Mac with Xcode)

```bash
npx expo build:ios
```

### Android

```bash
npx expo build:android
```

### Using EAS Build (Recommended)

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## 🧪 Testing

Currently, the app can be tested by:

1. Starting the backend server
2. Running the mobile app
3. Creating an account
4. Creating/joining a group
5. Starting a session
6. Swiping on restaurants

Future improvements:
- Unit tests with Jest
- Component tests with React Native Testing Library
- E2E tests with Detox
- Integration tests for API/Socket communication

## 🎯 Future Enhancements

- [ ] Push notifications for matches
- [ ] User avatars and image upload
- [ ] Dietary restrictions and filters
- [ ] Restaurant favorites
- [ ] Session history
- [ ] In-app restaurant reviews
- [ ] Social features (invite friends, share matches)
- [ ] Dark mode
- [ ] Accessibility improvements
- [ ] Offline mode support

## 📝 License

MIT

## 🙏 Acknowledgments

- Expo team for the amazing framework
- React Native community
- Socket.io for real-time features
