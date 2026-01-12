import React, { useState, useEffect } from 'react';
import { LoginScreen } from './LoginScreen';
import { MainApp } from './MainApp';
import {
  onUserChange,
  isUserLoggedIn,
} from '../services/userService';
import { connectToEmulator } from '../services/firebaseService';

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

  if (loading) {
    return null; // Could add a loading spinner here
  }

  return isLoggedIn ? <MainApp /> : <LoginScreen />;
};