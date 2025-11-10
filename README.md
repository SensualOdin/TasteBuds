# Taste Buds Mobile App

Expo-powered implementation of the Taste Buds dining experience. This project uses Expo Router, Supabase, and a custom design system to deliver onboarding, authentication, and the upcoming group-swipe flow.

## Getting Started

```bash
npm install
npm start
```

Use the on-screen instructions from `expo start` to launch the app on iOS, Android, or web.

## Environment Variables

Supabase credentials and Google Places API key are pulled from public Expo env variables. Copy `env.example` to `.env` and fill in your project values:

```
EXPO_PUBLIC_SUPABASE_URL=https://txmucybzgucgkowgpjio.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4bXVjeWJ6Z3VjZ2tvd2dwamlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzE3NzUsImV4cCI6MjA3NjY0Nzc3NX0.9vI5sV57F_-HtVl9-K87MU41LO4sIAjKlEpMXm6i9jY
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your-google-places-api-key-here
```

You can grab the anon key and project URL from the Supabase dashboard or via the included MCP tools.

For Google Places API:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable the **Places API** and **Geocoding API**
4. Create credentials (API Key)
5. Restrict the API key to only Places API and Geocoding API for security
6. Paste the API key into your `.env` file

> All variables are prefixed with `EXPO_PUBLIC_` so they can be safely embedded in the client bundle. Do **not** use a service-role key in the mobile app.

## Supabase Client Types

Generated database types live in `src/lib/database.types.ts`. To refresh them after schema changes:

```bash
supabase gen types typescript --linked --schema public > src/lib/database.types.ts
```

(Requires the Supabase CLI to be authenticated with the linked project.)

## Project Structure Highlights

- `app/` &mdash; Expo Router routes for onboarding, auth, and the authenticated shell.
- `src/providers/` &mdash; Global providers for theme, React Query, and Supabase auth sync.
- `src/components/ui/` &mdash; Design system primitives (buttons, inputs, text, surfaces, icons).
- `src/theme/` &mdash; Light/dark token definitions and theme context.
- `src/state/` &mdash; Zustand store for session + onboarding flags (persisted via AsyncStorage).
- `src/lib/` &mdash; Supabase client and typed database schema.

## Linting & Typechecking

```bash
npm run lint
npm run typecheck
```

Both commands run automatically during development to keep the codebase healthy.

## Testing

```bash
npm run test
```

Unit tests run under Jest with `jest-expo` and `@testing-library/react-native`. See `jest.setup.ts` for mocks.

## Deployment

EAS build profiles live in `eas.json`:

- `development` &mdash; dev client + internal distribution
- `preview` &mdash; standard internal build for QA
- `production` &mdash; store-ready artifacts

Typical workflow:

```bash
npx expo login
npx expo whoami
npx expo run:android --device # optional local test
npx eas build --profile preview --platform all
npx eas submit --profile production --platform ios
npx eas submit --profile production --platform android
```

On first deploy, remember to configure the Supabase URL/key in the Expo dashboard or project secrets:

```bash
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://txmucybzgucgkowgpjio.supabase.co"
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon key>"
```

For OTA updates:

```bash
npx eas update --branch production --message "feat: release"
```

Refer to the Expo docs for additional configuration (push notifications, native modules, etc.).
