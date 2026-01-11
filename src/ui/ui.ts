// UI components and DOM manipulation
import {
  loginWithGoogle,
  loginAnonymously,
  signOut as firebaseSignOut,
  getCurrentUser as getFirebaseUser,
  connectToEmulator,
} from '../services/firebaseService';
import {
  getCurrentUser,
  setCurrentUser,
  onUserChange,
  isUserLoggedIn,
} from '../services/userService';

/**
 * Initialize the application UI
 */
export function initializeUI(): void {
  connectToEmulator();
  renderLoginScreen();
  subscribeToUserChanges();
}

/**
 * Render the login screen with authentication options
 */
function renderLoginScreen(): void {
  const app = document.getElementById('app');
  if (!app) {
    console.error('Cannot find app container');
    return;
  }

  // If user is already logged in, don't show login screen
  if (isUserLoggedIn()) {
    renderMainApp();
    return;
  }

  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <h1>PB Jam</h1>
        <p class="subtitle">Spotify Race Playlist Visualizer</p>
        
        <div class="login-buttons">
          <button id="spotify-login-btn" class="btn btn-spotify" disabled>
            <span>🎵 Login with Spotify (Coming Soon)</span>
          </button>
          
          <button id="google-login-btn" class="btn btn-google">
            <span>🔐 Login with Google</span>
          </button>
          
          <button id="anonymous-login-btn" class="btn btn-anonymous">
            <span>👤 Continue Anonymously</span>
          </button>
        </div>
        
        <div id="login-error" class="login-error" style="display: none;"></div>
      </div>
    </div>
  `;

  attachLoginEventHandlers();
}

/**
 * Render the main application screen
 */
function renderMainApp(): void {
  const app = document.getElementById('app');
  if (!app) {
    console.error('Cannot find app container');
    return;
  }

  const user = getCurrentUser();
  const userDisplay = user ? `${user.email || user.id}` : 'User';

  app.innerHTML = `
    <div class="main-container">
      <header class="header">
        <h1>PB Jam</h1>
        <div class="user-menu">
          <span class="user-name">${userDisplay}</span>
          <button id="logout-btn" class="btn btn-logout">Logout</button>
        </div>
      </header>
      
      <main class="main-content">
        <h2>Welcome to PB Jam!</h2>
        <p>Create races and manage your Spotify playlists.</p>
        <p>Coming soon: race creation, pace planning, and playlist reordering.</p>
        <div id="auth-debug" class="debug-info">
          <p>Auth Provider: ${user?.provider || 'N/A'}</p>
          <p>User ID: ${user?.id || 'N/A'}</p>
        </div>
      </main>
    </div>
  `;

  attachMainAppEventHandlers();
}

/**
 * Attach event handlers to login buttons
 */
function attachLoginEventHandlers(): void {
  const spotifyBtn = document.getElementById('spotify-login-btn');
  const googleBtn = document.getElementById('google-login-btn');
  const anonymousBtn = document.getElementById('anonymous-login-btn');

  if (spotifyBtn) {
    spotifyBtn.addEventListener('click', handleSpotifyLogin);
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', handleGoogleLogin);
  }

  if (anonymousBtn) {
    anonymousBtn.addEventListener('click', handleAnonymousLogin);
  }
}

/**
 * Attach event handlers to main app
 */
function attachMainAppEventHandlers(): void {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

/**
 * Handle Spotify login
 */
async function handleSpotifyLogin(): Promise<void> {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }

  try {
    // TODO: Implement Spotify OAuth login
    console.log('Spotify login not yet implemented');
    showLoginError('Spotify login is not yet implemented');
  } catch (error) {
    console.error('Spotify login error:', error);
    showLoginError('Failed to login with Spotify');
  }
}

/**
 * Handle Google login
 */
async function handleGoogleLogin(): Promise<void> {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }

  try {
    await loginWithGoogle();
    const firebaseUser = getFirebaseUser();

    if (firebaseUser) {
      setCurrentUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || undefined,
        displayName: firebaseUser.displayName || undefined,
        provider: 'google',
      });
      renderMainApp();
    }
  } catch (error) {
    console.error('Google login error:', error);
    showLoginError('Failed to login with Google');
  }
}

/**
 * Handle anonymous login
 */
async function handleAnonymousLogin(): Promise<void> {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }

  try {
    await loginAnonymously();
    const firebaseUser = getFirebaseUser();

    if (firebaseUser) {
      setCurrentUser({
        id: firebaseUser.uid,
        provider: 'anonymous',
      });
      renderMainApp();
    }
  } catch (error) {
    console.error('Anonymous login error:', error);
    showLoginError('Failed to login anonymously');
  }
}

/**
 * Handle logout
 */
async function handleLogout(): Promise<void> {
  try {
    await firebaseSignOut();
    setCurrentUser(null);
    renderLoginScreen();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Display login error message
 */
function showLoginError(message: string): void {
  const errorDiv = document.getElementById('login-error');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

/**
 * Subscribe to user state changes and update UI
 */
function subscribeToUserChanges(): void {
  onUserChange((user) => {
    if (user) {
      renderMainApp();
    } else {
      renderLoginScreen();
    }
  });
}