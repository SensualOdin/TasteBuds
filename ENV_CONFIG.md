# Environment Configuration Summary

## ✅ Configuration Status

Both `.env` files have been created and configured correctly!

### Backend (.env)
Location: `apps/backend/.env`

```
✅ PORT=3000                    (Matches mobile app expectations)
✅ SUPABASE_URL                 (Your Supabase project URL)
✅ SUPABASE_ANON_KEY            (Public anon key)
✅ SUPABASE_SERVICE_ROLE_KEY    (Admin key for server operations)
✅ JWT_SECRET                   (Custom secret for auth tokens)
✅ GOOGLE_MAPS_API_KEY          (For restaurant search)
✅ SOCKET_IO_PORT=3000          (Same as main port)
```

### Mobile (.env)
Location: `apps/mobile/.env`

```
✅ API_URL=http://localhost:3000     (Backend REST API)
✅ SOCKET_URL=http://localhost:3000  (Socket.io connection)
```

---

## 🔧 Key Fixes Applied

### 1. Port Consistency ✅
- **Before**: Backend was set to `PORT=3001`
- **After**: Changed to `PORT=3000` to match mobile expectations
- **Impact**: Mobile app will now connect successfully

### 2. Service Role Key Added ✅
- **Added**: `SUPABASE_SERVICE_ROLE_KEY` to backend
- **Why**: Required for admin operations (user creation, group management)
- **Impact**: Backend can now perform privileged database operations

### 3. Environment Files Created ✅
- **Before**: No `.env` files existed (only `.env.example`)
- **After**: Both `apps/backend/.env` and `apps/mobile/.env` created
- **Impact**: Apps can now read configuration

### 4. Updated Example Files ✅
- Sanitized `env.example` to remove actual keys
- Added better comments and instructions
- Included physical device testing instructions

---

## 📱 Testing on Physical Devices

If you want to test on a physical phone/tablet:

1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. Update `apps/mobile/.env`:
   ```env
   API_URL=http://192.168.1.100:3000
   SOCKET_URL=http://192.168.1.100:3000
   ```

3. Make sure your phone and computer are on the **same WiFi network**

---

## 🚀 Ready to Start!

Your environment is now properly configured. To start the app:

### Terminal 1 - Backend
```bash
cd apps/backend
npm run dev
```

You should see:
```
🚀 Server running on port 3000
🔌 Socket.IO ready for connections
📦 Using Supabase as database
```

### Terminal 2 - Mobile
```bash
cd apps/mobile
npm start
```

Then press:
- `i` for iOS Simulator
- `a` for Android Emulator
- Scan QR with Expo Go for physical device

---

## 🔐 Security Notes

### ⚠️ IMPORTANT: Before Production

1. **Change JWT_SECRET**: Use a long random string (32+ characters)
   ```bash
   # Generate a secure secret:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Environment Variables**: Never commit `.env` files to Git
   - Already in `.gitignore`
   - Use environment variables in production (Heroku, Vercel, etc.)

3. **API Keys**: Restrict your Google Maps API key
   - Go to Google Cloud Console
   - Add HTTP referrer restrictions
   - Limit to your domain only

4. **Supabase**: Enable Row Level Security (RLS) policies
   - Restrict data access per user
   - Enable in Supabase Dashboard → Authentication → Policies

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# If port is busy, kill the process or change PORT in .env
```

### Mobile can't connect to backend
- ✅ Backend must be running first
- ✅ Check `API_URL` in mobile `.env` matches backend URL
- ✅ For physical devices, use your computer's IP (not localhost)
- ✅ Firewall: Allow port 3000 through Windows Firewall

### Socket.io connection fails
- ✅ Same as above - check URLs match
- ✅ Check backend logs for socket connection messages
- ✅ Mobile app logs will show "Socket connected" when successful

---

## ✨ Environment Variables Reference

### Backend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 3000) |
| `NODE_ENV` | Yes | Environment (development/production) |
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Admin Supabase key (server only) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | Token expiration (default: 7d) |
| `GOOGLE_MAPS_API_KEY` | Yes | For restaurant search |
| `YELP_API_KEY` | No | Optional for additional restaurant data |
| `FRONTEND_URL` | Yes | CORS allowed origin |
| `SOCKET_IO_PORT` | Yes | Socket.io port (same as PORT) |

### Mobile Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `API_URL` | Yes | Backend REST API URL |
| `SOCKET_URL` | Yes | Socket.io server URL |

---

Your environment is configured and ready to go! 🎉
