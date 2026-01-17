/**
 * Spotify playlist management service
 * Handles OAuth authentication, playlist fetching, and caching
 */

import { SpotifyPlaylist, SpotifyUserProfile } from '../models/types';

// Get crypto.subtle for PKCE code challenge generation
// Works in browser and Node.js 18+
const getCryptoSubtle = () => {
  // Try global crypto first (browser or Node 20+)
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  // For Node 18, use dynamic import as fallback in tests
  // In production (browser), globalThis.crypto.subtle will be available
  return globalThis.crypto?.subtle;
};

// Spotify API configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;
console.log(`SPOTIFY_REDIRECT_URI: ${SPOTIFY_REDIRECT_URI}`);

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Cache for user playlists and authentication state
let spotifyAccessToken: string | null = null;
let spotifyRefreshToken: string | null = null;
let tokenExpiresAt: number | null = null;
let cachedPlaylists: SpotifyPlaylist[] = [];
let cachedUserProfile: SpotifyUserProfile | null = null;

// PKCE variables for secure frontend OAuth
let codeVerifier: string | null = null;
let codeChallenge: string | null = null;

/**
 * Generate Spotify OAuth URL for authentication using PKCE
 */
export async function getSpotifyAuthUrl(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('Spotify client ID not configured. Please set VITE_SPOTIFY_CLIENT_ID environment variable.');
  }

  // Generate PKCE code verifier and challenge
  codeVerifier = generateCodeVerifier();
  codeChallenge = await generateCodeChallenge(codeVerifier);
  
  console.log('Generated PKCE verifier length:', codeVerifier.length);
  console.log('Generated PKCE challenge length:', codeChallenge.length);

  const scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-read-email',
    'user-read-private'
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scopes,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: generateRandomString(16),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  console.log('Generated auth URL with PKCE');
  return authUrl;
}

/**
 * Handle Spotify OAuth callback with PKCE
 */
export async function handleSpotifyCallback(code: string): Promise<SpotifyUserProfile> {
  if (!codeVerifier) {
    throw new Error('Code verifier not found. Please restart the authentication flow.');
  }

  try {
    console.log('Exchanging code for token with PKCE...');
    
    // Exchange authorization code for access token using PKCE
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'parse_error', error_description: errorText };
      }
      
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');
    
    // Store tokens
    spotifyAccessToken = tokenData.access_token;
    spotifyRefreshToken = tokenData.refresh_token;
    tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
    
    // Clear PKCE data
    codeVerifier = null;
    codeChallenge = null;
    
    console.log('Spotify authentication successful');
    
    // Fetch and cache user profile
    const userProfile = await fetchUserProfile();
    cachedUserProfile = userProfile;
    
    return userProfile;
  } catch (error) {
    console.error('Spotify OAuth callback failed:', error);
    // Clear PKCE data on error
    codeVerifier = null;
    codeChallenge = null;
    throw error;
  }
}

/**
 * Check if user is authenticated with Spotify
 */
export function isSpotifyAuthenticated(): boolean {
  return !!spotifyAccessToken && !!tokenExpiresAt && Date.now() < tokenExpiresAt;
}

/**
 * Get cached user profile
 */
export function getCachedUserProfile(): SpotifyUserProfile | null {
  return cachedUserProfile;
}

/**
 * Fetch user profile from Spotify API
 */
export async function fetchUserProfile(): Promise<SpotifyUserProfile> {
  await ensureValidToken();
  
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${spotifyAccessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch user playlists from Spotify API and cache them
 */
export async function fetchPlaylists(forceRefresh = false): Promise<SpotifyPlaylist[]> {
  // Return cached playlists if available and not forcing refresh
  if (cachedPlaylists.length > 0 && !forceRefresh) {
    console.log(`Returning ${cachedPlaylists.length} cached playlists`);
    return cachedPlaylists;
  }
  
  await ensureValidToken();
  
  try {
    const allPlaylists: SpotifyPlaylist[] = [];
    let nextUrl = `${SPOTIFY_API_BASE}/me/playlists?limit=50`;
    
    // Fetch all playlists using pagination
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.statusText}`);
      }
      
      const data = await response.json();
      allPlaylists.push(...data.items);
      nextUrl = data.next;
    }
    
    // Cache the playlists
    cachedPlaylists = allPlaylists;
    console.log(`Fetched and cached ${allPlaylists.length} playlists from Spotify`);
    
    return allPlaylists;
  } catch (error) {
    console.error('Failed to fetch playlists:', error);
    throw error;
  }
}

/**
 * Get cached playlists without making API call
 */
export function getCachedPlaylists(): SpotifyPlaylist[] {
  return cachedPlaylists;
}

/**
 * Fetch audio features for tracks to get BPM data with exponential backoff retry
 */
async function fetchAudioFeaturesForTracks(tracks: import('../models/types').SpotifyTrack[]): Promise<void> {
  if (tracks.length === 0) return;
  
  console.log(`Starting BPM fetch for ${tracks.length} tracks`);
  await ensureValidToken();
  
  // Spotify API allows up to 100 track IDs per request for audio features
  const batchSize = 100;
  const maxRetries = 3;
  
  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, i + batchSize);
    const trackIds = batch.map(track => track.id).join(',');
    
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount < maxRetries) {
      try {
        const response = await fetch(
          `${SPOTIFY_API_BASE}/audio-features?ids=${trackIds}`,
          {
            headers: {
              Authorization: `Bearer ${spotifyAccessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          console.warn(`Attempt ${retryCount + 1}/${maxRetries}: Failed to fetch audio features: ${response.status}`);
          
          // Check if it's an auth issue (401) vs rate limiting (429) vs other error (403)
          if (response.status === 401 && spotifyRefreshToken && retryCount === 0) {
            console.log('Got 401, attempting to refresh token...');
            try {
              await refreshAccessToken();
              console.log('Token refreshed, will retry');
              retryCount++; // Don't count this as a full retry
              continue;
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              lastError = refreshError;
              break;
            }
          }
          
          // For rate limiting or other errors, wait before retrying
          if (retryCount < maxRetries - 1 && (response.status === 429 || response.status === 403)) {
            const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            console.warn(`Waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            retryCount++;
            continue;
          }
          
          // If we got a 403 and no retries left, log and skip
          if (response.status === 403) {
            console.warn(`Spotify API returned 403 Forbidden for audio-features endpoint. BPM data unavailable.`);
            console.warn(`Error response: ${errorBody}`);
            break; // Give up on this batch
          }
          
          lastError = new Error(`API error: ${response.status}`);
          break;
        }

        const data = await response.json();
        
        // Match audio features back to tracks
        if (data.audio_features) {
          let successCount = 0;
          data.audio_features.forEach((features: {tempo?: number} | null, index: number) => {
            if (features && features.tempo && batch[index]) {
              batch[index].bpm = Math.round(features.tempo);
              successCount++;
            }
          });
          if (successCount > 0) {
            console.log(`Successfully fetched BPM for ${successCount}/${batch.length} tracks in batch`);
          } else {
            console.warn(`No tempo data found for any tracks in this batch of ${batch.length} tracks`);
          }
        } else {
          console.warn('No audio_features data in response');
        }
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        if (retryCount < maxRetries - 1) {
          const delayMs = Math.pow(2, retryCount) * 1000;
          console.warn(`Error fetching audio features, waiting ${delayMs}ms before retry:`, error);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          retryCount++;
        } else {
          console.error('Error fetching audio features (final attempt):', error);
          break;
        }
      }
    }
    
    if (lastError && retryCount >= maxRetries) {
      console.warn(`Failed to fetch BPM for batch after ${maxRetries} attempts. Continuing without BPM data.`);
    }
  }
  
  const tracksWithBPM = tracks.filter(track => track.bpm).length;
  console.log(`BPM fetch completed: ${tracksWithBPM}/${tracks.length} tracks have BPM data`);
}

/**
 * Fetch tracks from a Spotify playlist
 */
export async function fetchPlaylistTracks(playlistId: string): Promise<import('../models/types').SpotifyTrack[]> {
  await ensureValidToken();
  
  const tracks: import('../models/types').SpotifyTrack[] = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}&fields=items(track(id,name,artists(name),duration_ms,uri))`,
      {
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist tracks: ${response.statusText}`);
    }

    const data = await response.json();
    
    data.items.forEach((item: {track?: {id?: string; name?: string; artists?: {name?: string}[]; duration_ms?: number; uri?: string}}) => {
      if (item.track && item.track.id) {
        tracks.push({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          durationMs: item.track.duration_ms,
          uri: item.track.uri,
        });
      }
    });

    hasMore = data.items.length === limit;
    offset += limit;
  }

  // Fetch audio features for BPM data in batches
  await fetchAudioFeaturesForTracks(tracks);

  return tracks;
}

/**
 * Reorder tracks in a Spotify playlist
 */
export async function reorderPlaylistTracks(
  playlistId: string,
  fromIndex: number,
  toIndex: number,
  rangeLength = 1
): Promise<void> {
  await ensureValidToken();

  const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${spotifyAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range_start: fromIndex,
      range_length: rangeLength,
      insert_before: toIndex,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reorder playlist tracks: ${response.statusText}`);
  }
}

/**
 * Clear cached data (for logout)
 */
export function clearSpotifyCache(): void {
  spotifyAccessToken = null;
  spotifyRefreshToken = null;
  tokenExpiresAt = null;
  cachedPlaylists = [];
  cachedUserProfile = null;
  console.log('Spotify cache cleared');
}

/**
 * Ensure we have a valid access token, refresh if necessary
 */
async function ensureValidToken(): Promise<void> {
  if (!spotifyAccessToken) {
    throw new Error('No Spotify access token available. Please authenticate first.');
  }
  
  // Check if token is expired or will expire in the next 5 minutes
  if (tokenExpiresAt && Date.now() >= (tokenExpiresAt - 5 * 60 * 1000)) {
    if (!spotifyRefreshToken) {
      throw new Error('Spotify token expired and no refresh token available. Please re-authenticate.');
    }
    
    await refreshAccessToken();
  }
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<void> {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: spotifyRefreshToken!,
        client_id: SPOTIFY_CLIENT_ID,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
    }
    
    const tokenData = await response.json();
    
    spotifyAccessToken = tokenData.access_token;
    tokenExpiresAt = Date.now() + (tokenData.expires_in * 1000);
    
    // Update refresh token if provided
    if (tokenData.refresh_token) {
      spotifyRefreshToken = tokenData.refresh_token;
    }
    
    console.log('Spotify access token refreshed');
  } catch (error) {
    console.error('Failed to refresh Spotify token:', error);
    // Clear tokens on refresh failure
    spotifyAccessToken = null;
    spotifyRefreshToken = null;
    tokenExpiresAt = null;
    throw error;
  }
}

/**
 * Generate a random string for OAuth state parameter
 */
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Generate PKCE code verifier
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generate PKCE code challenge
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const subtle = getCryptoSubtle();
  if (!subtle) {
    throw new Error('crypto.subtle is not available in this environment');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

/**
 * Base64 URL encode (RFC 4648 § 5)
 */
function base64URLEncode(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...Array.from(array)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
