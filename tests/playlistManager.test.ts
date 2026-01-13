import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSpotifyAuthUrl,
  isSpotifyAuthenticated,
  getCachedPlaylists,
  clearSpotifyCache,
  getCachedUserProfile,
  fetchPlaylistTracks,
  reorderPlaylistTracks,
} from '../src/services/playlistManager';

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
});

describe('Spotify Playlist Manager - Basic Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSpotifyCache();
  });

  describe('getSpotifyAuthUrl', () => {
    it('should generate valid Spotify OAuth URL', async () => {
      const authUrl = await getSpotifyAuthUrl();
      
      expect(authUrl).toContain('https://accounts.spotify.com/authorize');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('code_challenge_method=S256');
      expect(authUrl).toContain('code_challenge=');
    });

    it('should include required scopes', async () => {
      const authUrl = await getSpotifyAuthUrl();
      
      expect(authUrl).toContain('playlist-read-private');
      expect(authUrl).toContain('playlist-modify-private');
      expect(authUrl).toContain('user-read-email');
    });
  });

  describe('Authentication state', () => {
    it('should start unauthenticated', () => {
      expect(isSpotifyAuthenticated()).toBe(false);
      expect(getCachedUserProfile()).toBeNull();
      expect(getCachedPlaylists()).toHaveLength(0);
    });
  });

  describe('clearSpotifyCache', () => {
    it('should clear all cached data', () => {
      clearSpotifyCache();
      
      expect(isSpotifyAuthenticated()).toBe(false);
      expect(getCachedUserProfile()).toBeNull();
      expect(getCachedPlaylists()).toHaveLength(0);
    });
  });

  describe('fetchPlaylistTracks', () => {
    it('should require authentication before fetching tracks', async () => {
      await expect(fetchPlaylistTracks('test-playlist-id')).rejects.toThrow(
        'No Spotify access token available'
      );
    });
  });

  describe('reorderPlaylistTracks', () => {
    it('should require authentication before reordering tracks', async () => {
      await expect(reorderPlaylistTracks('test-playlist-id', 0, 1)).rejects.toThrow(
        'No Spotify access token available'
      );
    });
  });
});