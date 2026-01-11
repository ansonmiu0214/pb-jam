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
import { createRace, fetchRaces, deleteRace } from '../managers/raceManager';
import { createPacePlan, fetchPacePlans, deletePacePlan } from '../managers/pacePlanManager';

/**
 * Track whether races are currently loading
 */
let isLoadingRaces = false;

/**
 * Set the disabled state of race form inputs
 */
function setRaceFormDisabled(disabled: boolean): void {
  const titleInput = document.getElementById('race-title-input') as HTMLInputElement;
  const distanceInput = document.getElementById('race-distance-input') as HTMLInputElement;
  const unitSelect = document.getElementById('race-unit-select') as HTMLSelectElement;
  const createRaceBtn = document.getElementById('create-race-btn') as HTMLButtonElement;

  if (titleInput) titleInput.disabled = disabled;
  if (distanceInput) distanceInput.disabled = disabled;
  if (unitSelect) unitSelect.disabled = disabled;
  if (createRaceBtn) createRaceBtn.disabled = disabled;
}

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
        <div class="content-wrapper">
          <!-- Race Section -->
          <section class="section race-section">
            <h2>Races</h2>
            
            <div class="form-group">
              <h3>Create New Race</h3>
              <input type="text" id="race-title-input" placeholder="Race title (e.g., Boston Marathon)" />
              <input type="number" id="race-distance-input" placeholder="Distance" step="0.1" />
              <select id="race-unit-select">
                <option value="km">Kilometers (km)</option>
                <option value="mi">Miles (mi)</option>
              </select>
              <button id="create-race-btn" class="btn btn-primary">Create Race</button>
            </div>

            <div id="races-list" class="races-list">
              <p class="loading">Loading races...</p>
            </div>
          </section>

          <!-- Pace Plan Section -->
          <section class="section pace-plan-section">
            <h2>Pace Plans</h2>
            
            <div class="form-group">
              <h3>Create New Pace Plan</h3>
              <select id="race-select">
                <option value="">Select a race first</option>
              </select>
              <input type="text" id="pace-plan-title-input" placeholder="Pace plan title (e.g., Target Pace)" />
              <input type="number" id="pace-plan-time-input" placeholder="Target time (seconds)" step="1" />
              <button id="create-pace-plan-btn" class="btn btn-primary">Create Pace Plan</button>
            </div>

            <div id="pace-plans-list" class="pace-plans-list">
              <p class="loading">Select a race to see pace plans</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  `;

  attachMainAppEventHandlers();
  loadRaces();
}

/**
 * Load and display races
 */
async function loadRaces(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  isLoadingRaces = true;
  setRaceFormDisabled(true);

  try {
    const races = await fetchRaces(user.id);
    const racesList = document.getElementById('races-list');
    const raceSelect = document.getElementById('race-select') as HTMLSelectElement;

    if (!racesList || !raceSelect) return;

    // Update race list display
    if (races.length === 0) {
      racesList.innerHTML = '<p class="empty-state">No races yet. Create one above!</p>';
      raceSelect.innerHTML = '<option value="">No races available</option>';
    } else {
      racesList.innerHTML = races
        .map(
          (race) => `
          <div class="race-card">
            <h4>${race.title}</h4>
            <p>Distance: ${race.distance} ${race.unit}</p>
            <p>Created: ${race.createdAt?.toLocaleDateString() || 'N/A'}</p>
            <button class="btn btn-secondary delete-race-btn" data-race-id="${race.id}">Delete</button>
          </div>
        `
        )
        .join('');

      // Update race selector for pace plans
      raceSelect.innerHTML =
        '<option value="">Select a race</option>' +
        races
          .map((race) => `<option value="${race.id}">${race.title} (${race.distance}${race.unit})</option>`)
          .join('');
    }

    // Attach delete handlers
    document.querySelectorAll('.delete-race-btn').forEach((btn) => {
      btn.addEventListener('click', handleDeleteRace);
    });

    // Update pace plans when race is selected
    // Remove any existing listeners first to avoid duplicates
    raceSelect.removeEventListener('change', loadPacePlans);
    raceSelect.addEventListener('change', loadPacePlans);
  } catch (error) {
    console.error('Error loading races:', error);
    const racesList = document.getElementById('races-list');
    if (racesList) {
      racesList.innerHTML = '<p class="error">Error loading races</p>';
    }
  } finally {
    isLoadingRaces = false;
    setRaceFormDisabled(false);
  }
}

/**
 * Load and display pace plans for selected race
 */
async function loadPacePlans(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  const raceSelect = document.getElementById('race-select') as HTMLSelectElement;
  const pacePlansList = document.getElementById('pace-plans-list');

  if (!raceSelect || !pacePlansList || !raceSelect.value) {
    pacePlansList!.innerHTML = '<p class="empty-state">Select a race to see pace plans</p>';
    return;
  }

  try {
    const pacePlans = await fetchPacePlans(user.id, raceSelect.value);

    if (pacePlans.length === 0) {
      pacePlansList.innerHTML = '<p class="empty-state">No pace plans for this race. Create one above!</p>';
    } else {
      pacePlansList.innerHTML = pacePlans
        .map(
          (plan) => `
          <div class="pace-plan-card">
            <h4>${plan.title}</h4>
            <p>Target Time: ${Math.floor(plan.targetTime / 60)} minutes</p>
            <p>Splits: ${plan.splits.length}</p>
            <p>Created: ${plan.createdAt?.toLocaleDateString() || 'N/A'}</p>
            <button class="btn btn-secondary delete-pace-plan-btn" data-pace-plan-id="${plan.id}">Delete</button>
          </div>
        `
        )
        .join('');

      // Attach delete handlers
      document.querySelectorAll('.delete-pace-plan-btn').forEach((btn) => {
        btn.addEventListener('click', handleDeletePacePlan);
      });
    }
  } catch (error) {
    console.error('Error loading pace plans:', error);
    pacePlansList.innerHTML = '<p class="error">Error loading pace plans</p>';
  }
}

/**
 * Handle race creation
 */
async function handleCreateRace(): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    alert('Please log in first');
    return;
  }

  const titleInput = document.getElementById('race-title-input') as HTMLInputElement;
  const distanceInput = document.getElementById('race-distance-input') as HTMLInputElement;
  const unitSelect = document.getElementById('race-unit-select') as HTMLSelectElement;
  const createRaceBtn = document.getElementById('create-race-btn') as HTMLButtonElement;

  const title = titleInput?.value?.trim();
  const distance = parseFloat(distanceInput?.value || '0');
  const unit = (unitSelect?.value || 'km') as 'km' | 'mi';

  if (!title || distance <= 0) {
    alert('Please enter a valid title and distance');
    return;
  }

  // Disable the button to prevent double submission
  if (createRaceBtn) {
    createRaceBtn.disabled = true;
  }

  try {
    await createRace(user.id, title, distance, unit);
    alert('Race created successfully!');
    titleInput.value = '';
    distanceInput.value = '';
    await loadRaces();
  } catch (error) {
    console.error('Error creating race:', error);
    alert('Failed to create race. Check the console for details.');
    // Re-enable button on error
    if (createRaceBtn) {
      createRaceBtn.disabled = false;
    }
  }
}

/**
 * Handle pace plan creation
 */
async function handleCreatePacePlan(): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    alert('Please log in first');
    return;
  }

  const raceSelect = document.getElementById('race-select') as HTMLSelectElement;
  const titleInput = document.getElementById('pace-plan-title-input') as HTMLInputElement;
  const timeInput = document.getElementById('pace-plan-time-input') as HTMLInputElement;

  const raceId = raceSelect?.value?.trim();
  const title = titleInput?.value?.trim();
  const targetTime = parseInt(timeInput?.value || '0', 10);

  if (!raceId || !title || targetTime <= 0) {
    alert('Please select a race and enter a valid title and time');
    return;
  }

  try {
    await createPacePlan(user.id, raceId, title, targetTime);
    alert('Pace plan created successfully!');
    titleInput.value = '';
    timeInput.value = '';
    await loadPacePlans();
  } catch (error) {
    console.error('Error creating pace plan:', error);
    alert('Failed to create pace plan. Check the console for details.');
  }
}

/**
 * Handle race deletion
 */
async function handleDeleteRace(event: Event): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  const btn = event.target as HTMLButtonElement;
  const raceId = btn.getAttribute('data-race-id');

  if (!raceId || !confirm('Are you sure you want to delete this race?')) {
    return;
  }

  try {
    await deleteRace(user.id, raceId);
    alert('Race deleted successfully!');
    await loadRaces();
  } catch (error) {
    console.error('Error deleting race:', error);
    alert('Failed to delete race.');
  }
}

/**
 * Handle pace plan deletion
 */
async function handleDeletePacePlan(event: Event): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  const btn = event.target as HTMLButtonElement;
  const pacePlanId = btn.getAttribute('data-pace-plan-id');

  if (!pacePlanId || !confirm('Are you sure you want to delete this pace plan?')) {
    return;
  }

  try {
    await deletePacePlan(user.id, pacePlanId);
    alert('Pace plan deleted successfully!');
    await loadPacePlans();
  } catch (error) {
    console.error('Error deleting pace plan:', error);
    alert('Failed to delete pace plan.');
  }
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

  const createRaceBtn = document.getElementById('create-race-btn');
  if (createRaceBtn) {
    createRaceBtn.addEventListener('click', handleCreateRace);
  }

  const createPacePlanBtn = document.getElementById('create-pace-plan-btn');
  if (createPacePlanBtn) {
    createPacePlanBtn.addEventListener('click', handleCreatePacePlan);
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