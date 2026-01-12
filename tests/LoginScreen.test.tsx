import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, vi } from 'vitest';
import { LoginScreen } from '../src/components/LoginScreen';
import { spotifyTheme } from '../src/theme/spotifyTheme';

// Mock Firebase auth functions
vi.mock('../src/services/firebaseService', () => ({
  loginWithGoogle: vi.fn(),
  loginAnonymously: vi.fn(),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={spotifyTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('LoginScreen', () => {
  test('renders login screen with title', () => {
    renderWithTheme(<LoginScreen />);
    
    expect(screen.getByText('PB Jam')).toBeInTheDocument();
    expect(screen.getByText('Spotify Race Playlist Visualizer')).toBeInTheDocument();
  });

  test('renders login buttons', () => {
    renderWithTheme(<LoginScreen />);
    
    expect(screen.getByRole('button', { name: /login with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue anonymously/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login with spotify/i })).toBeDisabled();
  });
});