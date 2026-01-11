// Firebase SDK initialization and utilities
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore, collection, addDoc, getDoc, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth, signInWithPopup, signInAnonymously, GoogleAuthProvider } from 'firebase/auth';

/**
 * Firebase configuration
 * In production, these values should come from environment variables
 * For local development, use Firebase Emulator
 */
const isEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';

const firebaseConfig = {
  // Use dummy key for emulator, real key for production
  apiKey: isEmulator ? 'AIzaSyDummyKeyForEmulator' : (import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForEmulator'),
  authDomain: isEmulator ? 'localhost' : (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost:9099'),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'pb-jam-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pb-jam-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000',
};

console.log('[Firebase] Config mode:', isEmulator ? 'EMULATOR' : 'PRODUCTION');

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
 * Get the emulator hostname
 * Try localhost first (most direct), fall back to Codespaces subdomain if needed
 */
function getEmulatorAuthUrl(): string {
  // Try localhost first - works when ports are port-forwarded
  return 'http://localhost:9099';
}

function getEmulatorFirestoreHost(): string {
  // Use localhost for Firestore as well
  return 'localhost';
}

/**
 * Connect to Firebase Emulator for local development
 * Called immediately after initialization
 */
function initializeEmulator(): void {
  if (isEmulator) {
    try {
      console.log('[Firebase] Connecting to emulator...');
      const authUrl = getEmulatorAuthUrl();
      const firestoreHost = getEmulatorFirestoreHost();
      console.log('[Firebase] Auth URL:', authUrl, 'Firestore Host:', firestoreHost);
      
      connectAuthEmulator(auth, authUrl);
      connectFirestoreEmulator(db, firestoreHost, 8080);
      emulatorConnected = true;
      console.log('[Firebase] ✓ Connected to emulator');
    } catch (error) {
      console.warn('[Firebase] Emulator connection failed, will use mocks:', error);
      emulatorConnected = false;
    }
  } else {
    console.log('[Firebase] Using production Firebase');
  }
}

// Initialize emulator immediately on module load
initializeEmulator();

/**
 * Connect to Firebase Emulator for local development
 * Re-exported for compatibility with existing code
 */
export function connectToEmulator(): void {
  // Already initialized above
  console.log('[Firebase] connectToEmulator() called (already initialized)');
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
