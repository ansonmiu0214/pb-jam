/**
 * User state management service
 * Stores and manages current user information with Firebase Authentication integration
 */
import { auth } from './firebaseService';
import { signInAnonymously, signOut, User } from 'firebase/auth';

interface CurrentUser {
  id: string;
  email?: string;
  displayName?: string;
  provider: 'spotify' | 'google' | 'anonymous';
}

let currentUser: CurrentUser | null = null;
let firebaseUser: User | null = null;
const userChangeListeners: Array<(user: CurrentUser | null) => void> = [];

// Listen to Firebase Auth state changes
auth.onAuthStateChanged((user) => {
  firebaseUser = user;
  if (!user && currentUser) {
    // Firebase user is gone but we still have a current user, clear it
    currentUser = null;
    notifyUserChangeListeners();
  }
});

/**
 * Get the currently authenticated user
 */
export function getCurrentUser(): CurrentUser | null {
  return currentUser;
}

/**
 * Get the Firebase authenticated user
 */
export function getFirebaseUser(): User | null {
  return firebaseUser;
}

/**
 * Set the current authenticated user and ensure Firebase Auth
 */
export async function setCurrentUser(user: CurrentUser | null): Promise<void> {
  if (user) {
    // If setting a user, ensure we're signed into Firebase
    if (!firebaseUser) {
      console.log('[UserService] Signing into Firebase anonymously for user:', user.id);
      try {
        const result = await signInAnonymously(auth);
        firebaseUser = result.user;
        console.log('[UserService] Firebase anonymous auth successful:', result.user.uid);
      } catch (error) {
        console.error('[UserService] Failed to sign into Firebase:', error);
        throw error;
      }
    }
    
    currentUser = user;
    console.log(`User logged in: ${user.email || user.id} (${user.provider})`);
    console.log(`Firebase UID: ${firebaseUser?.uid}`);
  } else {
    // Clear current user and sign out of Firebase
    currentUser = null;
    if (firebaseUser) {
      console.log('[UserService] Signing out of Firebase');
      await signOut(auth);
      firebaseUser = null;
    }
    console.log('User logged out');
  }
  
  notifyUserChangeListeners();
}

/**
 * Get the user ID for Firestore operations (uses Firebase UID)
 */
export function getUserId(): string | null {
  return firebaseUser?.uid || null;
}

/**
 * Subscribe to user state changes
 */
export function onUserChange(listener: (user: CurrentUser | null) => void): () => void {
  userChangeListeners.push(listener);
  // Return unsubscribe function
  return () => {
    const index = userChangeListeners.indexOf(listener);
    if (index > -1) {
      userChangeListeners.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of user state change
 */
function notifyUserChangeListeners(): void {
  userChangeListeners.forEach((listener) => {
    listener(currentUser);
  });
}

/**
 * Check if a user is currently logged in
 */
export function isUserLoggedIn(): boolean {
  return currentUser !== null;
}

/**
 * Clear user state (logout)
 */
export async function clearUser(): Promise<void> {
  await setCurrentUser(null);
}

/**
 * Log out the current user and clear all cached data
 */
export async function logout(): Promise<void> {
  try {
    // Clear Spotify cache
    const { clearSpotifyCache } = await import('./playlistManager');
    clearSpotifyCache();
  } catch {
    // Playlist manager might not be loaded yet, ignore error
    console.log('Playlist manager not loaded, skipping Spotify cache clear');
  }
  
  // Clear user state
  setCurrentUser(null);
  
  console.log('User logged out and all cache cleared');
}

/**
 * Get user's Spotify profile if available
 */
export async function getSpotifyProfile() {
  try {
    const { getCachedUserProfile, isSpotifyAuthenticated } = await import('./playlistManager');
    
    if (!isSpotifyAuthenticated()) {
      return null;
    }
    
    return getCachedUserProfile();
  } catch {
    console.log('Playlist manager not loaded');
    return null;
  }
}

/**
 * Check if user is authenticated with Spotify
 */
export async function isUserSpotifyAuthenticated(): Promise<boolean> {
  try {
    const { isSpotifyAuthenticated } = await import('./playlistManager');
    return isSpotifyAuthenticated();
  } catch {
    return false;
  }
}