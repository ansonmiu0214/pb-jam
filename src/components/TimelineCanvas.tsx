import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import { 
  renderTimelineWithDragState,
  createMockTimelineData, 
  createDragState,
  findTrackAtPosition,
  findInsertionPoint,
  type TimelineData
} from '../ui/timelineRenderer';
import type { PacePlan, SpotifyTrack, Race } from '../models/types';
import { fetchPlaylistTracks, reorderPlaylistTracks } from '../services/playlistManager';

interface TimelineCanvasProps {
  pacePlan?: PacePlan;
  race?: Race;
  tracks?: SpotifyTrack[];
  showDemo?: boolean;
  onTracksReordered?: (newTracks: SpotifyTrack[]) => void;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({ 
  pacePlan, 
  race,
  tracks, 
  showDemo = false,
  onTracksReordered
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [demoMode, setDemoMode] = useState(showDemo);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [spotifyPlaylistTracks, setSpotifyPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [shouldResetDrag, setShouldResetDrag] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  
  // Drag state
  const [dragState] = useState(() => createDragState());
  const [trackRectangles, setTrackRectangles] = useState<Array<{
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    track: SpotifyTrack;
  }>>([]);

  // Fetch playlist tracks when pace plan changes
  useEffect(() => {
    const fetchTracks = async () => {
      console.log('fetchTracks effect triggered:', { pacePlan: pacePlan?.title, playlistId: pacePlan?.spotifyPlaylistId, demoMode });
      
      if (!pacePlan?.spotifyPlaylistId || demoMode) {
        console.log('No playlist ID or demo mode, clearing tracks');
        setPlaylistTracks([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching tracks for playlist:', pacePlan.spotifyPlaylistId);
        const fetchedTracks = await fetchPlaylistTracks(pacePlan.spotifyPlaylistId);
        console.log('Fetched tracks:', fetchedTracks.length, 'tracks');
        setPlaylistTracks(fetchedTracks);
        setSpotifyPlaylistTracks(fetchedTracks);
        setSaveSuccess(null);
      } catch (err) {
        console.error('Failed to fetch playlist tracks:', err);
        setError('Failed to load playlist tracks. Please try again.');
        setPlaylistTracks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, [pacePlan?.spotifyPlaylistId, demoMode]);

  // Effect to reset drag state after tracks are reordered
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (shouldResetDrag) {
      dragState.isDragging = false;
      dragState.draggedTrackIndex = null;
      dragState.insertionPoint = null;
      dragState.dragStartY = 0;
      dragState.dragCurrentY = 0;
      
      console.log('Cleared drag state');
      setShouldResetDrag(false);
      setIsReordering(false);
    }
  }, [shouldResetDrag]);

  // Render timeline effect
  useEffect(() => {
    console.log('=== Timeline render effect triggered ===', {
      pacePlan: pacePlan?.title,
      playlistTracksCount: playlistTracks.length,
      tracksCount: tracks?.length || 0,
      demoMode,
      timestamp: new Date().toISOString()
    });
    
    if (!canvasRef.current) return;

    let timelineData: TimelineData;
    let tracksToUse: SpotifyTrack[] = [];

    if (demoMode || (!pacePlan && !tracks && !playlistTracks.length)) {
      // Use mock data for demo
      timelineData = createMockTimelineData();
      tracksToUse = timelineData.tracks || [];
      console.log('Using mock data with', tracksToUse.length, 'tracks');
    } else if (pacePlan) {
      // Use real pace plan data - prefer playlistTracks from Spotify over passed tracks prop
      tracksToUse = (playlistTracks && playlistTracks.length > 0) ? playlistTracks : (tracks || []);
      console.log('Timeline rendering with tracks:', tracksToUse.length, 'tracks from:', playlistTracks.length > 0 ? 'playlistTracks' : 'tracks prop');
      timelineData = {
        splits: pacePlan.splits,
        tracks: tracksToUse,
        totalTime: pacePlan.targetTime,
        totalDistance: pacePlan.splits.reduce((sum, split) => sum + split.distance, 0),
        unit: race?.unit || 'km',
      };
    } else {
      // No data to render
      console.log('No data to render');
      return;
    }

    try {
      // Log current track order
      if (tracksToUse.length > 0) {
        const trackNames = tracksToUse.map((t, i) => `${i + 1}. ${t.name}`).join(' | ');
        console.log('Current track order:', trackNames);
      }
      
      // Always render with null dragState in the main render effect
      // Drag state is only rendered during active dragging (mouse/touch move)
      const rectangles = renderTimelineWithDragState(canvasRef.current, timelineData, {}, null);
      setTrackRectangles(rectangles);
      console.log('Rendered', rectangles.length, 'track rectangles');
    } catch (error) {
      console.error('Failed to render timeline:', error);
    }
  }, [pacePlan, tracks, playlistTracks, demoMode, race]);

  const reorderTracks = useCallback(async (fromIndex: number, toIndex: number) => {
    console.log('reorderTracks called with:', { fromIndex, toIndex, playlistTracksCount: playlistTracks.length });
    
    if (!pacePlan?.spotifyPlaylistId) {
      console.log('No spotifyPlaylistId, returning');
      return;
    }

    const currentTracks = (playlistTracks && playlistTracks.length > 0) ? playlistTracks : (tracks || []);
    if (!currentTracks.length) {
      console.log('No tracks to reorder');
      return;
    }

    // Update local state immediately for better UX
    const newTracks = [...currentTracks];
    const [movedTrack] = newTracks.splice(fromIndex, 1);
    newTracks.splice(toIndex, 0, movedTrack);
    
    // Log the reordering
    const trackNames = newTracks.map((t, i) => `${i + 1}. ${t.name}`).join(' | ');
    console.log(`Reordering: moved track from index ${fromIndex} to ${toIndex}`);
    console.log('New track order:', trackNames);
    
    if (tracks) {
      console.log('Using onTracksReordered callback');
      onTracksReordered?.(newTracks);
      setPlaylistTracks(newTracks);
    } else {
      console.log('Setting playlistTracks state with', newTracks.length, 'tracks');
      setPlaylistTracks(newTracks);
    }
    
    // Note: No Spotify API call here - user must click Save button to persist changes
  }, [pacePlan, tracks, playlistTracks, onTracksReordered]);

  // Helper functions - define early to avoid initialization order issues
  const getCurrentTimelineData = useCallback((): TimelineData | null => {
    if (demoMode || (!pacePlan && !tracks && !playlistTracks.length)) {
      return createMockTimelineData();
    } else if (pacePlan) {
      const tracksToUse = (playlistTracks && playlistTracks.length > 0) ? playlistTracks : (tracks || []);
      return {
        splits: pacePlan.splits,
        tracks: tracksToUse,
        totalTime: pacePlan.targetTime,
        totalDistance: pacePlan.splits.reduce((sum, split) => sum + split.distance, 0),
        unit: race?.unit || 'km',
      };
    }
    return null;
  }, [demoMode, pacePlan, tracks, playlistTracks, race]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = playlistTracks.length > 0 && spotifyPlaylistTracks.length > 0 &&
    (playlistTracks.length !== spotifyPlaylistTracks.length ||
     playlistTracks.some((track, i) => track.id !== spotifyPlaylistTracks[i]?.id));

  // Save playlist order to Spotify
  const savePlaylistOrder = useCallback(async () => {
    if (!pacePlan?.spotifyPlaylistId) {
      console.log('Nothing to save');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(null);

    try {
      console.log('Saving playlist order to Spotify...');
      
      // Calculate the moves needed to reorder tracks
      const spotifyIds = spotifyPlaylistTracks.map(t => t.id);
      const localIds = playlistTracks.map(t => t.id);
      
      // For each track in the new order, move it to its correct position
      for (let i = 0; i < localIds.length; i++) {
        const trackId = localIds[i];
        const currentIndex = spotifyIds.indexOf(trackId);
        
        if (currentIndex !== i && currentIndex !== -1) {
          await reorderPlaylistTracks(pacePlan.spotifyPlaylistId, currentIndex, i);
          // Update our tracking array
          spotifyIds.splice(currentIndex, 1);
          spotifyIds.splice(i, 0, trackId);
        }
      }

      console.log('Successfully saved playlist order to Spotify');
      setSpotifyPlaylistTracks(playlistTracks);
      setSaveSuccess('Playlist order saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save playlist order:', err);
      setError('Failed to save playlist order to Spotify. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [pacePlan, playlistTracks, spotifyPlaylistTracks]);

  // Mouse event handlers for drag-and-drop
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !trackRectangles.length || isReordering) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const trackIndex = findTrackAtPosition(trackRectangles, x, y);
    
    if (trackIndex !== null) {
      dragState.isDragging = true;
      dragState.draggedTrackIndex = trackIndex;
      dragState.dragStartY = y;
      dragState.dragCurrentY = y;
      dragState.insertionPoint = trackIndex;
      
      // Re-render with drag state
      if (canvasRef.current) {
        const timelineData = getCurrentTimelineData();
        if (timelineData) {
          renderTimelineWithDragState(canvasRef.current, timelineData, {}, dragState);
        }
      }
    }
  }, [trackRectangles, getCurrentTimelineData, isReordering]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.isDragging || !canvasRef.current || !trackRectangles.length) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const y = event.clientY - rect.top;

    dragState.dragCurrentY = y;
    dragState.insertionPoint = findInsertionPoint(trackRectangles, y);

    // Re-render with updated drag state
    const timelineData = getCurrentTimelineData();
    if (timelineData) {
      renderTimelineWithDragState(canvas, timelineData, {}, dragState);
    }
  }, [trackRectangles, getCurrentTimelineData]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMouseUp = useCallback(async () => {
    console.log('handleMouseUp called, isDragging:', dragState.isDragging, 'draggedIndex:', dragState.draggedTrackIndex);
    
    if (!dragState.isDragging || dragState.draggedTrackIndex === null || dragState.insertionPoint === null) {
      dragState.isDragging = false;
      dragState.draggedTrackIndex = null;
      dragState.insertionPoint = null;
      dragState.dragStartY = 0;
      dragState.dragCurrentY = 0;
      return;
    }

    const fromIndex = dragState.draggedTrackIndex;
    let toIndex = dragState.insertionPoint;
    
    console.log('Reordering from', fromIndex, 'to', toIndex);
    
    // Adjust insertion index if moving item down
    if (fromIndex < toIndex) {
      toIndex--;
    }

    // Only reorder if position actually changed
    if (fromIndex !== toIndex) {
      console.log('Position changed, calling reorderTracks with adjusted toIndex:', toIndex);
      setIsReordering(true);
      await reorderTracks(fromIndex, toIndex);
      setShouldResetDrag(true);
    } else {
      // Position didn't change, just reset drag state
      dragState.isDragging = false;
      dragState.draggedTrackIndex = null;
      dragState.insertionPoint = null;
      dragState.dragStartY = 0;
      dragState.dragCurrentY = 0;
    }
  }, [dragState, reorderTracks]);

  // Touch event handlers for mobile support
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !trackRectangles.length || isReordering) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const trackIndex = findTrackAtPosition(trackRectangles, x, y);
    
    if (trackIndex !== null) {
      dragState.isDragging = true;
      dragState.draggedTrackIndex = trackIndex;
      dragState.dragStartY = y;
      dragState.dragCurrentY = y;
      dragState.insertionPoint = trackIndex;
      
      // Re-render with drag state
      const timelineData = getCurrentTimelineData();
      if (timelineData) {
        renderTimelineWithDragState(canvas, timelineData, {}, dragState);
      }
    }
  }, [trackRectangles, getCurrentTimelineData, isReordering]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragState.isDragging || !canvasRef.current || !trackRectangles.length) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const y = touch.clientY - rect.top;

    dragState.dragCurrentY = y;
    dragState.insertionPoint = findInsertionPoint(trackRectangles, y);

    // Re-render with updated drag state
    const timelineData = getCurrentTimelineData();
    if (timelineData) {
      renderTimelineWithDragState(canvas, timelineData, {}, dragState);
    }
  }, [trackRectangles, getCurrentTimelineData]);

  const handleTouchEnd = useCallback(async (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    await handleMouseUp();
  }, [handleMouseUp]);

  const handleToggleDemo = () => {
    setDemoMode(!demoMode);
    setError(null);
  };

  const hasData = pacePlan && pacePlan.splits.length > 0;
  const hasPlaylistTracks = (tracks && tracks.length > 0) || (playlistTracks && playlistTracks.length > 0);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Race Timeline Visualization
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {hasUnsavedChanges && (
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={savePlaylistOrder}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Order'}
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayIcon />}
              onClick={handleToggleDemo}
            >
              {demoMode ? 'Hide Demo' : 'Show Demo'}
            </Button>
          </Box>
        </Box>

        {!hasData && !demoMode && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {!pacePlan ? '👈 Select a race and pace plan from the left panel to visualize your race timeline.' : 'Add splits to your pace plan to visualize the race timeline.'}
          </Typography>
        )}

        {hasData && !demoMode && !hasPlaylistTracks && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Link a Spotify playlist to this pace plan to see songs on the timeline.
          </Typography>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 1 }}>Loading playlist tracks...</Typography>
          </Box>
        )}

        <Box sx={{ 
          position: 'relative',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          bgcolor: 'background.paper',
          minHeight: 620,
          overflow: 'auto',
        }}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              maxWidth: '100%',
              display: 'block',
              cursor: dragState.isDragging ? 'grabbing' : 'grab',
            }}
          />

          {isReordering && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 1000,
              borderRadius: 1,
            }}>
              <CircularProgress />
            </Box>
          )}
        </Box>

        {(demoMode || hasData) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Timeline flows vertically:</strong> Time progresses from top to bottom
              <br />
              <strong>Gray rectangles:</strong> Race splits with distance (km) and target time
              <br />
              <strong>Green rectangles:</strong> Spotify tracks with song and artist names
              {hasPlaylistTracks && (
                <>
                  <br />
                  <strong>Drag & Drop:</strong> Click and drag tracks to reorder your playlist
                </>
              )}
            </Typography>
          </Box>
        )}

        {/* Error notification */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!saveSuccess}
          autoHideDuration={3000}
          onClose={() => setSaveSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSaveSuccess(null)} severity="success" sx={{ width: '100%' }}>
            {saveSuccess}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};