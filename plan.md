# Plan: React + MUI Refactor for Spotify Pace Planner

Migrate the vanilla TypeScript UI to React with Material-UI components, preserving the Spotify green color scheme and existing application logic. The backend services, Firebase integration, and business logic remain unchanged—only the presentation layer transforms.

## Steps

1. **Setup React + MUI dependencies** – Update `package.json` with React, ReactDOM, MUI core/icons, and emotion (MUI's CSS-in-JS), then update `vite.config.ts` for React JSX support.

2. **Create Spotify-themed MUI theme** – Build a custom theme file with Spotify green (`#1db954`) as primary color, dark backgrounds, and override MUI components to match current styling.

3. **Convert entry point to React** – Replace `index.html` root div with React root, update `src/index.ts` to use `ReactDOM.createRoot()`, and wrap the app with theme provider.

4. **Build React login screen component** – Convert vanilla login HTML/event handlers to a React component using MUI Button, Box, and Typography; integrate with existing `userService` and `firebaseService`.

5. **Build main app layout component** – Create a responsive layout using MUI AppBar, Container, and Grid; refactor race and pace plan sections into reusable components with CRUD handlers.

6. **Refactor race & pace plan cards** – Convert `src/ui/ui.ts` list rendering to React components using MUI Card, TextField, Select; attach handlers via React callbacks instead of manual event listeners.

7. **Replace alerts/confirms with MUI dialogs** – Convert `alert()` and `confimrm()` calls to MUI Dialog and Snackbar components for loading feedback and confirmations.

8. **Migrate styles** – Convert `styles.css` values to MUI theme config and remove unnecessary CSS file; use MUI `sx` prop for component-specific styling.

9. **Update tests for React components** – Refactor `tests/` to use React Testing Library instead of vanilla DOM testing; verify Firebase integration tests still pass.

10. **Update TypeScript config and linting** – Ensure `tsconfig.json` and ESLint rules support React/JSX syntax.

## Further Considerations

1. **State management approach** – Keep current `userService` observable pattern, or migrate to React Context API? Both work; recommend Context API for simpler integration with React components.

2. **Timeline canvas component** – The stubbed `src/ui/timelineRenderer.ts` remains a canvas-based module outside React; wrap it in a React component when implementing, or refactor to use a charting library (Recharts, Visx) later.

3. **Incremental vs. big-bang refactor** – Refactor all UI at once (faster, cleaner), or one screen at a time (lower risk, testable increments)? Recommend all at once given current small scope.
