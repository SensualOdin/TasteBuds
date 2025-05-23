# ChickenTinder - Complete Build Instructions for AI Agent

## Project Overview
Build a restaurant matching app called "ChickenTinder" where groups of 2+ people swipe on local restaurants. After 3 mutual matches, show the results. Make it fun but professional-looking.

## Tech Stack Requirements
```
Frontend: React Native with Expo
Backend: Node.js with Express
Database: PostgreSQL with Prisma ORM
Real-time: Socket.io
Auth: Supabase Auth
Storage: Supabase Storage
APIs: Google Places API, Yelp Fusion API
```

## Project Structure
```
chickentinder/
├── apps/
│   ├── mobile/          # React Native app
│   │   ├── app/         # Expo Router pages
│   │   ├── components/  # Reusable components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   ├── store/       # State management
│   │   └── utils/       # Helper functions
│   └── backend/         # Node.js server
│       ├── src/
│       │   ├── routes/  # API routes
│       │   ├── models/  # Database models
│       │   ├── services/# Business logic
│       │   ├── middleware/
│       │   └── sockets/ # Socket.io handlers
│       └── prisma/      # Database schema
├── packages/
│   └── shared/          # Shared types/utils
└── docs/                # Documentation
```

## Database Schema (Prisma)
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(cuid())
  email            String    @unique
  name             String
  avatarUrl        String?
  dietaryPrefs     String[]  // vegetarian, vegan, gluten-free, etc
  createdAt        DateTime  @default(now())
  
  groups           GroupMember[]
  swipes           Swipe[]
  createdGroups    Group[]   @relation("GroupCreator")
}

model Group {
  id               String    @id @default(cuid())
  name             String
  code             String    @unique @default(cuid())
  creatorId        String
  creator          User      @relation("GroupCreator", fields: [creatorId], references: [id])
  isActive         Boolean   @default(true)
  sessionActive    Boolean   @default(false)
  radius           Float     @default(5.0) // miles
  latitude         Float?
  longitude        Float?
  priceRange       Int[]     @default([1, 2, 3, 4])
  createdAt        DateTime  @default(now())
  
  members          GroupMember[]
  sessions         Session[]
}

model GroupMember {
  id               String    @id @default(cuid())
  userId           String
  groupId          String
  isReady          Boolean   @default(false)
  joinedAt         DateTime  @default(now())
  
  user             User      @relation(fields: [userId], references: [id])
  group            Group     @relation(fields: [groupId], references: [id])
  
  @@unique([userId, groupId])
}

model Session {
  id               String    @id @default(cuid())
  groupId          String
  status           String    @default("active") // active, completed
  startedAt        DateTime  @default(now())
  completedAt      DateTime?
  
  group            Group     @relation(fields: [groupId], references: [id])
  swipes           Swipe[]
  matches          Match[]
}

model Restaurant {
  id               String    @id @default(cuid())
  placeId          String    @unique // Google Places ID
  yelpId           String?   @unique // Yelp ID
  name             String
  cuisine          String[]
  priceLevel       Int       // 1-4
  rating           Float
  photoUrls        String[]
  address          String
  latitude         Float
  longitude        Float
  phone            String?
  website          String?
  hours            Json?
  
  swipes           Swipe[]
  matches          Match[]
}

model Swipe {
  id               String    @id @default(cuid())
  userId           String
  sessionId        String
  restaurantId     String
  direction        String    // left, right, superlike
  swipedAt         DateTime  @default(now())
  
  user             User      @relation(fields: [userId], references: [id])
  session          Session   @relation(fields: [sessionId], references: [id])
  restaurant       Restaurant @relation(fields: [restaurantId], references: [id])
  
  @@unique([userId, sessionId, restaurantId])
}

model Match {
  id               String    @id @default(cuid())
  sessionId        String
  restaurantId     String
  matchedAt        DateTime  @default(now())
  
  session          Session   @relation(fields: [sessionId], references: [id])
  restaurant       Restaurant @relation(fields: [restaurantId], references: [id])
}
```

## API Routes Structure
```typescript
// Backend API routes

// Auth Routes
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

// User Routes  
GET    /api/users/profile
PATCH  /api/users/profile
GET    /api/users/preferences
PATCH  /api/users/preferences

// Group Routes
POST   /api/groups                  // Create group
GET    /api/groups                  // List user's groups
GET    /api/groups/:id              // Get group details
POST   /api/groups/join             // Join group with code
DELETE /api/groups/:id/leave        // Leave group
PATCH  /api/groups/:id/settings     // Update group settings

// Session Routes
POST   /api/sessions/start          // Start swiping session
GET    /api/sessions/:id/restaurants // Get restaurants to swipe
POST   /api/sessions/:id/swipe      // Record swipe
GET    /api/sessions/:id/matches    // Get matches
POST   /api/sessions/:id/complete   // End session

// Restaurant Routes
GET    /api/restaurants/search      // Search nearby restaurants
GET    /api/restaurants/:id         // Get restaurant details
```

## Core Components Implementation

### 1. App Entry & Navigation (Expo Router)
```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### 2. Swipe Card Component
```typescript
// components/SwipeCard.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

interface SwipeCardProps {
  restaurant: {
    id: string;
    name: string;
    cuisine: string[];
    rating: number;
    priceLevel: number;
    photoUrls: string[];
    distance: number;
  };
  onSwipe: (direction: 'left' | 'right' | 'superlike') => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ restaurant, onSwipe }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      rotation.value = (e.translationX / screenWidth) * 20;
    })
    .onEnd(() => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 'right' : 'left';
        translateX.value = withSpring(translateX.value > 0 ? screenWidth : -screenWidth);
        runOnJS(onSwipe)(direction);
      } else if (translateY.value < -SWIPE_THRESHOLD) {
        translateY.value = withSpring(-screenWidth);
        runOnJS(onSwipe)('superlike');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${rotation.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image source={{ uri: restaurant.photoUrls[0] }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.cuisine}>{restaurant.cuisine.join(' • ')}</Text>
          <View style={styles.details}>
            <Text style={styles.rating}>⭐ {restaurant.rating}</Text>
            <Text style={styles.price}>{'$'.repeat(restaurant.priceLevel)}</Text>
            <Text style={styles.distance}>{restaurant.distance.toFixed(1)} mi</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: screenWidth - 40,
    height: 600,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  info: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cuisine: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: 16,
  },
  price: {
    fontSize: 16,
    color: '#2ecc71',
  },
  distance: {
    fontSize: 16,
    color: '#666',
  },
});
```

### 3. Socket.io Integration
```typescript
// contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinSession: (groupId: string) => void;
  leaveSession: () => void;
  sendSwipe: (restaurantId: string, direction: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.EXPO_PUBLIC_API_URL, {
        auth: { token: user.token },
      });

      newSocket.on('connect', () => setIsConnected(true));
      newSocket.on('disconnect', () => setIsConnected(false));

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const joinSession = (groupId: string) => {
    socket?.emit('join_session', { groupId });
  };

  const leaveSession = () => {
    socket?.emit('leave_session');
  };

  const sendSwipe = (restaurantId: string, direction: string) => {
    socket?.emit('swipe', { restaurantId, direction });
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinSession, leaveSession, sendSwipe }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
```

### 4. Backend Socket Handlers
```typescript
// backend/src/sockets/sessionHandler.ts
import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';

export const setupSessionHandlers = (io: Server, socket: Socket) => {
  socket.on('join_session', async ({ groupId }) => {
    try {
      // Verify user is member of group
      const member = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: socket.data.userId,
            groupId: groupId,
          },
        },
      });

      if (!member) {
        socket.emit('error', { message: 'Not a member of this group' });
        return;
      }

      // Join socket room
      socket.join(`group:${groupId}`);
      
      // Update member ready status
      await prisma.groupMember.update({
        where: { id: member.id },
        data: { isReady: true },
      });

      // Check if all members are ready
      const allMembers = await prisma.groupMember.findMany({
        where: { groupId },
      });

      const readyMembers = allMembers.filter(m => m.isReady);
      
      io.to(`group:${groupId}`).emit('members_update', {
        total: allMembers.length,
        ready: readyMembers.length,
      });

      if (readyMembers.length === allMembers.length) {
        // Start session
        const session = await prisma.session.create({
          data: { groupId },
        });

        io.to(`group:${groupId}`).emit('session_started', {
          sessionId: session.id,
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  socket.on('swipe', async ({ restaurantId, direction }) => {
    try {
      const sessionId = socket.data.sessionId;
      const userId = socket.data.userId;

      // Record swipe
      await prisma.swipe.create({
        data: {
          userId,
          sessionId,
          restaurantId,
          direction,
        },
      });

      // Check for matches if right or superlike
      if (direction === 'right' || direction === 'superlike') {
        const allSwipes = await prisma.swipe.findMany({
          where: {
            sessionId,
            restaurantId,
            direction: { in: ['right', 'superlike'] },
          },
        });

        const groupMembers = await prisma.groupMember.count({
          where: { groupId: socket.data.groupId },
        });

        if (allSwipes.length === groupMembers) {
          // Everyone swiped right - it's a match!
          const match = await prisma.match.create({
            data: {
              sessionId,
              restaurantId,
            },
            include: {
              restaurant: true,
            },
          });

          io.to(`group:${socket.data.groupId}`).emit('match_found', {
            restaurant: match.restaurant,
          });

          // Check if we have 3 matches
          const matchCount = await prisma.match.count({
            where: { sessionId },
          });

          if (matchCount >= 3) {
            io.to(`group:${socket.data.groupId}`).emit('session_complete');
          }
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to record swipe' });
    }
  });
};
```

### 5. Restaurant Service
```typescript
// backend/src/services/restaurantService.ts
import { Client } from '@googlemaps/google-maps-services-js';
import axios from 'axios';

const googleMapsClient = new Client({});

export class RestaurantService {
  async searchNearby(lat: number, lng: number, radius: number, priceRange: number[]) {
    try {
      // Search Google Places
      const placesResponse = await googleMapsClient.placesNearby({
        params: {
          location: { lat, lng },
          radius: radius * 1609.34, // Convert miles to meters
          type: 'restaurant',
          key: process.env.GOOGLE_PLACES_API_KEY!,
        },
      });

      // Get Yelp data for cross-reference
      const yelpResponse = await axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: {
          Authorization: `Bearer ${process.env.YELP_API_KEY}`,
        },
        params: {
          latitude: lat,
          longitude: lng,
          radius: Math.round(radius * 1609.34),
          categories: 'restaurants',
          limit: 50,
        },
      });

      // Merge and filter data
      const restaurants = await this.mergeAndFilterRestaurants(
        placesResponse.data.results,
        yelpResponse.data.businesses,
        priceRange
      );

      return restaurants;
    } catch (error) {
      console.error('Restaurant search error:', error);
      throw error;
    }
  }

  private async mergeAndFilterRestaurants(googlePlaces: any[], yelpBusinesses: any[], priceRange: number[]) {
    // Implementation to merge data from both sources
    // Filter by price range
    // Ensure we have good photos
    // Calculate distance
    // Return formatted restaurant objects
  }
}
```

### 6. Theme & Styling Constants
```typescript
// constants/theme.ts
export const theme = {
  colors: {
    primary: '#FF6B35',      // Orange
    secondary: '#1E3A8A',    // Blue
    success: '#2ECC71',      // Green
    danger: '#E74C3C',       // Red
    warning: '#F39C12',      // Yellow
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: {
      primary: '#2C3E50',
      secondary: '#7F8C8D',
      inverse: '#FFFFFF',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      color: '#7F8C8D',
    },
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
```

## Key Features Implementation Details

### Match Animation
```typescript
// Create a Lottie animation for when matches are found
// Use confetti effect and haptic feedback
// Show restaurant card expanding with match details
```

### Group Code Generation
```typescript
// Generate 6-character alphanumeric codes
// Display as XXX-XXX format for easy sharing
// QR code generation for in-person sharing
```

### Smart Restaurant Ordering
```typescript
// Prioritize restaurants by:
// 1. Relevance to group dietary preferences
// 2. Rating (4.0+ preferred)
// 3. Distance (closer first)
// 4. Variety (don't show same cuisine back-to-back)
// 5. Availability (if integration available)
```

## Environment Variables
```bash
# .env for backend
DATABASE_URL="postgresql://user:password@localhost:5432/chickentinder"
GOOGLE_PLACES_API_KEY="your-key"
YELP_API_KEY="your-key"
SUPABASE_URL="your-url"
SUPABASE_ANON_KEY="your-key"
JWT_SECRET="your-secret"
SOCKET_IO_PORT=3001

# .env for mobile app
EXPO_PUBLIC_API_URL="http://localhost:3000"
EXPO_PUBLIC_SUPABASE_URL="your-url"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-key"
```

## Launch Checklist
1. Set up Supabase project with auth enabled
2. Configure PostgreSQL database with Prisma migrations
3. Obtain Google Places API key (enable Places API)
4. Obtain Yelp Fusion API key
5. Set up Expo project with EAS Build
6. Configure app.json with proper bundle identifiers
7. Test real-time sync with multiple devices
8. Implement proper error boundaries
9. Add analytics (Mixpanel or Amplitude)
10. Set up crash reporting (Sentry)

## Testing Requirements
- Unit tests for matching algorithm
- Integration tests for API endpoints
- E2E tests for critical user flows
- Real device testing for swipe gestures
- Network condition testing (offline mode)
- Group sync testing with 2-8 users

## Performance Targets
- App launch: < 2 seconds
- Swipe response: < 50ms
- Match calculation: < 100ms
- Image loading: Progressive with blur placeholder
- Offline capability: Cache last 50 restaurants

## Security Considerations
- Rate limiting on API endpoints
- Input validation on all user inputs
- Secure group codes (no sequential patterns)
- User data encryption at rest
- HTTPS only for all communications

Build this app with smooth animations, delightful interactions, and a focus on making group decisions fun and fast!