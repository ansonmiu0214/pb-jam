import { describe, it, expect, beforeAll } from 'vitest';
import { verifyFirebaseConnection, connectToEmulator } from '../src/services/firebaseService';

describe('Firebase Service', () => {
  beforeAll(() => {
    // Connect to emulator in test environment
    connectToEmulator();
  });

  it('should initialize Firebase configuration', async () => {
    const verified = await verifyFirebaseConnection();
    expect(verified).toBe(true);
  });

  it('should have Firestore initialized', async () => {
    const isVerified = await verifyFirebaseConnection();
    expect(isVerified).toBe(true);
  });
});
