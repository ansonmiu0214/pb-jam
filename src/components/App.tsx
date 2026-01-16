import React, { useState, useEffect } from 'react';
import { LoginScreen } from './LoginScreen';
import { MainApp } from './MainApp';
import { SpotifyCallback } from './SpotifyCallback';
import {
  onUserChange,
  isUserLoggedIn,
} from '../services/userService';
import { connectToEmulator } from '../services/firebaseService';
import { UnitProvider } from '../contexts/UnitContext';

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to Firebase emulator
    connectToEmulator();

    // Check initial login state
    setIsLoggedIn(isUserLoggedIn());
    setLoading(false);

    // Subscribe to user changes
    const unsubscribe = onUserChange((user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Check if this is a Spotify callback
  const isSpotifyCallback = window.location.search.includes('code=') || window.location.search.includes('error=');

  if (loading) {
    return null; // Could add a loading spinner here
  }

  if (isSpotifyCallback) {
    return <SpotifyCallback />;
  }

  return (
    <UnitProvider defaultUnit="km">
      {isLoggedIn ? <MainApp /> : <LoginScreen />}
    </UnitProvider>
  );
};