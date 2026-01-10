# Spotify Race Playlist Visualizer - LLM Prompt Plan

This file contains a series of LLM prompts for generating code incrementally.
**Goal:** minimal end-to-end workflow: CI/CD → Spotify login → create race/pace plan → link playlist → reorder tracks.
**After Tier 1 is working**, incremental enhancements (validation, split editing, elevation, tags, tooltips) can be added in Tier 2.

---

## Tier 1: Minimal End-to-End Workflow

### Chunk 1: Project Setup

```text
# Prompt 1.1: Initialize project repository
Generate a new git repository for a TypeScript frontend web app called "Spotify Race Playlist Visualizer". Include a README.md with the project title and short description. Ensure ES Modules compatibility. No code yet. Confirm repository is ready for adding source files.
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
# Prompt 5.1: Connect to Spotify API
Implement Spotify authentication:
- OAuth login via Spotify
- Fetch user playlists after login
- Cache playlists in memory for session
Test fetching playlists and confirm display of playlist names.
```

```text
# Prompt 5.2: Link pace plan to playlist
Add ability to select a Spotify playlist when creating a pace plan.
Store Spotify playlist ID in Firestore alongside pace plan.
Test that pace plan shows linked playlist.
```

### Chunk 6: Timeline Canvas Renderer (basic)

```text
# Prompt 6.1: Draw race splits on canvas
In timelineRenderer.ts:
- Create HTML canvas
- Draw linear timeline representing race splits
- Draw song rectangles with song name (text only)
- No advanced features yet (no elevation or color-coding)
Verify canvas renders correctly with mock data.
```

### Chunk 7: Drag-and-Drop Reordering

```text
# Prompt 7.1: Implement drag-and-drop for songs
Enable user to drag song rectangles and reorder.
Update in-memory playlist order after drag ends.
Provide visual feedback: highlight insertion point.
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

```

---

This file now fully encapsulates **all Tier 1 prompts** and provides the Tier 2 outline.

```
