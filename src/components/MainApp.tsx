import React, { useState, useEffect, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import { RaceSection } from './RaceSection';
import { PacePlanSection, type PacePlanSectionHandle } from './PacePlanSection';
import { PlaylistDisplay } from './PlaylistDisplay';
import { SpotifyDebug } from './SpotifyDebug';
import {
  getCurrentUser,
  onUserChange,
} from '../services/userService';
import { signOut as firebaseSignOut } from '../services/firebaseService';
import type { User } from '../models/types';

export const MainApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const pacePlanSectionRef = useRef<PacePlanSectionHandle>(null);

  useEffect(() => {
    // Set initial user
    setCurrentUser(getCurrentUser());

    // Subscribe to user changes
    const unsubscribe = onUserChange((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRaceCreated = () => {
    // Refresh the races list in PacePlanSection when a race is created
    pacePlanSectionRef.current?.refreshRaces();
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const userDisplay = currentUser
    ? currentUser.email || currentUser.id
    : 'User';

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PB Jam
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {userDisplay}
            </Typography>
            <IconButton
              size="large"
              aria-label="account menu"
              aria-controls="user-menu"
              aria-haspopup="true"
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={handleLogout}>
                <ExitToAppIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <SpotifyDebug />
          </Grid>
          <Grid item xs={12} md={6}>
            <RaceSection onRaceCreated={handleRaceCreated} />
          </Grid>
          <Grid item xs={12} md={6}>
            <PacePlanSection ref={pacePlanSectionRef} />
          </Grid>
          <Grid item xs={12}>
            <PlaylistDisplay onPlaylistSelect={(playlist) => {
              console.log('Playlist selected for testing:', playlist.name);
            }} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};