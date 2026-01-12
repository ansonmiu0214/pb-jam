import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlaylistPlay as PlaylistIcon,
} from '@mui/icons-material';
import { SpotifyPlaylist } from '../models/types';
import { fetchPlaylists, getCachedPlaylists, isSpotifyAuthenticated } from '../services/playlistManager';

interface PlaylistDisplayProps {
  onPlaylistSelect?: (playlist: SpotifyPlaylist) => void;
}

export const PlaylistDisplay: React.FC<PlaylistDisplayProps> = ({ onPlaylistSelect }) => {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load cached playlists on mount
    const cached = getCachedPlaylists();
    if (cached.length > 0) {
      setPlaylists(cached);
    }
    
    // Auto-fetch if authenticated and no cached playlists
    if (isSpotifyAuthenticated() && cached.length === 0) {
      handleFetchPlaylists();
    }
  }, []);

  const handleFetchPlaylists = async (forceRefresh = false) => {
    if (!isSpotifyAuthenticated()) {
      setError('Not authenticated with Spotify. Please log in first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedPlaylists = await fetchPlaylists(forceRefresh);
      setPlaylists(fetchedPlaylists);
      console.log(`Loaded ${fetchedPlaylists.length} playlists`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch playlists';
      console.error('Failed to fetch playlists:', err);
      setError(errorMessage || 'Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistClick = (playlist: SpotifyPlaylist) => {
    if (onPlaylistSelect) {
      onPlaylistSelect(playlist);
    }
    console.log('Selected playlist:', playlist.name);
  };

  if (!isSpotifyAuthenticated()) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Spotify Playlists
          </Typography>
          <Alert severity="info">
            Please authenticate with Spotify to view your playlists.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Spotify Playlists ({playlists.length})
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={() => handleFetchPlaylists(true)}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {playlists.length === 0 && !loading ? (
          <Alert severity="info">
            No playlists found. Try refreshing or check your Spotify account.
          </Alert>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {playlists.map((playlist) => (
              <ListItem
                key={playlist.id}
                onClick={() => handlePlaylistClick(playlist)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemAvatar>
                  {playlist.images && playlist.images.length > 0 ? (
                    <Avatar
                      src={playlist.images[0]?.url}
                      alt={playlist.name}
                      variant="square"
                    />
                  ) : (
                    <Avatar variant="square">
                      <PlaylistIcon />
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={playlist.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {playlist.tracks.total} tracks • by {playlist.owner.display_name}
                      </Typography>
                      {playlist.description && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {playlist.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};