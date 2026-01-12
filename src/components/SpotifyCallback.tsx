import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

export const SpotifyCallback: React.FC = () => {
  useEffect(() => {
    // Handle Spotify OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (window.opener) {
      if (error) {
        // Send error to parent window
        window.opener.postMessage({
          type: 'spotify-auth',
          error: error || 'Authentication failed'
        }, window.location.origin);
      } else if (code) {
        // Send code to parent window
        window.opener.postMessage({
          type: 'spotify-auth',
          code: code
        }, window.location.origin);
      } else {
        // No code or error - something went wrong
        window.opener.postMessage({
          type: 'spotify-auth',
          error: 'No authorization code received'
        }, window.location.origin);
      }
      
      // Close the popup window
      window.close();
    } else {
      // Not in a popup, redirect to main app
      window.location.href = '/';
    }
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="h6">
        Processing Spotify authentication...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This window will close automatically.
      </Typography>
    </Box>
  );
};