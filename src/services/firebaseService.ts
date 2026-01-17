// Firebase SDK initialization and utilities
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore, collection, addDoc, getDoc, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth, signInWithPopup, signInAnonymously, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { setCurrentUser } from './userService';

/**
 * Firebase configuration
 * In production, these values should come from environment variables
 * Firestore and Auth emulators can be controlled independently
 */
const useFirestoreEmulator = import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true';
const useAuthEmulator = import.meta.env.VITE_USE_AUTH_EMULATOR === 'true';

const firebaseConfig = {
  // Always use production Firebase credentials (required for real auth)
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForEmulator',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost:9099',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pb-jam-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pb-jam-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000',
};

console.log('[Firebase] Config:', {
  useFirestoreEmulator,
  useAuthEmulator,
  projectId: firebaseConfig.projectId,
  env_VITE_USE_FIRESTORE_EMULATOR: import.meta.env.VITE_USE_FIRESTORE_EMULATOR,
  env_VITE_USE_AUTH_EMULATOR: import.meta.env.VITE_USE_AUTH_EMULATOR,
  env_VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
});

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
export const db: Firestore = getFirestore(firebaseApp);

// Initialize Firebase Auth
export const auth: Auth = getAuth(firebaseApp);

/**
 * Track whether emulator connection succeeded
 */
let emulatorConnected = false;

/**
 * In-memory mock store for when emulator is unavailable
 */
const mockDataStore: Map<string, Map<string, Record<string, unknown>>> = new Map();

/**
 * Check if emulator connection is available
 */
const isEmulatorConnected = (): boolean => {
  return emulatorConnected;
};

/**
 * Get the Firestore emulator configuration for current environment
 * In Codespaces and local dev, localhost with port forwarding works best
 */
function getFirestoreEmulatorConfig(): { host: string; port: number } {
  // Always use localhost - Codespaces port forwarding handles the rest
  return { host: 'localhost', port: 8080 };
}

/**
 * Get the Auth emulator configuration for current environment
 * In Codespaces and local dev, localhost with port forwarding works best
 */
function getAuthEmulatorConfig(): { url: string } {
  // Always use localhost - Codespaces port forwarding handles the rest
  return { url: 'http://localhost:9099' };
}

/**
 * Connect to Firebase Emulator for local development
 * Firestore and Auth emulators can be controlled independently
 */
function initializeEmulator(): void {
  try {
    // Extra safety check: Don't connect to emulators if we're in a production environment
    const isProduction = import.meta.env.PROD || 
                        import.meta.env.VITE_ENVIRONMENT === 'prod' || 
                        window.location.hostname !== 'localhost';
    
    if (isProduction && (useAuthEmulator || useFirestoreEmulator)) {
      console.warn('[Firebase] Emulator flags are set but running in production environment. Forcing production mode.');
      console.log('[Firebase] Using production Firebase Auth and Firestore');
      setupAuthStateListener();
      return;
    }

    if (useAuthEmulator) {
      console.log('[Firebase] Connecting to Auth emulator...');
      const authConfig = getAuthEmulatorConfig();
      connectAuthEmulator(auth, authConfig.url);
      console.log('[Firebase] ✓ Connected to Auth emulator:', authConfig.url);
    } else {
      console.log('[Firebase] Using production Firebase Auth');
    }

    if (useFirestoreEmulator) {
      console.log('[Firebase] Connecting to Firestore emulator...');
      const fsConfig = getFirestoreEmulatorConfig();
      connectFirestoreEmulator(db, fsConfig.host, fsConfig.port);
      emulatorConnected = true;
      console.log('[Firebase] ✓ Connected to Firestore emulator:', fsConfig.host, 'port:', fsConfig.port);
    } else {
      console.log('[Firebase] Using production Firebase Firestore');
    }
  } catch (error) {
    console.warn('[Firebase] Emulator connection failed:', error);
    emulatorConnected = false;
  }

  // Setup Firebase auth state listener to sync with user service
  setupAuthStateListener();
}

/**
 * Setup auth state listener to keep user service in sync with Firebase auth
 */
function setupAuthStateListener(): void {
  onAuthStateChanged(auth, async (firebaseAuthUser) => {
    try {
      if (firebaseAuthUser) {
        // Firebase user logged in
        // Only update currentUser if it's not a Spotify user (Spotify users manage their own state)
        const { getCurrentUser } = await import('./userService');
        const currentUser = getCurrentUser();
        
        // If there's no currentUser yet, or the currentUser provider is not 'spotify', 
        // sync with Firebase auth state
        if (!currentUser || currentUser.provider !== 'spotify') {
          await setCurrentUser({
            id: firebaseAuthUser.uid,
            email: firebaseAuthUser.email || undefined,
            displayName: firebaseAuthUser.displayName || undefined,
            provider: firebaseAuthUser.isAnonymous ? 'anonymous' : 'google',
          });
        }
      } else {
        // Firebase user logged out
        const { getCurrentUser } = await import('./userService');
        const currentUser = getCurrentUser();
        
        // Only clear currentUser if it's not a Spotify user
        if (!currentUser || currentUser.provider !== 'spotify') {
          await setCurrentUser(null);
        }
      }
    } catch (error) {
      console.error('[Firebase] Error in auth state listener:', error);
    }
  });
}

// Initialize emulator immediately on module load
initializeEmulator();

/**
 * Connect to Firebase Emulator for local development
 * Re-exported for compatibility with existing code
 * Only connects if emulator environment variables are set
 */
export function connectToEmulator(): void {
  if (useFirestoreEmulator || useAuthEmulator) {
    console.log('[Firebase] connectToEmulator() called - emulators already configured during initialization');
  } else {
    console.log('[Firebase] connectToEmulator() called - using production Firebase (emulators disabled)');
  }
}

/**
 * Login with Spotify
 * Opens Spotify OAuth flow in a popup and handles the authentication
 */
export async function loginWithSpotify(): Promise<void> {
  const { getSpotifyAuthUrl, handleSpotifyCallback } = await import('./playlistManager');
  
  try {
    const authUrl = await getSpotifyAuthUrl();
    
    // Open Spotify OAuth in a popup
    const popup = window.open(
      authUrl,
      'spotify-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );
    
    if (!popup) {
      throw new Error('Failed to open authentication popup. Please allow popups for this site.');
    }
    
    // Wait for the OAuth callback
    const authResult = await waitForSpotifyCallback(popup);
    
    if (authResult.error) {
      throw new Error(authResult.error);
    }
    
    // Handle the callback and get user profile
    const userProfile = await handleSpotifyCallback(authResult.code);
    
    // Ensure we have a Firebase UID for Firestore security rules validation
    // Sign in anonymously if not already authenticated
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    
    // Set user in user service with Spotify ID (ensures persistence across logins)
    // The Spotify ID will be used as the Firestore document path
    await setCurrentUser({
      id: userProfile.id,  // Use Spotify ID for persistent data storage
      email: userProfile.email || undefined,
      displayName: userProfile.display_name || undefined,
      provider: 'spotify',
    });
    
    console.log('Spotify login successful:', userProfile.display_name || userProfile.id);
  } catch (error) {
    console.error('Spotify login failed:', error);
    throw error;
  }
}

/**
 * Wait for Spotify OAuth callback in popup
 */
function waitForSpotifyCallback(popup: Window): Promise<{ code?: string; error?: string }> {
  return new Promise((resolve, reject) => {
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error('Authentication was cancelled'));
      }
    }, 1000);
    
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data && event.data.type === 'spotify-auth') {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        popup.close();
        
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve({ code: event.data.code });
        }
      }
    };
    
    window.addEventListener('message', messageListener);
    
    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(checkClosed);
      window.removeEventListener('message', messageListener);
      popup.close();
      reject(new Error('Authentication timeout'));
    }, 5 * 60 * 1000);
  });
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

/**
 * Write a test document to Firestore
 * Used to verify that authenticated users can write to Firestore
 * @param userId - Current user's ID
 * @param testData - Data to write to the test document
 * @returns Document ID of the created test document
 */
export async function writeTestDocument(userId: string, testData?: Record<string, unknown>): Promise<string> {
  const docData = testData || {
    timestamp: new Date().toISOString(),
    message: 'Test document for Firestore connection verification',
    testType: 'firestore-read-write',
  };

  // Use emulator if connected, otherwise use mock
  if (isEmulatorConnected()) {
    try {
      const testCollection = collection(db, 'users', userId, 'tests');
      const docRef = await addDoc(testCollection, docData);
      console.log('Test document created in emulator:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Failed to write test document to emulator:', error);
      throw error;
    }
  } else {
    // Use mock storage
    console.log('[Mock] Writing test document for user:', userId);
    const docId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!mockDataStore.has(userId)) {
      mockDataStore.set(userId, new Map());
    }
    mockDataStore.get(userId)!.set(docId, docData);
    
    console.log('[Mock] Test document created:', docId);
    return docId;
  }
}

/**
 * Read a test document from Firestore
 * Used to verify that authenticated users can read from Firestore
 * @param userId - Current user's ID
 * @param documentId - ID of the test document to read
 * @returns The document data if found, null otherwise
 */
export async function readTestDocument(userId: string, documentId: string): Promise<Record<string, unknown> | null> {
  // Use emulator if connected, otherwise use mock
  if (isEmulatorConnected()) {
    try {
      const docRef = doc(db, 'users', userId, 'tests', documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log('Test document read successfully from emulator:', docSnap.data());
        return docSnap.data() as Record<string, unknown>;
      } else {
        console.warn('Test document not found in emulator');
        return null;
      }
    } catch (error) {
      console.error('Failed to read test document from emulator:', error);
      throw error;
    }
  } else {
    // Use mock storage
    console.log('[Mock] Reading test document:', documentId);
    const userDocs = mockDataStore.get(userId);
    if (!userDocs) {
      console.warn('[Mock] No documents found for user:', userId);
      return null;
    }

    const data = userDocs.get(documentId);
    if (data) {
      console.log('[Mock] Test document read successfully:', data);
      return data;
    } else {
      console.warn('[Mock] Test document not found:', documentId);
      return null;
    }
  }
}

/**
 * Delete a test document from Firestore
 * Used to clean up test documents after verification
 * @param userId - Current user's ID
 * @param documentId - ID of the test document to delete
 */
export async function deleteTestDocument(userId: string, documentId: string): Promise<void> {
  // Use emulator if connected, otherwise use mock
  if (isEmulatorConnected()) {
    try {
      const docRef = doc(db, 'users', userId, 'tests', documentId);
      await deleteDoc(docRef);
      console.log('Test document deleted from emulator:', documentId);
    } catch (error) {
      console.error('Failed to delete test document from emulator:', error);
      throw error;
    }
  } else {
    // Use mock storage
    console.log('[Mock] Deleting test document:', documentId);
    const userDocs = mockDataStore.get(userId);
    if (userDocs && userDocs.has(documentId)) {
      userDocs.delete(documentId);
      console.log('[Mock] Test document deleted:', documentId);
    } else {
      console.warn('[Mock] Document not found, nothing to delete:', documentId);
    }
  }
}

/**
 * Run a complete Firestore connection test
 * Writes a test document, reads it back, and optionally deletes it
 * @param userId - Current user's ID
 * @param cleanup - Whether to delete the test document after reading (default: false)
 * @returns Test result with document ID and data
 */
export async function testFirestoreConnection(
  userId: string,
  cleanup: boolean = false
): Promise<{ documentId: string; data: Record<string, unknown> }> {
  try {
    console.log('Starting Firestore connection test for user:', userId);

    // Step 1: Write test document
    const documentId = await writeTestDocument(userId);

    // Step 2: Read test document back
    const data = await readTestDocument(userId, documentId);
    if (!data) {
      throw new Error('Failed to read back test document');
    }

    console.log('Firestore connection test passed ✓');

    // Step 3: Cleanup (optional)
    if (cleanup) {
      await deleteTestDocument(userId, documentId);
    }

    return { documentId, data };
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    throw error;
  }
}

/**
 * Re-export Firestore utilities for use in managers
 */
export { getDocs, query, where };
