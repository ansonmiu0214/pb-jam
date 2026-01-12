/**
 * Spotify playlist management service
 * Handles OAuth authentication, playlist fetching, and caching
 */

import { SpotifyPlaylist, SpotifyUserProfile } from '../models/types';

// Spotify API configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;
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
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
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
