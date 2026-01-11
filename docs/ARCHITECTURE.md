# Architecture Diagram - Authentication Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser / Frontend                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  src/index.ts (Entry Point)                             │  │
│  │  - Initializes app on page load                         │  │
│  │  - Calls initializeUI()                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  src/ui/ui.ts (UI Module)                               │  │
│  │  - renderLoginScreen() / renderMainApp()                │  │
│  │  - Attaches event handlers                              │  │
│  │  - Subscribes to user state changes                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│           ↓                              ↓                      │
│  ┌────────────────────┐    ┌─────────────────────────────┐   │
│  │ HTML/DOM           │    │ Event Handlers              │   │
│  │ - Login buttons    │    │ - handleGoogleLogin()       │   │
│  │ - Main app         │    │ - handleAnonymousLogin()    │   │
│  │ - User display     │    │ - handleLogout()            │   │
│  └────────────────────┘    └─────────────────────────────┘   │
│           ↑                              ↓                      │
│           └──────────────┬───────────────┘                     │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  src/services/userService.ts (State Management)         │  │
│  │                                                          │  │
│  │  currentUser: CurrentUser | null                        │  │
│  │  userChangeListeners: Function[]                        │  │
│  │                                                          │  │
│  │  - getCurrentUser()      - Store in memory              │  │
│  │  - setCurrentUser()      - Notify listeners             │  │
│  │  - onUserChange()        - Subscribe pattern            │  │
│  │  - isUserLoggedIn()      - Check auth state             │  │
│  │  - clearUser()           - Logout                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│           ↑                              ↓                      │
│           │                              │                      │
│           │ (1) Call login function      │ (3) Store user      │
│           │     Get auth result          │                     │
│           │                              │                      │
│           │    (2) Notify                │ (4) Fire event      │
│           │        listeners             │     Update UI       │
│           │                              │                      │
│  ┌────────┴──────────────────────────────┴──────────────────┐ │
│  │  src/services/firebaseService.ts (Auth Services)        │ │
│  │                                                          │ │
│  │  Firebase App (initialized)                             │ │
│  │  - db: Firestore instance                               │ │
│  │  - auth: Firebase Auth instance                         │ │
│  │                                                          │ │
│  │  Login Functions:                                        │ │
│  │  - loginWithGoogle()    → signInWithPopup (Google)      │ │
│  │  - loginAnonymously()   → signInAnonymously()           │ │
│  │  - loginWithSpotify()   → Placeholder (Prompt 5.1)      │ │
│  │                                                          │ │
│  │  Support:                                                │ │
│  │  - connectToEmulator()  → Firebase Emulator             │ │
│  │  - getCurrentUser()     → Firebase Auth user            │ │
│  │  - signOut()            → Logout from Firebase          │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ↓                     ↓
        ┌─────────────────────┐  ┌──────────────────────┐
        │ Firebase Emulator   │  │ Firebase Cloud       │
        │ (Local Dev)         │  │ (Production)         │
        │                     │  │                      │
        │ - Auth: 9099        │  │ - Real auth service  │
        │ - Firestore: 8080   │  │ - Cloud Firestore    │
        │ - Hosting: 5000     │  │ - Cloud Storage      │
        │ - UI: 4000          │  │                      │
        └─────────────────────┘  └──────────────────────┘
```

---

## Login Flow Sequence Diagram

```
User              Browser           userService       firebaseService       Firebase
│                  │                   │                    │                  │
├─ Open app ──────>│                   │                    │                  │
│                  │ initializeUI()    │                    │                  │
│                  ├─────────────────>│                    │                  │
│                  │                  ├─ connectToEmulator()──────────────>│
│                  │                  │                    │<────────────┤
│                  │ renderLoginScreen()                   │              │
│                  │<──────────────────┤                    │              │
│                  │ Show login buttons                     │              │
│                  │                   │                    │              │
│ Click "Google"──>│ handleGoogleLogin()                   │              │
│                  ├──────────────────────── loginWithGoogle()           │
│                  │                    │                  ├────────────>│
│                  │                    │                  │ OAuth popup │
│ Sign in ────────>│ [User sees popup]  │                  │             │
│                  │                    │                  │<────────────┤
│                  │                    │                  │ Auth token  │
│ Confirm ────────>│                    │                  │             │
│                  │                    │     Return user  │             │
│                  │                    │<─────────────────┤             │
│                  │ getFirebaseUser()  │                  │             │
│                  ├──────────────────>│                  │             │
│                  │     user object    │                  │             │
│                  │<──────────────────┤                   │             │
│                  │ setCurrentUser()   │                  │             │
│                  ├──────────────────>│                   │             │
│                  │                  ├─ Notify listeners  │             │
│                  │                  │    renderMainApp() │             │
│                  │<──────────────────┤                   │             │
│                  │ Show user info    │                   │             │
│                  │ & logout button   │                   │             │
│                  │                   │                   │             │
│ Logout ────────>│ handleLogout()     │                   │             │
│                  ├────────────────────────── signOut()    │             │
│                  │                    │                  ├────────────>│
│                  │                    │                  │<────────────┤
│                  │ clearUser()        │                  │             │
│                  ├──────────────────>│                   │             │
│                  │                  ├─ Notify listeners  │             │
│                  │                  │    renderLoginScreen()           │
│                  │<──────────────────┤                    │             │
│ Back to login ──>│                   │                    │             │
│                  │                   │                    │             │
```

---

## Component Dependencies

```
index.ts
  ↓
ui.ts
  ├─→ firebaseService.ts
  │    ├─→ firebase/app
  │    ├─→ firebase/firestore
  │    ├─→ firebase/auth
  │    └─→ (Emulator)
  │
  ├─→ userService.ts
  │    └─→ (In-memory state)
  │
  └─→ styles.css (DOM rendering)


Tests:
├─→ tests/userService.test.ts
│    └─→ userService.ts
│
├─→ tests/auth.test.ts
│    ├─→ firebaseService.ts
│    └─→ userService.ts
│
└─→ tests/firebase.test.ts
     └─→ firebaseService.ts
```

---

## User State Flow

```
┌─────────────────────┐
│  App loads          │
│  currentUser = null │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────────────────┐
│  User clicks login button       │
│  (Google or Anonymous)          │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│  Firebase processes login       │
│  Returns user object            │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│  setCurrentUser(user) called    │
│  currentUser = { ... }          │
│  Notify listeners               │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│  UI listeners triggered         │
│  renderMainApp() called         │
│  User sees main screen          │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│  User is logged in              │
│  Can use the app                │
└──────────┬──────────────────────┘
           │
           ↓ (User clicks Logout)
┌─────────────────────────────────┐
│  clearUser() called             │
│  currentUser = null             │
│  Notify listeners               │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────────────────┐
│  UI listeners triggered         │
│  renderLoginScreen() called     │
│  User sees login screen         │
└─────────────────────────────────┘
```

---

## Data Structure

### CurrentUser (In Memory)

```typescript
{
  id: "google-123456789",           // From Firebase Auth
  email: "user@gmail.com",           // From Google profile
  displayName: "John Doe",           // From Google profile
  provider: "google"                 // Login method
}

// Alternative: Anonymous
{
  id: "anon-xyz789",                 // Generated by Firebase
  provider: "anonymous"              // Login method
}

// Alternative: Spotify (Future)
{
  id: "spotify-abc123",              // From Spotify API
  email: "user@spotify.com",         // From Spotify profile
  displayName: "Spotify User",       // From Spotify profile
  provider: "spotify"                // Login method
}
```

### FirebaseAuth User Object

```typescript
{
  uid: "google-123456789",           // Same as currentUser.id
  email: "user@gmail.com",           // From provider
  displayName: "John Doe",           // From provider
  photoURL: "https://...",           // From provider
  metadata: { ... },                 // Creation/last sign-in times
  // ... and many more fields
}
```

---

## Error Handling Flow

```
User clicks login
       ↓
Try authentication
       ├─→ Success
       │   ├─→ setCurrentUser()
       │   ├─→ renderMainApp()
       │   └─→ User logged in ✅
       │
       └─→ Error
           ├─→ Catch error
           ├─→ Log to console
           ├─→ showLoginError()
           ├─→ Display error message
           └─→ User stays on login screen ❌
```

---

## Event Listener Pattern

```
onUserChange(listener1)
onUserChange(listener2)
onUserChange(listener3)

setCurrentUser(newUser)
    ↓
for each listener in userChangeListeners:
    listener1(newUser)
    listener2(newUser)
    listener3(newUser)
    ↓
All listeners get notified of change
```

---

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Reactive UI updates
- ✅ Testable components
- ✅ Scalable design
- ✅ Easy to extend (add more providers)
- ✅ Error handling
- ✅ Developer-friendly debugging
