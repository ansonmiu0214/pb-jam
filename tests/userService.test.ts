import { describe, it, expect, beforeEach } from 'vitest';
import { getCurrentUser, setCurrentUser, onUserChange, isUserLoggedIn, clearUser } from '../src/services/userService';

describe('User Service', () => {
  beforeEach(() => {
    // Clear user state before each test
    clearUser();
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return the set user', () => {
      const testUser = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        provider: 'google' as const,
      };

      setCurrentUser(testUser);
      const user = getCurrentUser();

      expect(user).toEqual(testUser);
    });
  });

  describe('setCurrentUser', () => {
    it('should set the current user', () => {
      const testUser = {
        id: 'user123',
        email: 'test@example.com',
        provider: 'google' as const,
      };

      setCurrentUser(testUser);
      expect(getCurrentUser()).toEqual(testUser);
    });

    it('should allow setting user to null', () => {
      const testUser = {
        id: 'user123',
        provider: 'anonymous' as const,
      };

      setCurrentUser(testUser);
      expect(getCurrentUser()).not.toBeNull();

      setCurrentUser(null);
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('isUserLoggedIn', () => {
    it('should return false when no user is logged in', () => {
      expect(isUserLoggedIn()).toBe(false);
    });

    it('should return true when a user is logged in', () => {
      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      setCurrentUser(testUser);
      expect(isUserLoggedIn()).toBe(true);
    });

    it('should return false after clearing user', () => {
      const testUser = {
        id: 'user123',
        provider: 'anonymous' as const,
      };

      setCurrentUser(testUser);
      expect(isUserLoggedIn()).toBe(true);

      clearUser();
      expect(isUserLoggedIn()).toBe(false);
    });
  });

  describe('onUserChange', () => {
    it('should call listener when user changes', () => {
      const listener = vi.fn();
      onUserChange(listener);

      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      setCurrentUser(testUser);

      expect(listener).toHaveBeenCalledWith(testUser);
    });

    it('should call listener with null on logout', () => {
      const listener = vi.fn();

      const testUser = {
        id: 'user123',
        provider: 'anonymous' as const,
      };

      setCurrentUser(testUser);
      onUserChange(listener);

      clearUser();

      expect(listener).toHaveBeenCalledWith(null);
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = onUserChange(listener);

      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      setCurrentUser(testUser);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      clearUser();

      // Listener should not be called after unsubscribing
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      onUserChange(listener1);
      onUserChange(listener2);

      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      setCurrentUser(testUser);

      expect(listener1).toHaveBeenCalledWith(testUser);
      expect(listener2).toHaveBeenCalledWith(testUser);
    });
  });

  describe('clearUser', () => {
    it('should clear the current user', () => {
      const testUser = {
        id: 'user123',
        provider: 'anonymous' as const,
      };

      setCurrentUser(testUser);
      expect(getCurrentUser()).not.toBeNull();

      clearUser();
      expect(getCurrentUser()).toBeNull();
    });

    it('should trigger user change listeners', () => {
      const listener = vi.fn();
      onUserChange(listener);

      const testUser = {
        id: 'user123',
        provider: 'google' as const,
      };

      setCurrentUser(testUser);
      listener.mockClear();

      clearUser();

      expect(listener).toHaveBeenCalledWith(null);
    });
  });

  describe('Different user providers', () => {
    it('should store google provider user', () => {
      const googleUser = {
        id: 'google-123',
        email: 'user@gmail.com',
        displayName: 'Google User',
        provider: 'google' as const,
      };

      setCurrentUser(googleUser);
      expect(getCurrentUser()).toEqual(googleUser);
    });

    it('should store anonymous provider user', () => {
      const anonUser = {
        id: 'anon-123',
        provider: 'anonymous' as const,
      };

      setCurrentUser(anonUser);
      expect(getCurrentUser()).toEqual(anonUser);
    });

    it('should store spotify provider user', () => {
      const spotifyUser = {
        id: 'spotify-123',
        email: 'user@spotify.com',
        displayName: 'Spotify User',
        provider: 'spotify' as const,
      };

      setCurrentUser(spotifyUser);
      expect(getCurrentUser()).toEqual(spotifyUser);
    });
  });
});
