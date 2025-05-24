# ChickenTinder 🐔❤️

A group restaurant matching app where 2+ people swipe on restaurants together, requiring unanimous matches to find the perfect dining spot for everyone.

## 🚀 Features

- **Group Creation & Management**: Create groups and invite friends
- **Real-time Swiping**: Synchronized swiping experience with Socket.io
- **Unanimous Matching**: Only restaurants that everyone likes become matches
- **Location-based Search**: Find restaurants near your location
- **Price & Cuisine Filtering**: Filter by price range and cuisine preferences
- **Live Session Management**: Real-time updates during swiping sessions

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Framework**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **Real-time**: Socket.io for live sessions
- **API**: RESTful endpoints for all operations

### Mobile App (React Native + Expo)
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Context
- **Real-time**: Socket.io client
- **UI**: Custom components with gesture handling

### Database Schema
- **Users**: Authentication and preferences
- **Groups**: Group management and membership
- **Sessions**: Swiping sessions with location data
- **Restaurants**: Restaurant data with ratings and details
- **Swipes**: Individual user swipes
- **Matches**: Unanimous group matches

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ChickenTinder
```

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Backend Setup

#### Environment Variables
Create `apps/backend/.env`:
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
JWT_SECRET=your_jwt_secret_key

# API Keys (Optional)
GOOGLE_PLACES_API_KEY=your_google_places_key
YELP_API_KEY=your_yelp_api_key

# Server
PORT=3000
FRONTEND_URL=http://localhost:8081
```

#### Database Setup
The database schema is automatically created in Supabase with the following tables:
- `users` - User accounts and preferences
- `groups` - Group information
- `group_members` - Group membership
- `sessions` - Swiping sessions
- `restaurants` - Restaurant data
- `swipes` - User swipes
- `matches` - Group matches

### 4. Start Development

#### Option 1: Start Both Apps
```bash
npm run dev
```

#### Option 2: Start Individually
```bash
# Backend
npm run dev:backend

# Mobile (in another terminal)
npm run dev:mobile
```

## 📱 Mobile App Usage

### 1. Authentication
- Register with email and password
- Login to existing account

### 2. Groups
- Create a new group
- Join existing groups by ID
- Manage group settings (admin only)

### 3. Swiping Sessions
- Start a session from a group
- Set location and preferences
- Swipe right (like) or left (pass) on restaurants
- See real-time matches when everyone likes the same place

### 4. Results
- View matched restaurants
- Get details like ratings, price, and location
- Complete the session when ready

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/preferences` - Get preferences
- `PUT /api/users/preferences` - Update preferences

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user's groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/join` - Join group
- `DELETE /api/groups/:id/leave` - Leave group
- `PUT /api/groups/:id/settings` - Update group settings

### Sessions
- `POST /api/sessions/start` - Start swiping session
- `GET /api/sessions/:id/restaurants` - Get restaurants for session
- `POST /api/sessions/:id/swipe` - Record a swipe
- `GET /api/sessions/:id/matches` - Get session matches
- `POST /api/sessions/:id/complete` - Complete session

### Restaurants
- `GET /api/restaurants/search` - Search restaurants
- `GET /api/restaurants/:id` - Get restaurant details

## 🔌 Socket.io Events

### Client → Server
- `join_session` - Join a group session
- `leave_session` - Leave current session
- `swipe` - Send a swipe action

### Server → Client
- `members_update` - Member status updates
- `ready_to_start` - All members ready
- `match_found` - New match discovered
- `session_complete` - Session finished
- `user_swiped` - Another user swiped
- `member_left` - Member left session
- `error` - Error occurred

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:3000/health
```

### Test Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🚀 Deployment

### Backend Deployment
1. Build the application: `npm run build:backend`
2. Set environment variables on your hosting platform
3. Deploy to platforms like Railway, Render, or Heroku

### Mobile App Deployment
1. Build for production: `npx expo build`
2. Submit to app stores using Expo Application Services (EAS)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Supabase for the database and authentication
- Expo for the mobile development platform
- Socket.io for real-time functionality
- The React Native community for excellent libraries

---

**Happy Swiping! 🍽️✨** 