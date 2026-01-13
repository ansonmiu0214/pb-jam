/**
 * Core type definitions for PB Jam
 */

/**
 * Split within a pace plan
 */
export interface Split {
  distance: number;
  targetTime: number; // in seconds
  pace: number; // pace per unit (e.g., minutes per km)
  elevation?: number; // optional elevation change
}

/**
 * Pace plan for a race
 */
export interface PacePlan {
  id: string;
  userId: string;
  raceId: string;
  title: string;
  targetTime: number; // in seconds
  splits: Split[];
  spotifyPlaylistId?: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Race event
 */
export interface Race {
  id: string;
  userId: string;
  title: string;
  distance: number;
  unit: 'km' | 'mi';
  raceDate?: Date; // Scheduled date of the race (independent from createdAt)
  tags: string[];
  pacePlans?: PacePlan[];
  createdAt?: Date; // When the race record was created
  updatedAt?: Date; // When the race record was last modified
}

/**
 * Spotify track representation
 */
export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  durationMs: number;
  uri: string;
}

/**
 * Spotify playlist representation
 */
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: {
    total: number;
  };
  owner: {
    id: string;
    display_name: string;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
}

/**
 * Spotify user profile representation
 */
export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email?: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
}

/**
 * User authentication state
 */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  spotifyId?: string;
}
