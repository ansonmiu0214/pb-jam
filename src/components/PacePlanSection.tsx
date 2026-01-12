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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { createPacePlan, fetchPacePlans, deletePacePlan } from '../managers/pacePlanManager';
import { fetchRaces } from '../managers/raceManager';
import { getCurrentUser } from '../services/userService';
import { ConfirmDialog } from './ConfirmDialog';
import type { Race, PacePlan } from '../models/types';

interface PacePlanFormData {
  raceId: string;
  title: string;
  targetTime: string;
}

export interface PacePlanSectionHandle {
  refreshRaces: () => Promise<void>;
}

export const PacePlanSection = forwardRef<PacePlanSectionHandle>((_, ref) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [pacePlans, setPacePlans] = useState<PacePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pacePlanToDelete, setPacePlanToDelete] = useState<PacePlan | null>(null);
  const [formData, setPacePlanFormData] = useState<PacePlanFormData>({
    raceId: '',
    title: '',
    targetTime: '',
  });

  useEffect(() => {
    loadRaces();
  }, []);

  useEffect(() => {
    if (selectedRaceId) {
      loadPacePlans(selectedRaceId);
    } else {
      setPacePlans([]);
    }
  }, [selectedRaceId]);

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
    } catch (err: any) {
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
      const pacePlanList = await fetchPacePlans(user.id, raceId);
      setPacePlans(pacePlanList);
    } catch (err: any) {
      console.error('Failed to load pace plans:', err);
      setError('Failed to load pace plans. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;

    if (!formData.raceId || !formData.title.trim() || !formData.targetTime.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const targetTimeSeconds = parseInt(formData.targetTime);
    if (isNaN(targetTimeSeconds) || targetTimeSeconds <= 0) {
      setError('Please enter a valid target time in seconds.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createPacePlan(user.id, formData.raceId, {
        title: formData.title.trim(),
        targetTime: targetTimeSeconds,
      });

      // Reset form
      setPacePlanFormData({ raceId: '', title: '', targetTime: '' });
      
      // Reload pace plans for the selected race
      if (selectedRaceId) {
        await loadPacePlans(selectedRaceId);
      }
    } catch (err: any) {
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
      await deletePacePlan(user.id, pacePlanToDelete.id);
      if (selectedRaceId) {
        await loadPacePlans(selectedRaceId);
      }
    } catch (err: any) {
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
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
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
                  onChange={handleInputChange('raceId')}
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

              <TextField
                label="Target Time (seconds)"
                placeholder="Target time in seconds"
                type="number"
                value={formData.targetTime}
                onChange={handleInputChange('targetTime')}
                fullWidth
                disabled={submitting}
                helperText="Enter the total target time in seconds (e.g., 10800 for 3 hours)"
              />

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
