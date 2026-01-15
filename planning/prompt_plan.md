# Spotify Race Playlist Visualizer - LLM Prompt Plan

This file contains a series of LLM prompts for generating code incrementally.
**Goal:** minimal end-to-end workflow: CI/CD → Spotify login → create race/pace plan → link playlist → reorder tracks.
**After Tier 1 is working**, incremental enhancements (validation, split editing, elevation, tags, tooltips) can be added in Tier 2.

**UPDATED:** Project has been refactored from vanilla TypeScript to React with Material-UI.

---

## Tier 0: React + Material-UI Refactor (COMPLETED)

### Chunk 0: React Migration

```text
# Prompt 0.1: Refactor to React + Material-UI
Follow this plan to refactor the current implementation to use React and Material UI:

1. **Setup React + MUI dependencies** – Update package.json with React, ReactDOM, MUI core/icons, emotion (MUI's CSS-in-JS), and React testing dependencies, then update vite.config.ts and vitest.config.ts for React JSX support.

2. **Create Spotify-themed MUI theme** – Build a custom theme file with Spotify green (#1db954) as primary color, dark backgrounds, and override MUI components to match current styling.

3. **Convert entry point to React** – Replace index.html root div with React root, update src/index.ts to src/index.tsx to use ReactDOM.createRoot(), and wrap the app with theme provider.

4. **Build React login screen component** – Convert vanilla login HTML/event handlers to a React component using MUI Button, Box, and Typography; integrate with existing userService and firebaseService.

5. **Build main app layout component** – Create a responsive layout using MUI AppBar, Container, and Grid; refactor race and pace plan sections into reusable components with CRUD handlers.

6. **Refactor race & pace plan cards** – Convert src/ui/ui.ts list rendering to React components using MUI Card, TextField, Select; attach handlers via React callbacks instead of manual event listeners.

7. **Replace alerts/confirms with MUI dialogs** – Convert alert() and confirm() calls to MUI Dialog and Snackbar components for loading feedback and confirmations.

8. **Migrate styles** – Remove styles.css dependency and use MUI theme config and sx prop for component-specific styling.

9. **Update tests for React components** – Add React Testing Library tests for login screen and main app components.

10. **Update TypeScript config and linting** – Ensure tsconfig.json and ESLint rules support React/JSX syntax with react/react-hooks plugins.
```

**Result:** Application successfully converted to React + Material-UI with:
- Complete UI refactor using Material-UI components
- Custom Spotify-themed styling
- Proper confirmation dialogs
- React component tests
- TypeScript and ESLint configuration for React

---

## Tier 1: Minimal End-to-End Workflow

### Chunk 1: Project Setup

```text
# Prompt 1.1: Initialize project repository
Generate a new git repository for a TypeScript frontend web app called "PB Jam" - it is a Spotify Race Playlist Visualizer. Include a README.md with the project title and short description. Ensure ES Modules compatibility. No code yet. Confirm repository is ready for adding source files.
```

```text
# Prompt 1.2: Install project dependencies
Install the following npm packages:
- typescript
- eslint + recommended plugins
- vitest
Configure:
- `tsconfig.json` for ES Modules with strict mode
- `.eslintrc.json` with recommended linting rules
- `vitest.config.ts`
Add npm scripts:
- `build` → compile TypeScript
- `lint` → run ESLint
- `test` → run Vitest
Verify packages are installed and TypeScript compiles.
```

```text
# Prompt 1.3: Setup folder structure and empty modules
Create folders:
- src/managers
- src/ui
- src/services
- src/models
- tests/
Add:
- index.html
- styles.css
Create empty module files in src/managers and src/services:
- raceManager.ts
- pacePlanManager.ts
- playlistManager.ts
- firebaseService.ts
- timelineRenderer.ts
- ui.ts
- undoRedoManager.ts
Create src/models/types.ts for TypeScript interfaces.
```

### Chunk 2: CI/CD Setup

```text
# Prompt 2.1: GitHub Actions workflow
Create `.github/workflows/main.yml`:
- Lint project with ESLint
- Run Vitest tests
- Deploy to Firebase Hosting (static frontend)
Ensure workflow passes on initial empty project files.
```

### Chunk 3: Firebase & Authentication

```text
# Prompt 3.1: Firebase initialization
Setup Firebase SDK in firebaseService.ts:
- Initialize Firestore
- Initialize Firebase Auth
- Include placeholders for Spotify login or fallback login
Verify Firebase config can connect to project.
```

```text
# Prompt 3.2: Implement basic login flow
Implement:
- Spotify login button
- Firebase Auth login fallback
- After login, store current user ID in memory
Test that user can log in and Firebase Auth returns a valid user.
```

```text
# Prompt 3.3: Test Firestore connection
Implement a test function to:
- Create a dummy document in Firestore
- Read the document back
Verify Firestore read/write works for logged-in user.
```

### Chunk 4: Data Models & Race/PacePlan CRUD

```text
# Prompt 4.1: Define TypeScript interfaces
In src/models/types.ts, define:
- Race { id, title, distance, unit, tags, createdAt?, updatedAt?, pacePlans? }
- PacePlan { id, title, targetTime, splits[], spotifyPlaylistId, tags[], createdAt?, updatedAt? }
- Split { distance, targetTime, pace, elevation }
Ensure type safety for all fields.
```

```text
# Prompt 4.2: Implement raceManager.ts basic CRUD
Implement functions:
- createRace(title, distance, unit) → stores race in Firestore
- fetchRaces() → fetch all races for current user
- deleteRace(id) → remove race (placeholder cascade for pacePlans)
Include console logs to verify success.
```

```text
# Prompt 4.3: Implement pacePlanManager.ts basic CRUD
Implement functions:
- createPacePlan(raceId, title, targetTime) → stores pace plan in Firestore linked to race
- fetchPacePlans(raceId) → fetch pace plans for a race
Test by creating a race and then a pace plan linked to it.
```

### Chunk 5: Spotify Playlist Integration (basic)

```text
# Prompt 5.1: Connect to Spotify API (COMPLETED)
Implement Spotify authentication:
- OAuth login via Spotify
- Fetch user playlists after login
- Cache playlists in memory for session
Test fetching playlists and confirm display of playlist names.

**Result:** Spotify authentication successfully implemented with:
- OAuth login flow via popup window
- Playlist fetching with pagination and caching
- PlaylistDisplay React component
- Updated LoginScreen with functional Spotify button
- Comprehensive error handling and token refresh
- Test cases for authentication and playlist management

```text
# Prompt 5.2: Link pace plan to playlist (COMPLETED)
Add ability to select a Spotify playlist when creating a pace plan.
Store Spotify playlist ID in Firestore alongside pace plan.
Test that pace plan shows linked playlist.

**Result:** Playlist linking functionality successfully implemented with:
- Updated PacePlan interface already included spotifyPlaylistId field
- Modified createPacePlan function to accept optional spotifyPlaylistId parameter
- Added playlist selection dropdown to PacePlanSection form with Spotify authentication check
- Updated pace plan display to show linked playlist name
- Added comprehensive tests for playlist-linked pace plans
- Form validation ensures empty playlist ID is not stored
```

### Chunk 6: Timeline Canvas Renderer (basic)

```text
# Prompt 6.1: Draw race splits on canvas (COMPLETED)
In timelineRenderer.ts:
- Create HTML canvas
- Draw linear timeline representing race splits
- Draw song rectangles with song name (text only)
- No advanced features yet (no elevation or color-coding)
Verify canvas renders correctly with mock data.

**Result:** Timeline canvas renderer successfully implemented with:
- Complete timelineRenderer.ts module with canvas drawing functions
- TimelineCanvas React component for integration with the app
- Linear timeline visualization with time markers and axis
- Race split rectangles showing distance and target time
- Spotify track rectangles with song names (truncated if needed)
- Mock data generation for testing and demonstration
- Responsive canvas sizing and proper text rendering
- Comprehensive test coverage for canvas rendering functions
```

### Chunk 7: Drag-and-Drop Reordering

```text
# Prompt 7.1: Implement drag-and-drop for songs (COMPLETED)
Enable user to drag song rectangles and reorder.
Update in-memory playlist order after drag ends.
Provide visual feedback: highlight insertion point.

**Result:** Drag-and-drop functionality successfully implemented with:
- Enhanced timelineRenderer.ts with drag state support and track rectangle hit testing
- Mouse and touch event handlers in TimelineCanvas component
- Visual feedback with highlighting and insertion lines
- Automatic playlist track fetching when pace plan has linked Spotify playlist
- Real-time playlist reordering via Spotify API
- Error handling and user notifications for failed operations
- Comprehensive test coverage for drag-and-drop logic
```

```text
# Prompt 7.2: Save reordered playlist to Spotify
Implement save function:
- Sends updated track order to Spotify API
- Basic success/failure feedback (no retry yet)
Verify playlist order updates correctly in Spotify.
```

### Verification Instructions

After each step:

1. Run `npm run lint` → ensure no ESLint errors.
2. Run `npm test` → ensure all Vitest tests pass (for logic steps).
3. Test in browser:

   * Login works
   * Races and pace plans can be created
   * Playlist can be linked and reordered
   * Canvas displays timeline and songs
4. Confirm CI/CD workflow triggers and passes on GitHub Actions.

---

## Tier 2: Incremental Enhancements

After completing Tier 1 MVP:

* Add split editing, merge/split, validation
* Elevation visualization, distance markers
* Undo/redo for all actions
* Tooltip hover/tap support
* Playlist overflow visual cues
* Tags for races and pace plans
* Spotify API retry with exponential backoff
* Accessibility and responsive enhancements

### Chunk 8: Split Editing & Validation

```text
# Prompt 8.1 — Add split editing UI (COMPLETED)
Extend the pace plan UI to support editing splits.

Requirements:
- Display splits as a list or table:
  - distance (km)
  - target time (seconds or mm:ss input)
  - computed pace (min/km, read-only)
- Allow adding a new split
- Allow deleting an existing split
- Allow editing distance and target time fields
- Do NOT enforce validation yet
- Temporary invalid states are allowed in the UI

Constraints:
- No breaking changes to existing pace plans
- Use TypeScript types consistently

**Result:** Split editing UI successfully implemented with:
- Collapsible splits table in PacePlanSection component with Material-UI components
- Editable distance (km) and target time fields with number/time input support
- Read-only computed pace display (automatically calculated)
- Add Split button with default 5km/25min values
- Delete split functionality with protection against deleting the last split
- Save/Cancel buttons for commits and rollbacks
- Complete state management for editing sessions
- Time input supports both MM:SS format and seconds
- Comprehensive test coverage in PacePlanSection.test.tsx
- Integration with existing updatePacePlanSplits function in pacePlanManager
```

TODO:

- global `km <-> miles` in the navbar
- use this to create a race, store both km/miles in the database.
- when fetching the race, fetch both km/miles; then render based on navbar option and pick the right value.

```text
# Prompt 8.2 — Core split validation logic
Implement split validation logic in pacePlanManager.ts.

Validation rules:
- Sum of split distances must equal race distance
- Sum of split target times must equal pace plan target time
- Minimum split distance is 0.1 km
- Elevation may be negative (no validation error)

Implementation details:
- Return structured results:
  {
    errors: ValidationError[],
    warnings: ValidationWarning[]
  }
- Errors block saving
- Warnings do not block saving
- Do not wire to UI yet
```

```text
# Prompt 8.3 — Merge & split helpers
Implement split manipulation helpers in pacePlanManager.ts.

Functions:
- mergeSplits(indexA, indexB)
- splitSplit(index, strategy = "even")

Behavior:
- mergeSplits combines distance and time
- splitSplit divides distance and time evenly by default
- Return new split arrays (no mutation)

Then wire these helpers to the split editing UI.
```

```text
# Prompt 8.4 — Enforce validation before save
Prevent saving a pace plan if validation errors exist.

UI behavior:
- Inline color-coded feedback:
  - Red = blocking error
  - Amber = warning
- Save button disabled when errors exist
- Error messages shown near affected splits

Do not change validation rules.
```

### Chunk 9: Elevation & Distance Visualization

```text
# Prompt 9.1 — Persist elevation data
Extend split editing to include elevation (integer meters).

Requirements:
- Editable elevation input per split
- Persist elevation to Firestore
- Backward compatible with existing pace plans
- Default elevation = 0 for older data
```

```text
# Prompt 9.2 — Render elevation on timeline
Extend timelineRenderer.ts to visualize elevation.

Rendering rules:
- Uphill (positive elevation): red
- Downhill (negative elevation): green
- Flat: gray
- Elevation aligns with split segments

Performance:
- No noticeable slowdown for large playlists
```

```text
# Prompt 9.3 — Distance markers
Add distance markers to the timeline.

Requirements:
- Marker at every 1 km
- Respect race unit (km/miles) for labeling
- Pace display remains min/km
- Markers reposition correctly on resize
```

### Chunk 10: Undo / Redo System

```text
Prompt 10.1 — Undo/redo manager
Implement undoRedoManager.ts.

API:
- push(state)
- undo()
- redo()
- canUndo()
- canRedo()

Requirements:
- Bounded stack size
- Safe memory usage
- Generic (not pace-plan specific)
```

```text
# Prompt 10.2 — Undo/redo for split editing
Wire undo/redo to split operations:
- Edit distance
- Edit target time
- Add split
- Remove split
- Merge / split operations

Ensure:
- UI and state fully restored
- Validation state restored correctly
```

```text
# Prompt 10.3 — Undo/redo for playlist reordering
Wire undo/redo to playlist drag-and-drop.

Rules:
- Each reorder is one undo step
- Undo/redo stack resets:
  - On page reload
  - After successful Spotify save
```

### Chunk 11: Tooltips & Visual Feedback

```text
# Prompt 11.1 — Unified tooltip system
Implement a tooltip system in ui.ts.

Behavior:
- Hover-triggered on desktop
- Tap-triggered on touch devices
- Dismiss on outside click/tap
- Single tooltip instance reused
```

```text
# Prompt 11.2 — Song metadata tooltips
Add tooltips to song rectangles.

Content:
- Track title
- Artist name
- Duration

Tooltip follows pointer/finger position.
```

```text
# Prompt 11.3 — Playlist overflow indicators
Visually mark songs that extend beyond race total time.

Rules:
- Red border for overflow songs
- Songs remain draggable
- Overflow does not block saving
```

### Chunk 12: Tags & Metadata

```text
# Prompt 12.1 — Tags for races and pace plans
Add tag support to races and pace plans.

Requirements:
- Tags are free-form strings
- Add/remove tags via UI
- Persist tags in Firestore
- Backward compatible with existing data
```

```text
# Prompt 12.2 — Tag filtering
Enable filtering by tags.

Behavior:
- Filter races by tag
- Filter pace plans by tag
- Default chronological order preserved
```

### Chunk 13: Spotify API Hardening

```text
# Prompt 13.1 — Retry with exponential backoff
Add retry logic to Spotify API save operations.

Rules:
- Max 3 retries
- Exponential backoff
- Show retry status in UI
```

```text
# Prompt 13.2 — Failure handling
Handle Spotify API failures after retries exhausted.

Behavior:
- Show blocking error message
- Local state remains unchanged
- User can retry manually
```

### Chunk 14: Accessibility & Responsiveness

```text
# Prompt 14.1 — Accessibility improvements
Improve accessibility across the app.

Requirements:
- ARIA labels for buttons and inputs
- Keyboard navigation for modals
- Accessible drag-and-drop where feasible
```

```text
# Prompt 14.2 — Tablet & touch refinements
Improve responsiveness for tablet devices (iPad 11").

Requirements:
- Touch-friendly hit targets
- Momentum scrolling on timeline
- No regressions on desktop
```

### Chunk 15: Firestore Security Hardening

```text
# Prompt 15.1 — Strict Firestore security rules
Harden Firestore security rules to validate userId field in documents.

Current state:
- Permissive rules: Allow all authenticated users to read/write under their path
- No userId field validation in documents
- Works but not secure

Requirements:
- Validate that every document has userId field matching the path userId
- Revert to strict rules: allow read only if resource.data.userId == userId
- Add migration script to add userId field to existing documents
- Test that old documents are updated properly
- Verify Spotify user persistence still works with strict rules

Notes:
- Some existing documents may be missing userId field
- Migration may be needed before deploying strict rules
- Or delete test data and recreate with proper userId field
```