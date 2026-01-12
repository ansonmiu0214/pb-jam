import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, vi, beforeEach, test } from 'vitest';
import { LoginScreen } from '../src/components/LoginScreen';
import { spotifyTheme } from '../src/theme/spotifyTheme';

// Mock Firebase auth functions
vi.mock('../src/services/firebaseService', () => ({
  loginWithGoogle: vi.fn(),
  loginAnonymously: vi.fn(),
  loginWithSpotify: vi.fn(),
}));

const firebaseService = await import('../src/services/firebaseService');
const mockLoginWithGoogle = vi.mocked(firebaseService.loginWithGoogle);
const mockLoginAnonymously = vi.mocked(firebaseService.loginAnonymously);
const mockLoginWithSpotify = vi.mocked(firebaseService.loginWithSpotify);

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={spotifyTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders login screen with title', () => {
    renderWithTheme(<LoginScreen />);
    
    expect(screen.getByText('PB Jam')).toBeInTheDocument();
    expect(screen.getByText('Spotify Race Playlist Visualizer')).toBeInTheDocument();
  });

  test('renders all login buttons', () => {
    renderWithTheme(<LoginScreen />);
    
    expect(screen.getByRole('button', { name: /login with spotify/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue anonymously/i })).toBeInTheDocument();
  });

  test('spotify login button calls loginWithSpotify', async () => {
    renderWithTheme(<LoginScreen />);
    
    const spotifyButton = screen.getByRole('button', { name: /login with spotify/i });
    fireEvent.click(spotifyButton);
    
    expect(mockLoginWithSpotify).toHaveBeenCalledTimes(1);
  });

  test('google login button calls loginWithGoogle', async () => {
    renderWithTheme(<LoginScreen />);
    
    const googleButton = screen.getByRole('button', { name: /login with google/i });
    fireEvent.click(googleButton);
    
    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
  });

  test('anonymous login button calls loginAnonymously', async () => {
    renderWithTheme(<LoginScreen />);
    
    const anonymousButton = screen.getByRole('button', { name: /continue anonymously/i });
    fireEvent.click(anonymousButton);
    
    expect(mockLoginAnonymously).toHaveBeenCalledTimes(1);
  });

  test('displays error message when login fails', async () => {
    const errorMessage = 'Authentication failed';
    mockLoginWithSpotify.mockRejectedValue(new Error(errorMessage));
    
    renderWithTheme(<LoginScreen />);
    
    const spotifyButton = screen.getByRole('button', { name: /login with spotify/i });
    fireEvent.click(spotifyButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('disables buttons during loading', async () => {
    mockLoginWithSpotify.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithTheme(<LoginScreen />);
    
    const spotifyButton = screen.getByRole('button', { name: /login with spotify/i });
    fireEvent.click(spotifyButton);
    
    await waitFor(() => {
      expect(spotifyButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /login with google/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /continue anonymously/i })).toBeDisabled();
    });
  });
});