# Spotify Race Playlist Visualizer - Todo Checklist

This todo.md is a thorough checklist to guide your implementation of the Spotify Race Playlist Visualizer MVP workflow. Includes local development, external systems, and LLM prompt usage.

---

## Local Project Setup

* [manual] Initialize git repository

  * [manual] Run `git init` in project folder
  * [manual] Add initial README.md
* Install npm dependencies

  * TypeScript
  * ESLint + recommended plugins
  * Vitest
* Configure TypeScript

  * Create `tsconfig.json` with ES Modules, strict mode
* Configure ESLint

  * `.eslintrc.json` with recommended rules
* Configure Vitest

  * `vitest.config.ts`
* Setup folder structure

  * `src/` with `managers/`, `ui/`, `services/`, `models/`
  * `tests/`
  * `index.html` and `styles.css`
* Create empty module files

  * `raceManager.ts`, `pacePlanManager.ts`, `playlistManager.ts`, `firebaseService.ts`, `timelineRenderer.ts`, `ui.ts`, `undoRedoManager.ts`
  * `models/types.ts`
* Run LLM prompts for initial project setup (Prompt 1.1 - 1.3)

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
* [ ] Implement `pacePlanManager.ts` basic CRUD (Prompt 4.3)

  * [ ] createPacePlan, fetchPacePlans
  * [ ] [manual] Test creating a pace plan linked to a race

---

## Spotify Integration

* [manual] Setup Spotify OAuth login
* Implement playlist fetch & cache (Prompt 5.1)

  * [manual] Test displaying playlist names
* Link pace plan to Spotify playlist (Prompt 5.2)

  * [manual] Verify Firestore stores playlist ID
  * [manual] Confirm linked playlist displays with pace plan

---

## Timeline & Canvas

* [manual] Create HTML canvas element in page
* Implement `timelineRenderer.ts` (Prompt 6.1)

  * [manual] Draw linear timeline for splits
  * [manual] Draw song rectangles (song name only)
  * [manual] Test with mock data

---

## Drag-and-Drop Reordering

* Implement drag-and-drop for song rectangles (Prompt 7.1)

  * [manual] Verify in-memory playlist order updates after drag
* Implement save reordered playlist to Spotify (Prompt 7.2)

  * [manual] Test playlist order updates correctly on Spotify

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
