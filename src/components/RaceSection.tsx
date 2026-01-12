import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { createRace, fetchRaces, deleteRace } from '../managers/raceManager';
import { getCurrentUser } from '../services/userService';
import { ConfirmDialog } from './ConfirmDialog';
import type { Race } from '../models/types';

interface RaceFormData {
  title: string;
  distance: string;
  unit: 'km' | 'mi';
}

interface RaceSectionProps {
  onRaceCreated?: () => void;
}

export const RaceSection: React.FC<RaceSectionProps> = ({ onRaceCreated }) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [raceToDelete, setRaceToDelete] = useState<Race | null>(null);
  const [formData, setFormData] = useState<RaceFormData>({
    title: '',
    distance: '',
    unit: 'km',
  });

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    const user = getCurrentUser();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const raceList = await fetchRaces(user.id);
      setRaces(raceList);
    } catch (err: unknown) {
      console.error('Failed to load races:', err);
      setError('Failed to load races. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[RaceSection] handleSubmit called');
    e.preventDefault();
    console.log('[RaceSection] preventDefault called');
    
    const user = getCurrentUser();
    console.log('[RaceSection] Current user:', user);
    if (!user) {
      console.log('[RaceSection] No user found, returning');
      setError('No user logged in');
      return;
    }

    console.log('[RaceSection] Validating form data:', formData);
    if (!formData.title.trim()) {
      console.log('[RaceSection] Title is empty');
      setError('Please enter a race title.');
      return;
    }
    
    if (!formData.distance.trim()) {
      console.log('[RaceSection] Distance is empty');
      setError('Please enter a distance.');
      return;
    }

    const distance = parseFloat(formData.distance);
    console.log('[RaceSection] Parsed distance:', distance);
    if (isNaN(distance) || distance <= 0) {
      console.log('[RaceSection] Invalid distance:', distance);
      setError('Please enter a valid distance.');
      return;
    }

    console.log('[RaceSection] All validation passed, setting submitting to true');
    setSubmitting(true);
    setError(null);

    try {
      console.log('[RaceSection] Calling createRace with:', { 
        title: formData.title.trim(),
        distance,
        unit: formData.unit,
      });
      const result = await createRace({
        title: formData.title.trim(),
        distance,
        unit: formData.unit,
      });
      console.log('[RaceSection] Race created successfully:', result);

      // Reset form
      console.log('[RaceSection] Resetting form');
      setFormData({ title: '', distance: '', unit: 'km' });
      
      // Reload races
      console.log('[RaceSection] Loading races');
      await loadRaces();
      console.log('[RaceSection] Races loaded');
      
      // Notify parent component that a race was created
      if (onRaceCreated) {
        onRaceCreated();
      }
    } catch (err: unknown) {
      console.error('[RaceSection] Error caught:', err);
      setError('Failed to create race. Please try again.');
    } finally {
      console.log('[RaceSection] Finally block - setting submitting to false');
      setSubmitting(false);
    }
  };

  const handleDelete = async (race: Race) => {
    setRaceToDelete(race);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!raceToDelete) return;

    try {
      await deleteRace(raceToDelete.id);
      await loadRaces();
    } catch (err: unknown) {
      console.error('Failed to delete race:', err);
      setError('Failed to delete race. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setRaceToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setRaceToDelete(null);
  };

  const handleInputChange = (field: keyof RaceFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Races
      </Typography>

      {/* Create New Race Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create New Race
          </Typography>
          
          <form onSubmit={(e) => {
            console.log('[RaceSection] Form onSubmit event fired');
            handleSubmit(e);
          }}>
            <Stack spacing={2}>
              <TextField
                label="Race Title"
                placeholder="e.g., Boston Marathon"
                value={formData.title}
                onChange={handleInputChange('title')}
                fullWidth
                disabled={submitting}
              />

              <TextField
                label="Distance"
                placeholder="Distance"
                type="number"
                value={formData.distance}
                onChange={handleInputChange('distance')}
                inputProps={{ step: 0.1 }}
                fullWidth
                disabled={submitting}
              />

              <FormControl fullWidth disabled={submitting}>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  onChange={handleInputChange('unit')}
                  label="Unit"
                >
                  <MenuItem value="km">Kilometers (km)</MenuItem>
                  <MenuItem value="mi">Miles (mi)</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
              >
                {submitting ? 'Creating...' : 'Create Race'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Races List */}
      <Typography variant="h6" gutterBottom>
        Your Races
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : races.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center">
              No races yet. Create one above!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {races.map((race) => (
            <Card key={race.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {race.title}
                    </Typography>
                    <Typography color="text.secondary">
                      Distance: {race.distance} {race.unit}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created: {race.createdAt?.toLocaleDateString() || 'N/A'}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => handleDelete(race)}
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
        title="Delete Race"
        message={`Are you sure you want to delete "${raceToDelete?.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        severity="error"
      />
    </Box>
  );
};