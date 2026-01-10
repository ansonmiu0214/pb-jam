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
  tags: string[];
  pacePlans?: PacePlan[];
  createdAt?: Date;
  updatedAt?: Date;
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
 * User authentication state
 */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  spotifyId?: string;
}
