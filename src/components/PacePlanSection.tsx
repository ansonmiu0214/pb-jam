import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Box,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { createPacePlan, fetchPacePlans, deletePacePlan } from '../managers/pacePlanManager';
import { fetchRaces } from '../managers/raceManager';
import { getCurrentUser } from '../services/userService';
import { ConfirmDialog } from './ConfirmDialog';
import type { Race, PacePlan, SpotifyPlaylist } from '../models/types';
import { getCachedPlaylists, isSpotifyAuthenticated, fetchPlaylists } from '../services/playlistManager';

interface PacePlanFormData {
  raceId: string;
  title: string;
  targetTimeHours: string;
  targetTimeMinutes: string;
  targetTimeSeconds: string;
  spotifyPlaylistId: string;
}

export interface PacePlanSectionHandle {
  refreshRaces: () => Promise<void>;
}

export const PacePlanSection = forwardRef<PacePlanSectionHandle>((_, ref) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [pacePlans, setPacePlans] = useState<PacePlan[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pacePlanToDelete, setPacePlanToDelete] = useState<PacePlan | null>(null);
  const [formData, setPacePlanFormData] = useState<PacePlanFormData>({
    raceId: '',
    title: '',
    targetTimeHours: '',
    targetTimeMinutes: '',
    targetTimeSeconds: '',
    spotifyPlaylistId: '',
  });

  useEffect(() => {
    loadRaces();
    loadPlaylists();
  }, []);

  useEffect(() => {
    if (selectedRaceId) {
      loadPacePlans(selectedRaceId);
    } else {
      setPacePlans([]);
    }
  }, [selectedRaceId]);

  // Reload playlists when Spotify authentication status might have changed
  useEffect(() => {
    loadPlaylists();
  }, [isSpotifyAuthenticated()]);

  // Expose refreshRaces to parent components via ref
  useImperativeHandle(ref, () => ({
    refreshRaces: loadRaces,
  }));

  const loadRaces = async () => {
    const user = getCurrentUser();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const raceList = await fetchRaces(user.id);
      setRaces(raceList);
      
      // If there are races but no selected race, don't auto-select
      // Let user choose
    } catch (err: unknown) {
      console.error('Failed to load races:', err);
      setError('Failed to load races. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPacePlans = async (raceId: string) => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const pacePlanList = await fetchPacePlans(raceId);
      setPacePlans(pacePlanList);
    } catch (err: unknown) {
      console.error('Failed to load pace plans:', err);
      setError('Failed to load pace plans. Please try again.');
    }
  };

  const loadPlaylists = async () => {
    // Load cached playlists if user is authenticated with Spotify
    if (isSpotifyAuthenticated()) {
      const cachedPlaylists = getCachedPlaylists();
      if (cachedPlaylists.length > 0) {
        setPlaylists(cachedPlaylists);
      } else {
        // If no cached playlists, try to fetch them
        try {
          const fetchedPlaylists = await fetchPlaylists(true);
          setPlaylists(fetchedPlaylists);
        } catch (err) {
          console.error('Failed to fetch playlists:', err);
          // Silently fail - playlists just won't be available
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;

    if (!formData.raceId || !formData.title.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    // Convert hours, minutes, seconds to total seconds
    const hours = parseInt(formData.targetTimeHours) || 0;
    const minutes = parseInt(formData.targetTimeMinutes) || 0;
    const seconds = parseInt(formData.targetTimeSeconds) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds <= 0) {
      setError('Please enter a valid target time (at least 1 second).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createPacePlan(formData.raceId, {
        title: formData.title.trim(),
        targetTime: totalSeconds,
        ...(formData.spotifyPlaylistId && { spotifyPlaylistId: formData.spotifyPlaylistId }),
      });

      // Reset form
      setPacePlanFormData({ raceId: '', title: '', targetTimeHours: '', targetTimeMinutes: '', targetTimeSeconds: '', spotifyPlaylistId: '' });
      
      // Reload pace plans for the selected race
      if (selectedRaceId) {
        await loadPacePlans(selectedRaceId);
      }
    } catch (err: unknown) {
      console.error('Failed to create pace plan:', err);
      setError('Failed to create pace plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pacePlan: PacePlan) => {
    setPacePlanToDelete(pacePlan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pacePlanToDelete) return;

    const user = getCurrentUser();
    if (!user) return;

    try {
      await deletePacePlan(pacePlanToDelete.id);
      if (selectedRaceId) {
        await loadPacePlans(selectedRaceId);
      }
    } catch (err: unknown) {
      console.error('Failed to delete pace plan:', err);
      setError('Failed to delete pace plan. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setPacePlanToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setPacePlanToDelete(null);
  };

  const handleInputChange = (field: keyof PacePlanFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPacePlanFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSelectChange = (field: keyof PacePlanFormData) => (
    event: SelectChangeEvent<string>
  ) => {
    setPacePlanFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleRaceSelection = (raceId: string) => {
    setSelectedRaceId(raceId);
    setPacePlanFormData(prev => ({ ...prev, raceId }));
  };

  const getPlaylistName = (playlistId?: string): string | null => {
    if (!playlistId) return null;
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.name : 'Unknown Playlist';
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Pace Plans
      </Typography>

      {/* Create New Pace Plan Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create New Pace Plan
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <FormControl fullWidth disabled={submitting || races.length === 0}>
                <InputLabel>Select Race</InputLabel>
                <Select
                  value={formData.raceId}
                  onChange={handleSelectChange('raceId')}
                  label="Select Race"
                >
                  {races.length === 0 ? (
                    <MenuItem value="" disabled>
                      No races available
                    </MenuItem>
                  ) : (
                    races.map((race) => (
                      <MenuItem key={race.id} value={race.id}>
                        {race.title} ({race.distance}{race.unit})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <TextField
                label="Pace Plan Title"
                placeholder="e.g., Target Pace"
                value={formData.title}
                onChange={handleInputChange('title')}
                fullWidth
                disabled={submitting}
              />

              <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>Target Time</Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Hours"
                  type="number"
                  value={formData.targetTimeHours}
                  onChange={handleInputChange('targetTimeHours')}
                  disabled={submitting}
                  inputProps={{ min: '0', max: '23' }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Minutes"
                  type="number"
                  value={formData.targetTimeMinutes}
                  onChange={handleInputChange('targetTimeMinutes')}
                  disabled={submitting}
                  inputProps={{ min: '0', max: '59' }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Seconds"
                  type="number"
                  value={formData.targetTimeSeconds}
                  onChange={handleInputChange('targetTimeSeconds')}
                  disabled={submitting}
                  inputProps={{ min: '0', max: '59' }}
                  sx={{ flex: 1 }}
                />
              </Stack>

              {/* Spotify Playlist Selection */}
              <FormControl fullWidth disabled={submitting || !isSpotifyAuthenticated()}>
                <InputLabel>Link Spotify Playlist (Optional)</InputLabel>
                <Select
                  value={formData.spotifyPlaylistId}
                  onChange={handleSelectChange('spotifyPlaylistId')}
                  label="Link Spotify Playlist (Optional)"
                >
                  <MenuItem value="">
                    <em>No playlist</em>
                  </MenuItem>
                  {playlists.map((playlist) => (
                    <MenuItem key={playlist.id} value={playlist.id}>
                      {playlist.name} ({playlist.tracks.total} tracks)
                    </MenuItem>
                  ))}
                </Select>
                {!isSpotifyAuthenticated() && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Log in with Spotify to link playlists to your pace plans.
                  </Alert>
                )}
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting || races.length === 0}
                startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
              >
                {submitting ? 'Creating...' : 'Create Pace Plan'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Race Selection for Viewing */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            View Pace Plans
          </Typography>
          
          <FormControl fullWidth>
            <InputLabel>Select Race to View Pace Plans</InputLabel>
            <Select
              value={selectedRaceId}
              onChange={(e) => handleRaceSelection(e.target.value)}
              label="Select Race to View Pace Plans"
            >
              <MenuItem value="">
                <em>Select a race</em>
              </MenuItem>
              {races.map((race) => (
                <MenuItem key={race.id} value={race.id}>
                  {race.title} ({race.distance}{race.unit})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Pace Plans List */}
      <Typography variant="h6" gutterBottom>
        Pace Plans
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : !selectedRaceId ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center">
              Select a race to see pace plans
            </Typography>
          </CardContent>
        </Card>
      ) : pacePlans.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center">
              No pace plans for this race yet. Create one above!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {pacePlans.map((pacePlan) => (
            <Card key={pacePlan.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {pacePlan.title}
                    </Typography>
                    <Typography color="text.secondary">
                      Target Time: {formatTime(pacePlan.targetTime)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created: {pacePlan.createdAt?.toLocaleDateString() || 'N/A'}
                    </Typography>
                    {pacePlan.spotifyPlaylistId && (
                      <Typography variant="body2" color="primary">
                        🎵 Playlist: {getPlaylistName(pacePlan.spotifyPlaylistId)}
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    onClick={() => handleDelete(pacePlan)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Pace Plan"
        message={`Are you sure you want to delete "${pacePlanToDelete?.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        severity="error"
      />
    </Box>
  );
});

PacePlanSection.displayName = 'PacePlanSection';
