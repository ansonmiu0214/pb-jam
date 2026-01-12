import { describe, it, expect, beforeEach } from 'vitest';
// import { getCurrentUser as getFirebaseUser } from '../src/services/firebaseService';
import { getCurrentUser, setCurrentUser, isUserLoggedIn } from '../src/services/userService';

/**
 * Integration tests for authentication flow
 * Tests that user can authenticate and state is properly stored
 */
describe('Authentication Flow', () => {
  beforeEach(async () => {
    // Clear user state before each test
    await setCurrentUser(null);
  });

  describe('User authentication', () => {
    it('should store user data after login', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'google' as const,
      };

      await setCurrentUser(mockUser);

      expect(isUserLoggedIn()).toBe(true);
      expect(getCurrentUser()).toEqual(mockUser);
    });

    it('should return valid user after setting', async () => {
      const mockUser = {
        id: 'anon-user-456',
        provider: 'anonymous' as const,
      };

      await setCurrentUser(mockUser);
      const user = getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.id).toBe('anon-user-456');
      expect(user?.provider).toBe('anonymous');
    });

    it('should have required fields for logged-in user', async () => {
      const mockUser = {
        id: 'user-789',
        email: 'user@test.com',
        displayName: 'Test User',
        provider: 'google' as const,
      };

      await setCurrentUser(mockUser);
      const user = getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.id).toBeDefined();
      expect(user?.provider).toBeDefined();
    });
  });

  describe('Anonymous login flow', () => {
    it('should create anonymous user with valid ID', async () => {
      const anonUser = {
        id: 'anon-' + Math.random().toString(36).substr(2, 9),
        provider: 'anonymous' as const,
      };

      await setCurrentUser(anonUser);

      expect(isUserLoggedIn()).toBe(true);
      expect(getCurrentUser()?.provider).toBe('anonymous');
      expect(getCurrentUser()?.id).toBeTruthy();
    });

    it('should not require email for anonymous user', async () => {
      const anonUser = {
        id: 'anon-123',
        provider: 'anonymous' as const,
      };

      await setCurrentUser(anonUser);
      const user = getCurrentUser();

      expect(user?.email).toBeUndefined();
      expect(user?.displayName).toBeUndefined();
    });
  });

  describe('Google login flow', () => {
    it('should create user with email from Google', async () => {
      const googleUser = {
        id: 'google-123',
        email: 'user@gmail.com',
        displayName: 'Google User',
        provider: 'google' as const,
      };

      await setCurrentUser(googleUser);
      const user = getCurrentUser();

      expect(user?.email).toBe('user@gmail.com');
      expect(user?.provider).toBe('google');
      expect(user?.displayName).toBe('Google User');
    });

    it('should handle Google user without display name', async () => {
      const googleUser = {
        id: 'google-456',
        email: 'user2@gmail.com',
        provider: 'google' as const,
      };

      await setCurrentUser(googleUser);
      const user = getCurrentUser();

      expect(user?.email).toBe('user2@gmail.com');
      expect(user?.displayName).toBeUndefined();
    });
  });

  describe('User ID persistence', () => {
    it('should maintain user ID across multiple accesses', async () => {
      const userId = 'persistent-user-id';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        provider: 'google' as const,
      };

      await setCurrentUser(mockUser);

      const firstAccess = getCurrentUser();
      const secondAccess = getCurrentUser();

      expect(firstAccess?.id).toBe(userId);
      expect(secondAccess?.id).toBe(userId);
      expect(firstAccess?.id).toBe(secondAccess?.id);
    });

    it('should change user ID when switching users', async () => {
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        provider: 'google' as const,
      };

      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        provider: 'google' as const,
      };

      await setCurrentUser(user1);
      expect(getCurrentUser()?.id).toBe('user-1');

      await setCurrentUser(user2);
      expect(getCurrentUser()?.id).toBe('user-2');
    });
  });

  describe('Login state validation', () => {
    it('should correctly report login status', async () => {
      expect(isUserLoggedIn()).toBe(false);

      const mockUser = {
        id: 'user-123',
        provider: 'google' as const,
      };

      await setCurrentUser(mockUser);
      expect(isUserLoggedIn()).toBe(true);

      await setCurrentUser(null);
      expect(isUserLoggedIn()).toBe(false);
    });

    it('should return null for user when not logged in', () => {
      expect(getCurrentUser()).toBeNull();
      expect(isUserLoggedIn()).toBe(false);
    });

    it('should provide different user info based on provider', async () => {
      const providers = ['google', 'spotify', 'anonymous'] as const;

      for (const provider of providers) {
        await setCurrentUser({
          id: `${provider}-user`,
          email: provider !== 'anonymous' ? `user@${provider}.com` : undefined,
          provider,
        });

        const user = getCurrentUser();
        expect(user?.provider).toBe(provider);
      }
    });
  });
});
