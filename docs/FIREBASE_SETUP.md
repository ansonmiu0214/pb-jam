# Firebase Setup Guide

## Overview
Firebase SDK has been initialized in `src/services/firebaseService.ts` with:
- Firestore database connection
- Firebase Authentication setup
- Placeholders for Spotify login and fallback authentication methods

## Configuration

### Environment Variables
Create a `.env.local` file (copy from `.env.example`) with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173

VITE_USE_EMULATOR=true
```

### Getting Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Go to Project Settings > General tab
4. Copy the SDK configuration values into `.env.local`

## Available Functions

### Authentication
- `loginWithSpotify()` - Spotify OAuth login (placeholder for implementation)
- `loginWithGoogle()` - Google OAuth fallback login
- `loginAnonymously()` - Anonymous login fallback
- `signOut()` - Sign out current user
- `getCurrentUser()` - Get current authenticated user

### Database
- `db` - Firestore database instance for use in other services
- `auth` - Firebase Auth instance for use in other services

### Development
- `connectToEmulator()` - Connect to local Firebase Emulator (for development)
- `verifyFirebaseConnection()` - Test Firebase connectivity

## Firebase Emulator (Development)

For local development without a real Firebase project, use Firebase Emulator:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulator
firebase init emulator

# Start emulator
firebase emulators:start

# In another terminal, run your app
npm run start-dev
```

Set `VITE_USE_EMULATOR=true` in `.env.local` to use the emulator.

## Next Steps

1. Set up Firebase Console project
2. Configure environment variables in `.env.local`
3. Implement Spotify OAuth in `loginWithSpotify()`
4. Test authentication flows
5. Verify Firestore connectivity with test documents

## Testing

Run `npm test` to execute the Firebase configuration tests.

## Notes

- Google Auth requires OAuth credentials in Firebase Console
- Spotify login implementation will require Spotify API credentials
- For production, ensure all secrets are properly stored in environment
- The emulator mode is useful for testing without a real Firebase project
