import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  Box,
  Button,
  Stack 
} from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';

export const SpotifyDebug: React.FC = () => {
  const currentOrigin = window.location.origin;
  const spotifyClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const spotifyRedirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Spotify Configuration Debug
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Current Origin (should be your redirect URI):
            </Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" fontFamily="monospace">
                  {currentOrigin}
                </Typography>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  onClick={() => copyToClipboard(currentOrigin)}
                >
                  Copy
                </Button>
              </Box>
            </Alert>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Configured Spotify Client ID:
            </Typography>
            <Typography variant="body2" fontFamily="monospace">
              {spotifyClientId || 'NOT SET'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Configured Redirect URI:
            </Typography>
            <Typography 
              variant="body2" 
              fontFamily="monospace"
              color={spotifyRedirectUri === currentOrigin ? 'success.main' : 'error.main'}
            >
              {spotifyRedirectUri || 'NOT SET'}
            </Typography>
            {spotifyRedirectUri !== currentOrigin && (
              <Alert severity="error" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Mismatch!</strong> Your redirect URI does not match your current origin.
                  <br />
                  Update your .env.local file and Spotify app settings.
                </Typography>
              </Alert>
            )}
          </Box>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Steps to fix:</strong>
              <br />
              1. Copy the current origin above
              <br />
              2. Update VITE_SPOTIFY_REDIRECT_URI in your .env.local file
              <br />
              3. Update the redirect URI in your Spotify app settings at{' '}
              <a 
                href="https://developer.spotify.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                developer.spotify.com/dashboard
              </a>
              <br />
              4. Restart your dev server
            </Typography>
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
};