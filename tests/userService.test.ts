import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCurrentUser, setCurrentUser, onUserChange, isUserLoggedIn, clearUser } from '../src/services/userService';

describe('User Service', () => {
  beforeEach(async () => {
    // Clear user state before each test
    await clearUser();
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return the set user', async () => {
      const testUser = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'google' as const,
      };

      await setCurrentUser(testUser);
      const user = getCurrentUser();

      expect(user).toEqual(testUser);
    });
  });

  describe('setCurrentUser', () => {
    it('should set the current user', async () => {
      const testUser = {
        id: 'user123',
        email: 'test@example.com',
        provider: 'google' as const,
      };

      await setCurrentUser(testUser);
      expect(getCurrentUser()).toEqual(testUser);
    });

    it('should allow setting user to null', async () => {
      const testUser = {
        id: 'user123',
        provider: 'anonymous' as const,
      };

      await setCurrentUser(testUser);
      expect(getCurrentUser()).not.toBeNull();

      await setCurrentUser(null);
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('isUserLoggedIn', () => {
    it('should return false when no user is logged in', () => {
      expect(isUserLoggedIn()).toBe(false);
    });

    it('should return true when a user is logged in', async () => {
      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      await setCurrentUser(testUser);
      expect(isUserLoggedIn()).toBe(true);
    });

    it('should return false after clearing user', async () => {
      const testUser = {
        id: 'user123',
        provider: 'anonymous' as const,
      };

      await setCurrentUser(testUser);
      expect(isUserLoggedIn()).toBe(true);

      await clearUser();
      expect(isUserLoggedIn()).toBe(false);
    });
  });

  describe('onUserChange', () => {
    it('should call listener when user changes', async () => {
      const listener = vi.fn();
      onUserChange(listener);

      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      await setCurrentUser(testUser);

      expect(listener).toHaveBeenCalledWith(testUser);
    });

    it('should call listener with null on logout', async () => {
      const listener = vi.fn();

      const testUser = {
        id: 'user123',
        provider: 'anonymous' as const,
      };

      await setCurrentUser(testUser);
      onUserChange(listener);

      await clearUser();

      expect(listener).toHaveBeenCalledWith(null);
    });

    it('should return unsubscribe function', async () => {
      const listener = vi.fn();
      const unsubscribe = onUserChange(listener);

      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      await setCurrentUser(testUser);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      await clearUser();

      // Listener should not be called after unsubscribing
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      onUserChange(listener1);
      onUserChange(listener2);

      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      await setCurrentUser(testUser);

      expect(listener1).toHaveBeenCalledWith(testUser);
      expect(listener2).toHaveBeenCalledWith(testUser);
    });
  });

  describe('clearUser', () => {
    it('should clear the current user', async () => {
      const testUser = {
        id: 'user123',
        provider: 'anonymous' as const,
      };

      await setCurrentUser(testUser);
      expect(getCurrentUser()).not.toBeNull();

      await clearUser();
      expect(getCurrentUser()).toBeNull();
    });

    it('should trigger user change listeners', async () => {
      const listener = vi.fn();
      onUserChange(listener);

      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      await setCurrentUser(testUser);
      listener.mockClear();

      await clearUser();

      expect(listener).toHaveBeenCalledWith(null);
    });
  });

  describe('Different user providers', () => {
    it('should store google provider user', async () => {
      const googleUser = {
        id: 'google-123',
        email: 'user@gmail.com',
        displayName: 'Google User',
        provider: 'google' as const,
      };

      await setCurrentUser(googleUser);
      expect(getCurrentUser()).toEqual(googleUser);
    });

    it('should store anonymous provider user', async () => {
      const anonUser = {
        id: 'anon-123',
        provider: 'anonymous' as const,
      };

      await setCurrentUser(anonUser);
      expect(getCurrentUser()).toEqual(anonUser);
    });

    it('should store spotify provider user', async () => {
      const spotifyUser = {
        id: 'spotify-123',
        email: 'user@spotify.com',
        displayName: 'Spotify User',
        provider: 'spotify' as const,
      };

      await setCurrentUser(spotifyUser);
      expect(getCurrentUser()).toEqual(spotifyUser);
    });
  });
});
