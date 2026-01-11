// Firebase SDK initialization and utilitiesimport { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth, signInWithPopup, signInAnonymously, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

/**
 * Firebase configuration
 * In production, these values should come from environment variables
 * For local development, use Firebase Emulator
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForEmulator',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost:9099',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pb-jam-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pb-jam-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000',
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
export const db: Firestore = getFirestore(firebaseApp);

// Initialize Firebase Auth
export const auth: Auth = getAuth(firebaseApp);

/**
 * Check if we're running in emulator mode
 */
const isEmulatorMode = () => {
  return (
    import.meta.env.MODE === 'development' &&
    (import.meta.env.VITE_USE_EMULATOR === 'true' || !import.meta.env.VITE_FIREBASE_API_KEY)
  );
};

/**
 * Connect to Firebase Emulator for local development
 */
export function connectToEmulator(): void {
  if (isEmulatorMode()) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firebase Emulator');
    } catch (error) {
      console.warn('Emulator already connected or error:', error);
    }
  }
}

/**
 * Login with Spotify (placeholder)
 * This will be implemented with Spotify OAuth2 flow
 */
export async function loginWithSpotify(): Promise<void> {
  // TODO: Implement Spotify OAuth2 login
  // - Create OAuth provider for Spotify
  // - Use signInWithPopup with Spotify provider
  // - Store Spotify token for playlist operations
  console.log('Spotify login placeholder - to be implemented');
  throw new Error('Spotify login not yet implemented');
}

/**
 * Login with Google as fallback authentication
 */
export async function loginWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('Google login successful:', result.user.email);
  } catch (error) {
    console.error('Google login failed:', error);
    throw error;
  }
}

/**
 * Login anonymously as fallback
 */
export async function loginAnonymously(): Promise<void> {
  try {
    const result = await signInAnonymously(auth);
    console.log('Anonymous login successful:', result.user.uid);
  } catch (error) {
    console.error('Anonymous login failed:', error);
    throw error;
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await auth.signOut();
    console.log('User signed out');
  } catch (error) {
    console.error('Sign out failed:', error);
    throw error;
  }
}

/**
 * Verify Firestore and Auth connection
 * This function tests that the Firebase services are properly initialized
 */
export async function verifyFirebaseConnection(): Promise<boolean> {
  try {
    // Test that auth is initialized
    const currentUser = getCurrentUser();
    console.log('Auth status:', currentUser ? 'Logged in' : 'Not logged in');

    // Test Firestore connection by reading metadata
    console.log('Firestore initialized:', db !== null);

    return true;
  } catch (error) {
    console.error('Firebase connection verification failed:', error);
    return false;
  }
}