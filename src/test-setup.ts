import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global confirm function for tests
global.confirm = vi.fn(() => true);

// Mock Firebase before any service imports
vi.mock('firebase/auth', () => ({
  initializeApp: vi.fn(),
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
  onAuthStateChanged: vi.fn((_auth, _callback) => {
    // Return unsubscribe function
    return vi.fn()
  }),
  signInAnonymously: vi.fn(() => Promise.resolve({
    user: {
      uid: 'test-firebase-uid',
      email: null,
      displayName: null,
    },
  })),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithPopup: vi.fn(() => Promise.resolve({
    user: {
      uid: 'test-firebase-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  })),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  getFirestore: vi.fn(() => ({
    _type: 'firestore',
  })),
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));