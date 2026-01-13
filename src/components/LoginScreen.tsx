import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Container,
  Card,
  CardContent,
  Stack,
  Collapse,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Person as PersonIcon,
  MusicNote as MusicNoteIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import {
  loginWithGoogle,
  loginAnonymously,
  loginWithSpotify,
} from '../services/firebaseService';
import { SpotifyDebug } from './SpotifyDebug';

export const LoginScreen: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const handleSpotifyLogin = async () => {
    setError(null);
    setShowDebug(false);
    setLoading(true);
    
    try {
      await loginWithSpotify();
      // Clear any error and debug panel on successful login
      setError(null);
      setShowDebug(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Spotify login failed:', err);
      setError(errorMessage || 'Spotify login failed. Please try again.');
      setShowDebug(true);  // Show debug panel on error
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setShowDebug(false);
    setLoading(true);
    
    try {
      await loginWithGoogle();
      setError(null);
      setShowDebug(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Google login failed:', err);
      setError(errorMessage || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError(null);
    setShowDebug(false);
    setLoading(true);
    
    try {
      await loginAnonymously();
      setError(null);
      setShowDebug(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Anonymous login failed:', err);
      setError(errorMessage || 'Anonymous login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          gap: 3,
        }}
      >
        <Collapse in={showDebug} sx={{ width: '100%' }}>
          <Box sx={{ mb: 2 }}>
            <SpotifyDebug />
          </Box>
        </Collapse>
        
        <Card
          sx={{
            width: '100%',
            maxWidth: 400,
            p: 4,
            textAlign: 'center',
          }}
        >
          <CardContent>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1 }}>
                PB Jam
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Spotify Race Playlist Visualizer
              </Typography>
            </Box>

            <Stack spacing={2}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<MusicNoteIcon />}
                onClick={handleSpotifyLogin}
                disabled={loading}
                sx={{
                  py: 1.5,
                  bgcolor: '#1db954',
                  '&:hover': {
                    bgcolor: '#1aa34a',
                  },
                }}
              >
                🎵 Login with Spotify
              </Button>

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                🔐 Login with Google
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<PersonIcon />}
                onClick={handleAnonymousLogin}
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                👤 Continue Anonymously
              </Button>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                size="small"
                startIcon={<BugReportIcon />}
                onClick={() => setShowDebug(!showDebug)}
                sx={{ color: 'text.secondary' }}
              >
                {showDebug ? 'Hide' : 'Show'} Debug Info
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};