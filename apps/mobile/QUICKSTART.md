# TasteBuds - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator installed
- Backend server running on port 3000

## Setup Steps

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
```

### 2. Configure Environment

Ensure `apps/mobile/.env` exists with:

```env
API_URL=http://localhost:3000
SOCKET_URL=http://localhost:3000
```

### 3. Start Backend Server

In a separate terminal:

```bash
cd apps/backend
npm run dev
```

Backend should start on http://localhost:3000

### 4. Start Mobile App

```bash
cd apps/mobile
npx expo start
```

### 5. Launch on Device/Simulator

- **iOS:** Press `i` in the Expo terminal or scan QR with Expo Go app
- **Android:** Press `a` in the Expo terminal or scan QR with Expo Go app
- **Web:** Press `w` (not recommended for mobile-first features)

## Testing the App

### Register & Login
1. Open app → You'll see the login screen
2. Tap "Sign up" to create an account
3. Fill in: Display Name, Email, Password
4. Tap "Create Account"
5. You'll be auto-logged in and see the Groups tab

### Create a Group
1. From Groups tab, tap "Create Group"
2. Enter group name (description optional)
3. Tap "Create"
4. Group appears in your list

### Join a Group (Testing with Multiple Users)
1. Create a second account (or use a second device)
2. From the group detail screen, note the "Group ID"
3. On the other account, tap "Join Group"
4. Enter the Group ID
5. Tap "Join"

### Start a Swiping Session
1. Tap on a group from the list
2. Tap "Start Swiping Session"
3. Allow location permissions when prompted
4. Wait for restaurants to load

### Swipe on Restaurants
1. Swipe right (or tap ♥) to like
2. Swipe left (or tap ✕) to pass
3. When everyone in the group likes the same restaurant, you'll get a match alert 🎉
4. Matches badge appears in top-right corner

### View Matches
1. Tap the matches badge during session
2. OR wait until you've swiped all restaurants
3. See list of matched restaurants
4. Tap "📍 Directions" to open Google Maps
5. Tap "📞 Call" to call the restaurant
6. Tap "🌐 Website" to visit their site

### Profile & Logout
1. Tap Profile tab at bottom
2. View your preferences and account info
3. Tap "Logout" and confirm

## Troubleshooting

### "Network Error" when logging in
- ✅ Check backend is running on port 3000
- ✅ Check `.env` has correct `API_URL=http://localhost:3000`
- ✅ Try `http://192.168.1.xxx:3000` with your computer's local IP

### Socket not connecting
- ✅ Check backend socket server is running
- ✅ Check `SOCKET_URL` in `.env` matches backend
- ✅ Look for socket connection logs in Expo terminal

### Location permission denied
- ✅ Go to device Settings → [App Name] → Location → Allow While Using
- ✅ On simulator: Features → Location → Custom Location

### No restaurants appearing
- ✅ Check Google Places API key in backend `.env`
- ✅ Ensure location permissions granted
- ✅ Check backend terminal for API errors

### TypeScript errors on start
- ✅ Run `npm install` again
- ✅ Delete `node_modules` and reinstall
- ✅ Clear Expo cache: `npx expo start -c`

## Useful Commands

```bash
# Clear Expo cache and restart
npx expo start -c

# Install dependencies
npm install

# Check for updates
npx expo upgrade

# Run TypeScript check
npx tsc --noEmit

# View logs
npx expo start --dev-client

# Reset project
rm -rf node_modules && npm install
```

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router file-based routing
│   ├── (auth)/            # Auth screens (login, register)
│   ├── (app)/             # Authenticated app screens
│   │   ├── (tabs)/        # Tab navigation (groups, profile)
│   │   ├── group/[id]     # Group detail screen
│   │   ├── session/[id]   # Swiping session screen
│   │   └── matches/[id]   # Match results screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── contexts/              # React Context providers
├── services/              # API and Socket clients
├── constants/             # Theme, colors, config
└── types/                 # TypeScript type definitions
```

## Key Features

- ✅ JWT authentication with auto-login
- ✅ Real-time matching with Socket.io
- ✅ Gesture-based swiping with animations
- ✅ Google Places restaurant search
- ✅ Group management (create, join, leave)
- ✅ Restaurant actions (call, directions, website)
- ✅ Empty states and error handling
- ✅ Loading states and pull-to-refresh

## Next Steps

1. ✅ Complete audit report: See `AUDIT_REPORT.md`
2. ✅ Environment setup: See `ENV_CONFIG.md`
3. ✅ API documentation: See backend `README.md`
4. 🚀 Start testing with real users!

---

**Need help?** Check the main README or audit report for detailed documentation.
