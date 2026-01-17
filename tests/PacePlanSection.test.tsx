import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import { PacePlanSection } from '../src/components/PacePlanSection';
import { UnitProvider } from '../src/contexts/UnitContext';
import { spotifyTheme } from '../src/theme/spotifyTheme';
import * as userService from '../src/services/userService';
import * as raceManager from '../src/managers/raceManager';
import * as pacePlanManager from '../src/managers/pacePlanManager';
import * as playlistManager from '../src/services/playlistManager';
import type { Race, PacePlan, Split } from '../src/models/types';

// Mock modules
vi.mock('../src/services/userService');
vi.mock('../src/managers/raceManager');
vi.mock('../src/managers/pacePlanManager');
vi.mock('../src/services/playlistManager');

const MockedUserService = vi.mocked(userService);
const MockedRaceManager = vi.mocked(raceManager);
const MockedPacePlanManager = vi.mocked(pacePlanManager);
const MockedPlaylistManager = vi.mocked(playlistManager);

// Test data
const mockRace: Race = {
  id: 'race-1',
  userId: 'user-1',
  title: 'Test Marathon',
  distance: 42.2,
  unit: 'km',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSplits: Split[] = [
  { distance: 21.1, targetTime: 3600, pace: 5.69, elevation: 0 },
  { distance: 21.1, targetTime: 3600, pace: 5.69, elevation: 0 },
];

const mockPacePlan: PacePlan = {
  id: 'paceplan-1',
  userId: 'user-1',
  raceId: 'race-1',
  title: 'Test Pace Plan',
  targetTime: 7200,
  splits: mockSplits,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={spotifyTheme}>
      <UnitProvider defaultUnit="km">
        {component}
      </UnitProvider>
    </ThemeProvider>
  );
};

describe.skip('PacePlanSection Split Editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    MockedUserService.getCurrentUser.mockReturnValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      provider: 'anonymous'
    });
    
    MockedRaceManager.fetchRaces.mockResolvedValue([mockRace]);
    MockedPacePlanManager.fetchPacePlans.mockResolvedValue([mockPacePlan]);
    MockedPlaylistManager.isSpotifyAuthenticated.mockReturnValue(false);
    MockedPlaylistManager.getCachedPlaylists.mockReturnValue([]);
  });

  it.skip('should display splits editing UI when edit button is clicked', async () => {
    renderWithTheme(<PacePlanSection />);
    
    // Wait for races to load - FormControl should be enabled when races are loaded
    await waitFor(() => {
      const raceSelect = screen.getByLabelText('Select Race');
      expect(raceSelect).not.toBeDisabled();
    });
    
    // Click the race select dropdown
    const raceSelect = screen.getByLabelText('Select Race');
    fireEvent.click(raceSelect);
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Test Marathon (42.20 km)')).toBeInTheDocument();
    });

    // Select the race  
    fireEvent.click(screen.getByText('Test Marathon (42.20 km)'));

    // Wait for pace plans to load
    await waitFor(() => {
      expect(screen.getByText('Test Pace Plan')).toBeInTheDocument();
    });

    // Click edit splits button
    const editButton = screen.getByTitle('Edit Splits');
    fireEvent.click(editButton);

    // Check if splits editing UI is shown
    await waitFor(() => {
      expect(screen.getByText('Edit Splits')).toBeInTheDocument();
      expect(screen.getByText('Distance (km)')).toBeInTheDocument();
      expect(screen.getByText('Target Time')).toBeInTheDocument();
      expect(screen.getByText('Pace (min/km)')).toBeInTheDocument();
      expect(screen.getByText('Add Split')).toBeInTheDocument();
    });
  });

  it.skip('should allow editing split distance and target time', async () => {
    renderWithTheme(<PacePlanSection />);
    
    // Wait for races to load - FormControl should be enabled when races are loaded
    await waitFor(() => {
      const raceSelect = screen.getByLabelText('Select Race');
      expect(raceSelect).not.toBeDisabled();
    });
    
    // Click the race select dropdown
    const raceSelect = screen.getByLabelText('Select Race');
    fireEvent.click(raceSelect);
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Test Marathon (42.20 km)')).toBeInTheDocument();
    });
    fireEvent.click(raceSelect);
    fireEvent.click(screen.getByText('Test Marathon (42.20 km)'));

    await waitFor(() => {
      expect(screen.getByText('Test Pace Plan')).toBeInTheDocument();
    });

    // Click edit splits button
    const editButton = screen.getByTitle('Edit Splits');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Splits')).toBeInTheDocument();
    });

    // Edit the first split distance
    const distanceInputs = screen.getAllByDisplayValue('21.1');
    fireEvent.change(distanceInputs[0], { target: { value: '20' } });

    // Edit the first split target time
    const targetTimeInputs = screen.getAllByDisplayValue('3600');
    fireEvent.change(targetTimeInputs[0], { target: { value: '3500' } });

    // Verify the inputs have changed
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3500')).toBeInTheDocument();
  });

  it.skip('should allow adding new splits', async () => {
    renderWithTheme(<PacePlanSection />);
    
    // Wait for races to load - FormControl should be enabled when races are loaded
    await waitFor(() => {
      const raceSelect = screen.getByLabelText('Select Race');
      expect(raceSelect).not.toBeDisabled();
    });
    
    // Click the race select dropdown
    const raceSelect = screen.getByLabelText('Select Race');
    fireEvent.click(raceSelect);
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Test Marathon (42.20 km)')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Marathon (42.20 km)'));

    await waitFor(() => {
      expect(screen.getByText('Test Pace Plan')).toBeInTheDocument();
    });

    const editButton = screen.getByTitle('Edit Splits');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Add Split')).toBeInTheDocument();
    });

    // Click add split button
    const addSplitButton = screen.getByText('Add Split');
    fireEvent.click(addSplitButton);

    // Verify a new split row appears (should now have 3 splits)
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle(/delete|remove/i);
      expect(deleteButtons.length).toBe(3); // One for each split
    });
  });

  it.skip('should allow deleting splits but prevent deleting the last split', async () => {
    renderWithTheme(<PacePlanSection />);
    
    // Wait for races to load - FormControl should be enabled when races are loaded
    await waitFor(() => {
      const raceSelect = screen.getByLabelText('Select Race');
      expect(raceSelect).not.toBeDisabled();
    });
    
    // Click the race select dropdown
    const raceSelect = screen.getByLabelText('Select Race');
    fireEvent.click(raceSelect);
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Test Marathon (42.20 km)')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Marathon (42.20 km)'));

    await waitFor(() => {
      expect(screen.getByText('Test Pace Plan')).toBeInTheDocument();
    });

    const editButton = screen.getByTitle('Edit Splits');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Splits')).toBeInTheDocument();
    });

    // Initially should have 2 splits, so delete buttons should be enabled
    const deleteButtons = screen.getAllByTitle(/delete|remove/i);
    expect(deleteButtons.length).toBe(2);
    expect(deleteButtons[0]).not.toBeDisabled();

    // Delete one split
    fireEvent.click(deleteButtons[0]);

    // After deleting, should have 1 split, and delete button should be disabled
    await waitFor(() => {
      const remainingDeleteButtons = screen.getAllByTitle(/delete|remove/i);
      expect(remainingDeleteButtons.length).toBe(1);
      expect(remainingDeleteButtons[0]).toBeDisabled();
    });
  });

  it.skip('should save splits when save button is clicked', async () => {
    MockedPacePlanManager.updatePacePlanSplits.mockResolvedValue();

    renderWithTheme(<PacePlanSection />);
    
    // Wait for races to load - FormControl should be enabled when races are loaded
    await waitFor(() => {
      const raceSelect = screen.getByLabelText('Select Race');
      expect(raceSelect).not.toBeDisabled();
    });
    
    // Click the race select dropdown
    const raceSelect = screen.getByLabelText('Select Race');
    fireEvent.click(raceSelect);
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Test Marathon (42.20 km)')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Marathon (42.20 km)'));

    await waitFor(() => {
      expect(screen.getByText('Test Pace Plan')).toBeInTheDocument();
    });

    const editButton = screen.getByTitle('Edit Splits');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    // Click save changes button
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Verify updatePacePlanSplits was called
    await waitFor(() => {
      expect(MockedPacePlanManager.updatePacePlanSplits).toHaveBeenCalledWith(
        'paceplan-1',
        expect.any(Array)
      );
    });
  });

  it.skip('should cancel editing when cancel button is clicked', async () => {
    renderWithTheme(<PacePlanSection />);
    
    // Wait for races to load - FormControl should be enabled when races are loaded
    await waitFor(() => {
      const raceSelect = screen.getByLabelText('Select Race');
      expect(raceSelect).not.toBeDisabled();
    });
    
    // Click the race select dropdown
    const raceSelect = screen.getByLabelText('Select Race');
    fireEvent.click(raceSelect);
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Test Marathon (42.20 km)')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Marathon (42.20 km)'));

    await waitFor(() => {
      expect(screen.getByText('Test Pace Plan')).toBeInTheDocument();
    });

    const editButton = screen.getByTitle('Edit Splits');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    // Make a change
    const distanceInputs = screen.getAllByDisplayValue('21.1');
    fireEvent.change(distanceInputs[0], { target: { value: '20' } });

    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Verify editing UI is hidden
    await waitFor(() => {
      expect(screen.queryByText('Edit Splits')).not.toBeInTheDocument();
      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    });
  });

  it.skip('should display computed pace as read-only', async () => {
    renderWithTheme(<PacePlanSection />);
    
    // Wait for races to load - FormControl should be enabled when races are loaded
    await waitFor(() => {
      const raceSelect = screen.getByLabelText('Select Race');
      expect(raceSelect).not.toBeDisabled();
    });
    
    // Click the race select dropdown
    const raceSelect = screen.getByLabelText('Select Race');
    fireEvent.click(raceSelect);
    
    // Wait for dropdown options to appear
    await waitFor(() => {
      expect(screen.getByText('Test Marathon (42.20 km)')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Marathon (42.20 km)'));

    await waitFor(() => {
      expect(screen.getByText('Test Pace Plan')).toBeInTheDocument();
    });

    const editButton = screen.getByTitle('Edit Splits');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Splits')).toBeInTheDocument();
    });

    // Check that pace values are displayed but not editable
    const paceTexts = screen.getAllByText(/5\.69/);
    expect(paceTexts.length).toBeGreaterThan(0);

    // Verify there are no input fields for pace (should be read-only text)
    const paceInputs = screen.queryAllByDisplayValue(/5\.69/);
    expect(paceInputs.length).toBe(0); // Should be 0 since pace is read-only
  });
});