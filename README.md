# ChickenTinder 🍗

A group restaurant matching app where friends swipe on local restaurants together. When everyone in the group swipes right on the same restaurant, it's a match! After 3 matches, the session ends and shows the results.

## Features

- **Group Swiping**: Create or join groups to swipe on restaurants together
- **Real-time Sync**: Live updates when group members join and swipe
- **Smart Matching**: Requires unanimous approval for matches
- **Restaurant Discovery**: Powered by Google Places and Yelp APIs
- **Location-based**: Find restaurants near your group
- **Dietary Preferences**: Filter by dietary restrictions and preferences
- **Beautiful UI**: Modern, smooth animations with React Native Reanimated

## Tech Stack

### Frontend (Mobile App)
- **React Native** with Expo
- **Expo Router** for navigation
- **React Native Reanimated** for smooth animations
- **React Native Gesture Handler** for swipe gestures
- **Socket.io Client** for real-time communication
- **AsyncStorage** for local data persistence

### Backend (API Server)
- **Node.js** with Express
- **TypeScript** for type safety
- **Socket.io** for real-time features
- **PostgreSQL** with Prisma ORM
- **JWT** for authentication
- **Google Places API** for restaurant data
- **Yelp Fusion API** for additional restaurant info

## Project Structure

```
chickentinder/
├── apps/
│   ├── mobile/          # React Native app
│   │   ├── app/         # Expo Router pages
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts
│   │   ├── services/    # API services
│   │   └── utils/       # Helper functions
│   └── backend/         # Node.js server
│       ├── src/
│       │   ├── routes/  # API routes
│       │   ├── services/# Business logic
│       │   ├── middleware/
│       │   └── sockets/ # Socket.io handlers
│       └── prisma/      # Database schema
└── docs/                # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Places API key
- Yelp Fusion API key
- Expo CLI (`npm install -g @expo/cli`)

### Backend Setup

1. **Clone and install dependencies:**
   ```bash
   cd apps/backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/chickentinder"
   GOOGLE_PLACES_API_KEY="your-google-places-api-key"
   YELP_API_KEY="your-yelp-api-key"
   JWT_SECRET="your-jwt-secret-key"
   PORT=3000
   ```

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

### Mobile App Setup

1. **Install dependencies:**
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

3. **Run on device/simulator:**
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user's groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/join` - Join group with code
- `DELETE /api/groups/:id/leave` - Leave group
- `PATCH /api/groups/:id/settings` - Update group settings

### Sessions
- `POST /api/sessions/start` - Start swiping session
- `GET /api/sessions/:id/restaurants` - Get restaurants to swipe
- `POST /api/sessions/:id/swipe` - Record swipe
- `GET /api/sessions/:id/matches` - Get session matches
- `POST /api/sessions/:id/complete` - Complete session

### Restaurants
- `GET /api/restaurants/search` - Search nearby restaurants
- `GET /api/restaurants/:id` - Get restaurant details

## Socket.io Events

### Client → Server
- `join_session` - Join a group session
- `leave_session` - Leave current session
- `swipe` - Send swipe data

### Server → Client
- `members_update` - Group member status update
- `session_started` - Session has begun
- `match_found` - New restaurant match
- `session_complete` - Session finished with results
- `user_swiped` - Another user swiped

## Database Schema

The app uses PostgreSQL with Prisma ORM. Key models include:

- **User**: User accounts and preferences
- **Group**: Swiping groups with settings
- **GroupMember**: User membership in groups
- **Session**: Swiping sessions
- **Restaurant**: Restaurant data from APIs
- **Swipe**: Individual swipe records
- **Match**: Matched restaurants

## Development

### Running Tests
```bash
# Backend tests
cd apps/backend
npm test

# Mobile app tests (if configured)
cd apps/mobile
npm test
```

### Building for Production

**Backend:**
```bash
cd apps/backend
npm run build
npm start
```

**Mobile App:**
```bash
cd apps/mobile
npx expo build:android  # or build:ios
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Places API for restaurant data
- Yelp Fusion API for additional restaurant information
- Expo team for the amazing React Native framework
- Socket.io for real-time communication

---

**Happy Swiping!** 🍗✨ 