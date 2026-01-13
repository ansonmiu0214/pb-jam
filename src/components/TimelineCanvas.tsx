import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import { renderTimeline, createMockTimelineData, type TimelineData } from '../ui/timelineRenderer';
import type { PacePlan, SpotifyTrack } from '../models/types';

interface TimelineCanvasProps {
  pacePlan?: PacePlan;
  tracks?: SpotifyTrack[];
  showDemo?: boolean;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({ 
  pacePlan, 
  tracks, 
  showDemo = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [demoMode, setDemoMode] = useState(showDemo);

  useEffect(() => {
    if (!canvasRef.current) return;

    let timelineData: TimelineData;

    if (demoMode || (!pacePlan && !tracks)) {
      // Use mock data for demo
      timelineData = createMockTimelineData();
    } else if (pacePlan) {
      // Use real pace plan data
      timelineData = {
        splits: pacePlan.splits,
        tracks: tracks || [],
        totalTime: pacePlan.targetTime,
        totalDistance: pacePlan.splits.reduce((sum, split) => sum + split.distance, 0),
      };
    } else {
      // No data to render
      return;
    }

    try {
      renderTimeline(canvasRef.current, timelineData);
    } catch (error) {
      console.error('Failed to render timeline:', error);
    }
  }, [pacePlan, tracks, demoMode]);

  const handleToggleDemo = () => {
    setDemoMode(!demoMode);
  };

  const hasData = pacePlan && pacePlan.splits.length > 0;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Race Timeline Visualization
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayIcon />}
            onClick={handleToggleDemo}
          >
            {demoMode ? 'Hide Demo' : 'Show Demo'}
          </Button>
        </Box>

        {!hasData && !demoMode && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Select a pace plan with splits to visualize the race timeline.
          </Typography>
        )}

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
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
            style={{
              maxWidth: '100%',
              maxHeight: '600px',
              display: 'block',
            }}
          />
        </Box>

        {(demoMode || hasData) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Timeline flows vertically:</strong> Time progresses from top to bottom
              <br />
              <strong>Gray rectangles:</strong> Race splits with distance (km) and target time
              <br />
              <strong>Green rectangles:</strong> Spotify tracks with song and artist names
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};