# Spotify Race Playlist Visualizer - Developer Specification

## Overview

A **single-page web application** (frontend-only) that allows users to visualize Spotify playlists alongside running race pace plans. Users can adjust song order to match their race splits and save the playlist back to Spotify.

* **Frontend only:** Vanilla HTML/CSS/JavaScript (ES Modules)
* **TypeScript** for type safety
* **Linting:** ESLint
* **Testing:** Vitest
* **No build step required**
* **Responsive design:** desktop-first, works on iPad 11-inch
* **Accessibility:** hover/touch tooltips, color-coded feedback
* **CI/CD:** GitHub Actions
* **Data persistence:** Firebase (Firestore)

## Features

### Races

* Multiple races per user.
* Each race has: title, distance, unit (km/miles), optional tags, createdAt/updatedAt timestamps.
* Default sort: chronological (creation order).
* Delete: confirmation prompt; cascading delete removes all linked pace plans.

### Pace Plans

* Each race can have one or more pace plans.
* Default pace plan created when race is created (single split, target time).
* Splits:

  * Distance (minimum 0.1 km)
  * Target time (seconds precision)
  * Computed pace (min/km)
  * Elevation (integer meters, can be negative)
* Split operations: merge and split with optional auto-correct suggestions.
* Validation: splits must sum to race distance and total time; color-coded feedback; user must fix before saving.
* Pace plan linked to a single Spotify playlist.

### Spotify Playlist Integration

* User logs in via Spotify (used optionally for Firebase auth).
* Playlist fetched once per session and cached in memory.
* Drag-and-drop songs to reorder.
* Undo/redo tracks song drag, split edits, merge/split if feasible.
* Visual cues:

  * Song rectangles show title (wrapped text)
  * Tooltip on hover/tap shows artist
  * Insertion line when dragging
  * Red border for songs extending beyond race time
  * Optional color border for duplicates
* Save playlist: batch update to Spotify, retries with exponential backoff; show retry notice and blocking error if all fail.

### Timeline / Canvas

* Single canvas rendering splits, elevation, distance markers, song rectangles.
* Timeline scrollable, momentum scrolling on touch devices if simple.
* Distance markers per km.
* Elevation: linear color scale (red uphill, green downhill, gray flat).
* Tooltips follow pointer/finger, disappear on tap elsewhere (mobile).
* Timeline shows song duration beyond race time; songs exceeding race time marked with red border.

### UI / Interaction

* Desktop-first, responsive for tablet.
* Mouse/touch interactions supported.
* Drag-and-drop for songs only; splits are fixed positions.
* Undo/redo stack resets on page reload or after saving playlist.
* Minimal visual feedback, inline color coding for validation errors.
* Units toggle per race (km/miles), pace display always min/km.
* Tooltips, visual cues, and scroll behavior consistent across devices.

## Architecture & Modules

* **ES Modules** for separation:

  * `raceManager.ts` – CRUD operations for races
  * `pacePlanManager.ts` – CRUD and validation for pace plans
  * `playlistManager.ts` – Spotify API integration, caching, save
  * `timelineRenderer.ts` – canvas drawing of splits, songs, elevation
  * `ui.ts` – modal handling, tooltips, drag/drop
  * `undoRedoManager.ts` – undo/redo stack
  * `firebaseService.ts` – persistence

## Data Model (Firebase)

```json
Race {
  id: string,
  title: string,
  distance: number,
  unit: "km" | "miles",
  tags: string[],
  createdAt?: timestamp,
  updatedAt?: timestamp,
  pacePlans: { [id: string]: PacePlan }
}

PacePlan {
  id: string,
  title: string,
  targetTime: number, // seconds
  splits: Split[],
  spotifyPlaylistId: string,
  tags: string[],
  createdAt?: timestamp,
  updatedAt?: timestamp
}

Split {
  distance: number, // km
  targetTime: number, // seconds
  pace: number, // min/km
  elevation: number // meters
}
```

## Error Handling

* Soft warnings (validation): block save, color-coded inline feedback, optional auto-correct.
* Spotify API errors: retry 3 times with exponential backoff, show notice to user, then blocking error if all fail.
* Firebase errors: blocking notification, allow retry.
* Fatal errors: stop action and show message.

## Testing Plan

* **Unit tests:** Vitest for core logic (split calculations, pace calculations, undo/redo, caching).
* **UI tests:** basic interactive tests for drag-and-drop, tooltips, canvas rendering.
* **Edge cases:** split min/max distance, negative elevation, playlist overflow, duplicates.
* **Error handling:** test Spotify API retry logic, validation enforcement.

## Security & Privacy

* User-level visibility: each user only sees their races and pace plans.
* Authentication via Spotify login if possible; fallback to app login.
* No local storage of sensitive Spotify tokens unless short-term session caching.
* HTTPS required for all API calls.

## CI/CD

* GitHub Actions for linting (ESLint), testing (Vitest), and deployment.
* Deployment is static hosting (e.g., Firebase Hosting) since frontend-only.

---

**End of specification. Ready for implementation.**
