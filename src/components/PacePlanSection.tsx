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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CallMerge as MergeIcon,
  CallSplit as SplitIcon,
} from '@mui/icons-material';
import { createPacePlan, fetchPacePlans, deletePacePlan, updatePacePlanSplits, parseTimeToSeconds, calculatePace, mergeSplits, splitSplit, validateSplits } from '../managers/pacePlanManager';
import { fetchRaces } from '../managers/raceManager';
import { getCurrentUser } from '../services/userService';
import { ConfirmDialog } from './ConfirmDialog';
import { useUnit } from '../contexts/UnitContext';
import type { Race, PacePlan, SpotifyPlaylist, SpotifyTrack, Split, ValidationResult } from '../models/types';
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

interface PacePlanSectionProps {
  onPacePlanSelect?: (pacePlan: PacePlan | null) => void;
  onRaceSelect?: (race: Race | null) => void;
  onTracksLoad?: (tracks: SpotifyTrack[]) => void;
}

export const PacePlanSection = forwardRef<PacePlanSectionHandle, PacePlanSectionProps>(
  ({ onPacePlanSelect, onRaceSelect, onTracksLoad }, ref) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [pacePlans, setPacePlans] = useState<PacePlan[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pacePlanToDelete, setPacePlanToDelete] = useState<PacePlan | null>(null);
  const [expandedPacePlan, setExpandedPacePlan] = useState<string | null>(null);
  const [editingSplits, setEditingSplits] = useState<{[key: string]: Split[]}>({});
  const [selectedSplitsForMerge, setSelectedSplitsForMerge] = useState<{[key: string]: number[]}>({});
  const [validationResults, setValidationResults] = useState<{[key: string]: ValidationResult}>({});
  const { unit: displayUnit, convertDistance } = useUnit();
  const theme = useTheme();
  const [formData, setPacePlanFormData] = useState<PacePlanFormData>({
    raceId: '',
    title: '',
    targetTimeHours: '',
    targetTimeMinutes: '',
    targetTimeSeconds: '',
    spotifyPlaylistId: '',
  });

  // Helper function to format pace from decimal minutes to MM:SS
  const formatPace = (paceInMinutes: number): string => {
    const minutes = Math.floor(paceInMinutes);
    const seconds = Math.round((paceInMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
  }, [selectedRaceId, races]);

  // Reload playlists when Spotify authentication status might have changed
  const spotifyAuthStatus = isSpotifyAuthenticated();
  useEffect(() => {
    loadPlaylists();
  }, [spotifyAuthStatus]);

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

  const loadPacePlans = async (raceId: string): Promise<PacePlan[]> => {
    const user = getCurrentUser();
    if (!user) return [];

    try {
      console.log('[PacePlanSection] Loading pace plans for race:', raceId);
      const pacePlanList = await fetchPacePlans(raceId);
      console.log('[PacePlanSection] Loaded', pacePlanList.length, 'pace plans');
      setPacePlans(pacePlanList);
      return pacePlanList;
    } catch (err: unknown) {
      console.error('Failed to load pace plans:', err);
      setError('Failed to load pace plans. Please try again.');
      return [];
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
      // Find the selected race to get its distance
      const selectedRace = races.find(race => race.id === formData.raceId);
      
      await createPacePlan(formData.raceId, {
        title: formData.title.trim(),
        targetTime: totalSeconds,
        raceDistance: selectedRace?.distance,
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

  const handleSelectPacePlan = (pacePlan: PacePlan) => {
    // Call the parent callback to select this pace plan
    console.log('[PacePlanSection] Selected pace plan:', pacePlan.title, pacePlan.id);
    onPacePlanSelect?.(pacePlan);
    
    // Note: Tracks would need to be fetched from the Spotify API using the playlist ID
    // For now, just clear tracks - they can be fetched on-demand in a future enhancement
    onTracksLoad?.([]);
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
    console.log('[PacePlanSection] Selected race ID:', raceId);
    setSelectedRaceId(raceId);
    setPacePlanFormData(prev => ({ ...prev, raceId }));
    
    // Find and pass the selected race to parent
    const selectedRace = races.find(r => r.id === raceId) || null;
    console.log('[PacePlanSection] Selected race:', selectedRace?.title, selectedRace?.id);
    onRaceSelect?.(selectedRace);
  };

  const getPlaylistName = (playlistId?: string): string | null => {
    if (!playlistId) return null;
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.name : 'Unknown Playlist';
  };

  const getRaceDate = (raceId: string): string => {
    const race = races.find(r => r.id === raceId);
    if (race?.raceDate) {
      return new Date(race.raceDate).toLocaleDateString();
    }
    return 'TBD';
  };

  // Split editing functions
  const handleEditSplits = (pacePlan: PacePlan) => {
    if (expandedPacePlan === pacePlan.id) {
      setExpandedPacePlan(null);
      setEditingSplits(prev => {
        const updated = { ...prev };
        delete updated[pacePlan.id];
        return updated;
      });
      setSelectedSplitsForMerge(prev => {
        const updated = { ...prev };
        delete updated[pacePlan.id];
        return updated;
      });
      setValidationResults(prev => {
        const updated = { ...prev };
        delete updated[pacePlan.id];
        return updated;
      });
    } else {
      setExpandedPacePlan(pacePlan.id);
      setEditingSplits(prev => ({
        ...prev,
        [pacePlan.id]: [...pacePlan.splits],
      }));
      setSelectedSplitsForMerge(prev => ({
        ...prev,
        [pacePlan.id]: [],
      }));
      
      // Run initial validation
      setTimeout(() => validatePacePlanSplits(pacePlan.id, pacePlan.splits), 0);
    }
  };

  const handleSplitChange = (pacePlanId: string, splitIndex: number, field: 'distance' | 'targetTime' | 'targetTimeHours' | 'targetTimeMinutes' | 'targetTimeSeconds' | 'elevation', value: string) => {
    setEditingSplits(prev => {
      const splits = [...(prev[pacePlanId] || [])];
      if (field === 'distance') {
        splits[splitIndex] = { ...splits[splitIndex], distance: parseFloat(value) || 0 };
      } else if (field === 'targetTime') {
        // Try to parse as MM:SS format first, then fall back to seconds
        let seconds: number;
        if (value.includes(':')) {
          seconds = parseTimeToSeconds(value);
        } else {
          seconds = parseInt(value) || 0;
        }
        splits[splitIndex] = { ...splits[splitIndex], targetTime: seconds };
      } else if (field === 'targetTimeHours' || field === 'targetTimeMinutes' || field === 'targetTimeSeconds') {
        // Get current time components
        const currentSeconds = splits[splitIndex].targetTime || 0;
        const currentHours = Math.floor(currentSeconds / 3600);
        const currentMinutes = Math.floor((currentSeconds % 3600) / 60);
        const currentSecs = currentSeconds % 60;

        let newHours = currentHours;
        let newMinutes = currentMinutes;
        let newSecs = currentSecs;

        const numValue = parseInt(value) || 0;
        
        if (field === 'targetTimeHours') {
          newHours = Math.max(0, numValue);
        } else if (field === 'targetTimeMinutes') {
          newMinutes = Math.max(0, Math.min(59, numValue));
        } else if (field === 'targetTimeSeconds') {
          newSecs = Math.max(0, Math.min(59, numValue));
        }

        const totalSeconds = newHours * 3600 + newMinutes * 60 + newSecs;
        splits[splitIndex] = { ...splits[splitIndex], targetTime: totalSeconds };
      } else if (field === 'elevation') {
        splits[splitIndex] = { ...splits[splitIndex], elevation: parseInt(value) || 0 };
      }
      // Recalculate pace
      splits[splitIndex].pace = calculatePace(splits[splitIndex].distance, splits[splitIndex].targetTime);
      
      // Run validation after changes
      setTimeout(() => validatePacePlanSplits(pacePlanId, splits), 0);
      
      return { ...prev, [pacePlanId]: splits };
    });
  };

  const handleAddSplit = (pacePlanId: string) => {
    setEditingSplits(prev => {
      const splits = [...(prev[pacePlanId] || [])];
      splits.push({
        distance: 5, // Default 5km
        targetTime: 25 * 60, // Default 25 minutes (1500 seconds)
        pace: 5, // Default 5 min/km
        elevation: 0, // Default 0m elevation
      });
      
      // Run validation after adding split
      setTimeout(() => validatePacePlanSplits(pacePlanId, splits), 0);
      
      return { ...prev, [pacePlanId]: splits };
    });
  };

  const handleRemoveSplit = (pacePlanId: string, splitIndex: number) => {
    setEditingSplits(prev => {
      const splits = [...(prev[pacePlanId] || [])];
      splits.splice(splitIndex, 1);
      
      // Run validation after removing split
      setTimeout(() => validatePacePlanSplits(pacePlanId, splits), 0);
      
      return { ...prev, [pacePlanId]: splits };
    });
  };

  const handleSaveSplits = async (pacePlanId: string) => {
    const splits = editingSplits[pacePlanId];
    if (!splits) return;

    try {
      await updatePacePlanSplits(pacePlanId, splits);
      
      // Refresh pace plans to get updated data
      if (selectedRaceId) {
        const updatedPacePlans = await loadPacePlans(selectedRaceId);
        
        // Find the updated pace plan and refresh the timeline
        const updatedPacePlan = updatedPacePlans.find(pp => pp.id === pacePlanId);
        if (updatedPacePlan && onPacePlanSelect) {
          onPacePlanSelect(updatedPacePlan);
        }
      }
      
      // Clear editing state
      setEditingSplits(prev => {
        const updated = { ...prev };
        delete updated[pacePlanId];
        return updated;
      });
      setSelectedSplitsForMerge(prev => {
        const updated = { ...prev };
        delete updated[pacePlanId];
        return updated;
      });
      setExpandedPacePlan(null);
    } catch (err: unknown) {
      console.error('Failed to save splits:', err);
      setError('Failed to save splits. Please try again.');
    }
  };

  const handleCancelEditSplits = (pacePlanId: string) => {
    setEditingSplits(prev => {
      const updated = { ...prev };
      delete updated[pacePlanId];
      return updated;
    });
    setSelectedSplitsForMerge(prev => {
      const updated = { ...prev };
      delete updated[pacePlanId];
      return updated;
    });
    setValidationResults(prev => {
      const updated = { ...prev };
      delete updated[pacePlanId];
      return updated;
    });
    setExpandedPacePlan(null);
  };

  const handleMergeSplits = (pacePlanId: string, indexA: number, indexB: number) => {
    setEditingSplits(prev => {
      const currentSplits = prev[pacePlanId] || [];
      try {
        const mergedSplits = mergeSplits(currentSplits, indexA, indexB);
        
        // Run validation after merging splits
        setTimeout(() => validatePacePlanSplits(pacePlanId, mergedSplits), 0);
        
        return { ...prev, [pacePlanId]: mergedSplits };
      } catch (err) {
        console.error('Failed to merge splits:', err);
        setError('Cannot merge these splits. Please check your selection.');
        return prev;
      }
    });
  };

  const handleSplitSplit = (pacePlanId: string, index: number) => {
    setEditingSplits(prev => {
      const currentSplits = prev[pacePlanId] || [];
      try {
        const splitSplits = splitSplit(currentSplits, index, 'even');
        
        // Run validation after splitting
        setTimeout(() => validatePacePlanSplits(pacePlanId, splitSplits), 0);
        
        return { ...prev, [pacePlanId]: splitSplits };
      } catch (err) {
        console.error('Failed to split split:', err);
        setError('Cannot split this split. Please try again.');
        return prev;
      }
    });
  };

  const handleSelectSplitForMerge = (pacePlanId: string, index: number) => {
    setSelectedSplitsForMerge(prev => {
      const currentSelected = prev[pacePlanId] || [];
      
      // If already selected, deselect it
      if (currentSelected.includes(index)) {
        const newSelected = currentSelected.filter(i => i !== index);
        return { ...prev, [pacePlanId]: newSelected };
      }
      
      // If we have 2 selected, replace with new selection
      if (currentSelected.length >= 2) {
        return { ...prev, [pacePlanId]: [index] };
      }
      
      // Add to selection
      const newSelected = [...currentSelected, index];
      
      // If we have exactly 2 selected, perform merge
      if (newSelected.length === 2) {
        handleMergeSplits(pacePlanId, newSelected[0], newSelected[1]);
        return { ...prev, [pacePlanId]: [] }; // Clear selection after merge
      }
      
      return { ...prev, [pacePlanId]: newSelected };
    });
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

  const getTimeComponents = (totalSeconds: number): { hours: number; minutes: number; seconds: number } => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  const validatePacePlanSplits = (pacePlanId: string, splits: Split[]) => {
    // Find the pace plan to get target time
    const pacePlan = pacePlans.find(pp => pp.id === pacePlanId);
    if (!pacePlan) return;

    // Find the race to get distance
    const race = races.find(r => r.id === pacePlan.raceId);
    if (!race) return;

    // Convert race distance to km if needed
    const raceDistanceInKm = race.unit === 'km' ? race.distance : race.distance * 1.60934;
    
    // Run validation
    const result = validateSplits(splits, raceDistanceInKm, pacePlan.targetTime);
    
    setValidationResults(prev => ({
      ...prev,
      [pacePlanId]: result,
    }));
  };

  const getSplitValidationStatus = (pacePlanId: string, splitIndex: number): { hasError: boolean; hasWarning: boolean } => {
    const validation = validationResults[pacePlanId];
    if (!validation) return { hasError: false, hasWarning: false };

    const hasError = validation.errors.some(error => error.splitIndex === splitIndex);
    const hasWarning = validation.warnings.some(warning => warning.splitIndex === splitIndex);
    
    return { hasError, hasWarning };
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
                        {race.title} ({convertDistance(race.distance, race.unit, displayUnit).toFixed(2)} {displayUnit})
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
                  {race.title} ({convertDistance(race.distance, race.unit, displayUnit).toFixed(2)} {displayUnit})
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
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Pace Plans
          </Typography>
        </Box>
      </Box>

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
            <Card 
              key={pacePlan.id}
              sx={{ 
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 2,
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box 
                    onClick={() => handleSelectPacePlan(pacePlan)}
                    sx={{ 
                      cursor: 'pointer',
                      flexGrow: 1,
                      '&:hover': {
                        '& .MuiTypography-h6': {
                          color: 'primary.main',
                        }
                      }
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {pacePlan.title}
                    </Typography>
                    <Typography color="text.secondary">
                      Target Time: {formatTime(pacePlan.targetTime)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Splits: {pacePlan.splits.length} • Race Date: {getRaceDate(pacePlan.raceId)}
                    </Typography>
                    {pacePlan.spotifyPlaylistId && (
                      <Typography variant="body2" color="primary">
                        🎵 Playlist: {getPlaylistName(pacePlan.spotifyPlaylistId)}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSplits(pacePlan);
                      }}
                      color="primary"
                      size="small"
                      title="Edit Splits"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(pacePlan);
                      }}
                      color="error"
                      size="small"
                      title="Delete Pace Plan"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Collapsible Splits Editor */}
                <Collapse in={expandedPacePlan === pacePlan.id}>
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Edit Splits
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddSplit(pacePlan.id)}
                        size="small"
                        variant="outlined"
                      >
                        Add Split
                      </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      💡 Click merge icon on two splits to combine them. Click split icon to divide a split evenly.
                    </Typography>

                    {/* Validation Feedback */}
                    {validationResults[pacePlan.id] && (
                      <Box sx={{ mb: 2 }}>
                        {validationResults[pacePlan.id].errors.map((error, index) => (
                          <Alert severity="error" key={`error-${index}`} sx={{ mb: 1 }}>
                            {error.message}
                            {error.splitIndex !== undefined && ` (Split ${error.splitIndex + 1})`}
                          </Alert>
                        ))}
                        {validationResults[pacePlan.id].warnings.map((warning, index) => (
                          <Alert severity="warning" key={`warning-${index}`} sx={{ mb: 1 }}>
                            {warning.message}
                            {warning.splitIndex !== undefined && ` (Split ${warning.splitIndex + 1})`}
                          </Alert>
                        ))}
                      </Box>
                    )}

                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Distance ({displayUnit})</TableCell>
                            <TableCell>Target Time (H:M:S)</TableCell>
                            <TableCell>Pace (min/{displayUnit})</TableCell>
                            <TableCell>Elevation (m)</TableCell>
                            <TableCell width={150}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(editingSplits[pacePlan.id] || []).map((split, index) => {
                            const displayDistance = convertDistance(split.distance, 'km', displayUnit);
                            const displayPace = split.distance > 0 
                              ? (split.targetTime / 60) / convertDistance(split.distance, 'km', displayUnit)
                              : 0;
                            const { hasError, hasWarning } = getSplitValidationStatus(pacePlan.id, index);
                            const fieldColor = hasError ? 'error' : hasWarning ? 'warning' : undefined;
                            return (
                            <TableRow key={index} sx={{ bgcolor: hasError ? 'error.light' : hasWarning ? 'warning.light' : undefined, opacity: hasError ? 0.1 : hasWarning ? 0.05 : undefined }}>
                              <TableCell>
                                <TextField
                                  type="number"
                                  value={displayDistance.toFixed(1)}
                                  onChange={(e) => {
                                    const convertedValue = displayUnit === 'km' 
                                      ? parseFloat(e.target.value) || 0
                                      : convertDistance(parseFloat(e.target.value) || 0, 'mi', 'km');
                                    handleSplitChange(pacePlan.id, index, 'distance', convertedValue.toString());
                                  }}
                                  size="small"
                                  inputProps={{ step: 0.1, min: 0 }}
                                  sx={{ width: '100px' }}
                                  color={fieldColor}
                                  error={hasError}
                                />
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const { hours, minutes, seconds } = getTimeComponents(split.targetTime);
                                  const { hasError, hasWarning } = getSplitValidationStatus(pacePlan.id, index);
                                  const fieldColor = hasError ? theme.palette.error.main : 
                                                   hasWarning ? theme.palette.warning.main : undefined;
                                  const textFieldSx = {
                                    width: '70px',
                                    ...(fieldColor && {
                                      '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                          borderColor: fieldColor,
                                        },
                                        '&:hover fieldset': {
                                          borderColor: fieldColor,
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: fieldColor,
                                        },
                                      },
                                    }),
                                  };
                                  return (
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                      <TextField
                                        type="number"
                                        value={hours}
                                        onChange={(e) => handleSplitChange(pacePlan.id, index, 'targetTimeHours', e.target.value)}
                                        size="small"
                                        inputProps={{ min: 0 }}
                                        sx={textFieldSx}
                                        label="H"
                                        error={hasError}
                                      />
                                      <Typography>:</Typography>
                                      <TextField
                                        type="number"
                                        value={minutes.toString().padStart(2, '0')}
                                        onChange={(e) => handleSplitChange(pacePlan.id, index, 'targetTimeMinutes', e.target.value)}
                                        size="small"
                                        inputProps={{ min: 0, max: 59 }}
                                        sx={textFieldSx}
                                        label="M"
                                        error={hasError}
                                      />
                                      <Typography>:</Typography>
                                      <TextField
                                        type="number"
                                        value={seconds.toString().padStart(2, '0')}
                                        onChange={(e) => handleSplitChange(pacePlan.id, index, 'targetTimeSeconds', e.target.value)}
                                        size="small"
                                        inputProps={{ min: 0, max: 59 }}
                                        sx={textFieldSx}
                                        label="S"
                                        error={hasError}
                                      />
                                    </Box>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {formatPace(displayPace)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  value={split.elevation || 0}
                                  onChange={(e) => handleSplitChange(pacePlan.id, index, 'elevation', e.target.value)}
                                  size="small"
                                  inputProps={{ step: 1 }}
                                  sx={{ width: '80px' }}
                                  color={fieldColor}
                                  error={hasError}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    onClick={() => handleSelectSplitForMerge(pacePlan.id, index)}
                                    color={selectedSplitsForMerge[pacePlan.id]?.includes(index) ? 'primary' : 'default'}
                                    size="small"
                                    title="Select for Merge"
                                    disabled={(editingSplits[pacePlan.id] || []).length <= 1}
                                  >
                                    <MergeIcon />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => handleSplitSplit(pacePlan.id, index)}
                                    color="secondary"
                                    size="small"
                                    title="Split This Split"
                                  >
                                    <SplitIcon />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => handleRemoveSplit(pacePlan.id, index)}
                                    color="error"
                                    size="small"
                                    title="Delete Split"
                                    disabled={(editingSplits[pacePlan.id] || []).length <= 1}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                      <Button
                        onClick={() => handleCancelEditSplits(pacePlan.id)}
                        variant="outlined"
                        size="small"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSaveSplits(pacePlan.id)}
                        variant="contained"
                        size="small"
                        disabled={validationResults[pacePlan.id]?.errors.length > 0}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
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
