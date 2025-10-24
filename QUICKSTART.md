# TasteBuds - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Start the Backend

```bash
# Navigate to backend directory
cd apps/backend

# Install dependencies (if not already done)
npm install

# Create .env file (if not exists)
# Copy from env.example and add your keys

# Start the server
npm run dev
```

Backend should be running on **http://localhost:3000**

### Step 2: Start the Mobile App

Open a new terminal:

```bash
# Navigate to mobile directory
cd apps/mobile

# Install dependencies
npm install

# Start Expo
npm start
```

### Step 3: Open the App

Choose your platform:
- Press **`i`** for iOS Simulator
- Press **`a`** for Android Emulator  
- Scan QR code with **Expo Go** app on your phone

### Step 4: Test the App

1. **Register** a new account (or login if you already have one)
2. **Create a group** or join using a group ID
3. **Start a swiping session** from the group screen
   - Allow location permission
   - Start swiping on restaurants!
4. **Swipe** left (nope) or right (like) on restaurants
5. **Get matches** when everyone in your group likes the same place
6. **View results** after 3 matches or when done swiping

## 📱 Testing on Physical Device

### For iPhone/iPad:
1. Install **Expo Go** from App Store
2. Make sure your phone and computer are on the same WiFi
3. Scan the QR code from terminal

### For Android:
1. Install **Expo Go** from Google Play
2. Make sure your phone and computer are on the same WiFi
3. Scan the QR code from terminal

### Update API URL for Physical Device

Edit `apps/mobile/.env` and replace `localhost` with your computer's IP address:

```env
API_URL=http://192.168.1.XXX:3000
SOCKET_URL=http://192.168.1.XXX:3000
```

To find your IP:
- **Mac**: System Preferences → Network
- **Windows**: `ipconfig` in Command Prompt
- **Linux**: `ifconfig` or `ip addr`

## 🔧 Common Issues

### Backend not connecting
- ✅ Make sure backend is running (`npm run dev`)
- ✅ Check backend is on port 3000
- ✅ Verify `.env` file has correct configuration

### Location not working
- ✅ Allow location permission when prompted
- ✅ For simulator: Simulator → Features → Location → Custom Location

### Socket.io not connecting
- ✅ Backend server must be running
- ✅ Check terminal for "Socket connected" message
- ✅ Verify SOCKET_URL in `.env`

### App crashes or errors
- ✅ Check terminal for error messages
- ✅ Try restarting both backend and mobile app
- ✅ Clear Expo cache: `npx expo start -c`

## 🎯 Features to Try

- **Multi-user testing**: Create accounts on multiple devices and join the same group
- **Real-time sync**: Watch matches appear on all devices simultaneously
- **Location-based**: Try from different locations to see different restaurants
- **Swipe gestures**: Swipe cards left/right or use the buttons

## 📚 Next Steps

- Read the full [Mobile README](apps/mobile/README.md)
- Read the [Backend Documentation](apps/backend/README.md)  
- Check the [API Documentation](apps/backend/src/routes/)
- Review the [Project Plan](ChickenTinder%20Plan.md)

## 🐛 Need Help?

Check the logs:
- **Backend logs**: Terminal where you ran `npm run dev`
- **Mobile logs**: Expo Metro bundler terminal
- **Device logs**: Expo Go app → shake device → View logs

Happy swiping! 🍽️✨
