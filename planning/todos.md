# Spotify Race Playlist Visualizer - Todo Checklist

This todo.md is a thorough checklist to guide your implementation of the Spotify Race Playlist Visualizer MVP workflow. Includes local development, external systems, and LLM prompt usage.

**UPDATED:** Project has been refactored to use React with Material-UI.

---

## Local Project Setup

* [x] [manual] Initialize git repository
  * [x] [manual] Run `git init` in project folder
  * [x] [manual] Add initial README.md
* [x] Install npm dependencies
  * [x] TypeScript
  * [x] ESLint + recommended plugins + React plugins
  * [x] Vitest + React Testing Library + jsdom
  * [x] React, ReactDOM, Material-UI, Emotion
  * [x] Vite with React plugin
* [x] Configure TypeScript
  * [x] Create `tsconfig.json` with ES Modules, strict mode, JSX support
* [x] Configure ESLint
  * [x] `.eslintrc.json` with recommended rules + React/React Hooks support
* [x] Configure Vitest
  * [x] `vitest.config.ts` with jsdom environment and React plugin
* [x] Setup folder structure
  * [x] `src/` with `managers/`, `components/`, `services/`, `models/`, `theme/`
  * [x] `tests/` with React component tests
  * [x] `index.html` (React root)
* [x] Create React components
  * [x] `App.tsx` - Main application wrapper with authentication
  * [x] `LoginScreen.tsx` - Material-UI login screen
  * [x] `MainApp.tsx` - Main application layout with AppBar
  * [x] `RaceSection.tsx` - Race management with Material-UI components
  * [x] `PacePlanSection.tsx` - Pace plan management with Material-UI components
  * [x] `ConfirmDialog.tsx` - Reusable confirmation dialog
  * [x] `spotifyTheme.ts` - Custom Material-UI theme with Spotify styling
* [x] Business logic modules (unchanged from vanilla version)
  * [x] `raceManager.ts`, `pacePlanManager.ts`, `firebaseService.ts`
  * [x] `models/types.ts`
  * [x] `timelineRenderer.ts` - implemented with drag-and-drop support, `undoRedoManager.ts` (pending)
  * [x] `playlistManager.ts` - Spotify OAuth, playlist fetching, and caching
* [x] Run LLM prompts for React refactor

---

## GitHub / CI/CD Setup

* [manual] Create GitHub repository
* [manual] Push initial commit
* Setup GitHub Actions workflow (`.github/workflows/main.yml`)

  * Lint with ESLint
  * Run Vitest tests
  * Deploy to Firebase Hosting (static frontend)
* [manual] Test workflow triggers and passes with empty files
* Run LLM prompt for GitHub Actions (Prompt 2.1)

---

## Firebase Setup

* [manual] Create Firebase project in console
* [manual] Enable Firestore database
* [manual] Enable Authentication

  * Spotify login (OAuth) or Email/Password fallback
* [manual] Generate Firebase config object
* [manual] Install Firebase SDK locally
* Implement initialization in `firebaseService.ts` (Prompt 3.1)
* Implement login flow and test (Prompt 3.2)
* Test Firestore read/write (Prompt 3.3)

---

## Data Models & CRUD Implementation

* [x] Define TypeScript interfaces in `models/types.ts` (Prompt 4.1)

  * [x] Race, PacePlan, Split
* [x] Implement `raceManager.ts` basic CRUD (Prompt 4.2)

  * [x] createRace, fetchRaces, deleteRace
  * [x] Include console logs for verification
  * [x] Add test file for raceManager functions
* [x] Implement `pacePlanManager.ts` basic CRUD (Prompt 4.3)

  * [x] createPacePlan, fetchPacePlans, deletePacePlan
  * [x] Include console logs for verification
  * [x] Add test file for pacePlanManager functions
  * [x] Test creating a pace plan linked to a race

---

## Spotify Integration

* [x] Setup Spotify OAuth login
* [x] Implement playlist fetch & cache (Prompt 5.1)
  * [x] OAuth login via Spotify with popup flow
  * [x] Fetch user playlists after login with pagination
  * [x] Cache playlists in memory for session
  * [x] Test displaying playlist names with PlaylistDisplay component
  * [x] Added Spotify login to LoginScreen component
  * [x] Created comprehensive test cases
* [x] Link pace plan to Spotify playlist (Prompt 5.2)
  * [x] Add playlist selection UI to pace plan creation
  * [x] Verify Firestore stores playlist ID
  * [x] Confirm linked playlist displays with pace plan

---

## Timeline & Canvas

* [x] Create HTML canvas element in page
* [x] Implement `timelineRenderer.ts` (Prompt 6.1)
  * [x] Draw linear timeline for splits
  * [x] Draw song rectangles (song name only)
  * [x] Test with mock data
  * [x] Create TimelineCanvas React component
  * [x] Integrate with main app layout
  * [x] Add comprehensive tests

---

## Drag-and-Drop Reordering

* [x] Implement drag-and-drop for song rectangles (Prompt 7.1)
  * [x] Enhanced timelineRenderer.ts with drag state support and visual feedback
  * [x] Added mouse and touch event handlers in TimelineCanvas component
  * [x] Implemented track rectangle hit testing and insertion point calculation
  * [x] Added fetchPlaylistTracks and reorderPlaylistTracks functions to playlistManager.ts
  * [x] Integrated automatic playlist track fetching when pace plan has linked Spotify playlist
  * [x] Added error handling and user notifications for failed operations
  * [x] Created comprehensive tests for drag-and-drop functionality
  * [x] [manual] Verified in-memory playlist order updates after drag
* [x] Implement save reordered playlist to Spotify (Prompt 7.2)
  * [x] Integrated Spotify API reordering with real-time updates
  * [x] Added error handling with user feedback for API failures
  * [x] [manual] Test playlist order updates correctly on Spotify

---

## Verification & Testing

* [manual] Run `npm run lint` → check no ESLint errors
* [manual] Run `npm test` → ensure all Vitest tests pass
* [manual] Test in browser:

  * Login works
  * Races & pace plans can be created
  * Playlist can be linked and reordered
  * Canvas displays timeline & songs
* [manual] Confirm CI/CD workflow triggers and passes on GitHub Actions

---

## Notes / External Steps Summary

* [manual] GitHub

  * Repo creation, push initial commit, configure Actions
* [manual] Firebase

  * Project setup, enable Firestore & Auth, obtain config
* [manual] Spotify

  * Create Spotify developer app for OAuth credentials
  * Configure redirect URIs for local testing
* LLM Prompts

  * Run prompts incrementally after completing each setup step
  * [manual] Verify outputs before moving to next prompt

---

**Tip:** Tick off each step as you go to ensure a safe incremental build of the MVP workflow. Once all Tier 1 tasks are complete, you can move to Tier 2 enhancements (splits editing, validation, elevation, tags, tooltips, undo/redo).

## Tier 2: Incremental Enhancements

### Split Editing & Validation
* [x] **Implement split editing UI (Prompt 8.1)**
  * [x] Display splits as editable table with distance (km), target time, computed pace
  * [x] Add split functionality with sensible defaults
  * [x] Delete split functionality (protected against deleting last split)
  * [x] Save/Cancel workflow for split modifications
  * [x] Real-time pace calculation as distance/time changes
  * [x] Support for MM:SS time input format and raw seconds
  * [x] Comprehensive test coverage in PacePlanSection.test.tsx
  * [x] Integration with updatePacePlanSplits function
* [ ] **Core split validation logic (Prompt 8.2)**
  * [ ] Implement validation rules (distance/time sums match race/pace plan)
  * [ ] Return structured validation results (errors vs warnings)
  * [ ] Minimum split distance validation (0.1 km)
  * [ ] Do not wire to UI yet
* [ ] **Merge & split helpers (Prompt 8.3)**
  * [ ] mergeSplits(indexA, indexB) function
  * [ ] splitSplit(index, strategy) function
  * [ ] Wire helpers to split editing UI
* [ ] **Enforce validation before save (Prompt 8.4)**
  * [ ] Inline color-coded feedback (red for errors, amber for warnings)
  * [ ] Disable save button when validation errors exist
  * [ ] Error messages near affected splits

### Elevation & Distance Visualization
* [ ] **Persist elevation data (Prompt 9.1)**
* [ ] **Render elevation on timeline (Prompt 9.2)**
* [ ] **Distance markers (Prompt 9.3)**

### Undo/Redo System
* [ ] **Undo/redo manager (Prompt 10.1)**
* [ ] **Undo/redo for split editing (Prompt 10.2)**
* [ ] **Undo/redo for playlist reordering (Prompt 10.3)**

### Additional Enhancements
* [ ] **Unified tooltip system (Prompt 11.1)**
* [ ] **Song metadata tooltips (Prompt 11.2)**
* [ ] **Playlist overflow indicators (Prompt 11.3)**
* [ ] **Tags for races and pace plans (Prompt 12.1)**
* [ ] **Tag filtering (Prompt 12.2)**
* [ ] **Spotify API hardening (Prompts 13.1-13.2)**
* [ ] **Accessibility & responsiveness (Prompts 14.1-14.2)**
* [ ] **Firestore security hardening (Prompt 15.1)**
