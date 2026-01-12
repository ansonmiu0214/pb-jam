import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, expect, beforeEach, vi } from 'vitest';
import { App } from '../src/components/App';
import { spotifyTheme } from '../src/theme/spotifyTheme';
import * as userService from '../src/services/userService';

// Mock Firebase and user services
vi.mock('../src/services/firebaseService', () => ({
  connectToEmulator: vi.fn(),
}));

vi.mock('../src/services/userService', () => ({
  getCurrentUser: vi.fn(),
  onUserChange: vi.fn(() => () => {}), // Return unsubscribe function
  isUserLoggedIn: vi.fn(),
}));

vi.mock('../src/managers/raceManager', () => ({
  fetchRaces: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/managers/pacePlanManager', () => ({
  fetchPacePlans: vi.fn().mockResolvedValue([]),
}));

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={spotifyTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('App', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  test('renders login screen when user is not logged in', async () => {
    vi.mocked(userService.isUserLoggedIn).mockReturnValue(false);

    renderWithTheme(<App />);
    
    // Wait for component to settle
    await screen.findByText('PB Jam');
    expect(screen.getByText('Spotify Race Playlist Visualizer')).toBeInTheDocument();
  });

  test('renders main app when user is logged in', async () => {
    vi.mocked(userService.isUserLoggedIn).mockReturnValue(true);
    vi.mocked(userService.getCurrentUser).mockReturnValue({ id: 'test-user', email: 'test@example.com' });

    renderWithTheme(<App />);
    
    // Wait for the main app to render
    await screen.findByText('Races');
    expect(screen.getByRole('heading', { name: 'Pace Plans', level: 4 })).toBeInTheDocument();
  });
});