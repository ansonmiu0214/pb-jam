/**
 * Main entry point for PB Jam application
 */
import { initializeUI } from './ui/ui';

console.log('PB Jam - Spotify Race Playlist Visualizer loading...');

// Initialize the UI when the app loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
  });
} else {
  // DOM is already loaded
  initializeUI();
}
