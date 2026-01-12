import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { spotifyTheme } from './theme/spotifyTheme';
import { App } from './components/App';

console.log('PB Jam - Spotify Race Playlist Visualizer loading...');

const container = document.getElementById('root');
if (!container) {
  throw new Error('Could not find root element');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={spotifyTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);