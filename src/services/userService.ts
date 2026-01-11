/**
 * User state management service
 * Stores and manages current user information in memory
 */

interface CurrentUser {
  id: string;
  email?: string;
  displayName?: string;
  provider: 'spotify' | 'google' | 'anonymous';
}

let currentUser: CurrentUser | null = null;
const userChangeListeners: Array<(user: CurrentUser | null) => void> = [];

/**
 * Get the currently authenticated user
 */
export function getCurrentUser(): CurrentUser | null {
  return currentUser;
}

/**
 * Set the current authenticated user
 */
export function setCurrentUser(user: CurrentUser | null): void {
  currentUser = user;
  notifyUserChangeListeners();
  if (user) {
    console.log(`User logged in: ${user.email || user.id} (${user.provider})`);
  } else {
    console.log('User logged out');
  }
}

/**
 * Subscribe to user state changes
 */
export function onUserChange(listener: (user: CurrentUser | null) => void): () => void {
  userChangeListeners.push(listener);
  // Return unsubscribe function
  return () => {
    const index = userChangeListeners.indexOf(listener);
    if (index > -1) {
      userChangeListeners.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of user state change
 */
function notifyUserChangeListeners(): void {
  userChangeListeners.forEach((listener) => {
    listener(currentUser);
  });
}

/**
 * Check if a user is currently logged in
 */
export function isUserLoggedIn(): boolean {
  return currentUser !== null;
}

/**
 * Clear user state (logout)
 */
export function clearUser(): void {
  setCurrentUser(null);
}