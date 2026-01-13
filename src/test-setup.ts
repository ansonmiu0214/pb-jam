import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill crypto.subtle for Node 18 compatibility
if (!globalThis.crypto?.subtle) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webcrypto } = require('crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

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