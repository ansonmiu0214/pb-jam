# Timeline Canvas Integration - Feature Overview

## Summary

The TimelineCanvas component has been integrated with the PacePlanSection to display the selected pace plan's race splits in a vertical timeline visualization. When a user selects a pace plan from the list, the canvas automatically renders the race data with proper timing and distance calculations.

## Key Features

### 1. **Real-time Pace Plan Selection**
- Users click on a pace plan card to select it
- Visual feedback: card highlights with hover effect (scale + shadow)
- Selected pace plan data is passed to the canvas component

### 2. **Vertical Timeline Layout**
- Time flows from top to bottom (more intuitive for longer races)
- Time axis on the left with 10-minute interval markers
- Race splits displayed as gray rectangles with proportional heights based on target time
- Split labels show: distance (km) and target time (MM:SS format)

### 3. **Canvas Dimensions**
- Canvas: 400px wide × 600px tall
- Optimized for typical race duration (30-120 minutes)
- Responsive container with auto-scroll for larger timelines

### 4. **Data Flow**

```
PacePlanSection (user selects pace plan)
    ↓
    onPacePlanSelect callback → MainApp
    ↓
MainApp stores selectedPacePlan state
    ↓
TimelineCanvas renders with pacePlan & tracks props
    ↓
renderTimeline() converts data to canvas visualization
```

## Component Integration

### MainApp.tsx
- Maintains `selectedPacePlan` state
- Maintains `selectedTracks` state (prepared for future playlist integration)
- Passes both to TimelineCanvas component

### PacePlanSection.tsx
- Added `onPacePlanSelect` callback prop
- Added `onTracksLoad` callback prop
- Pace plan cards now clickable with hover effects
- `handleSelectPacePlan()` function executes selection logic

### TimelineCanvas.tsx
- Accepts `pacePlan` and `tracks` props
- Falls back to demo data if no pace plan selected
- Toggle button to show/hide demo data for testing

### timelineRenderer.ts
- `renderTimeline()` function handles vertical layout
- Converts split data to proportional canvas rectangles
- Time labels calculated from cumulative time values
- Optional track visualization (prepared for Spotify tracks)

## User Workflow

1. User creates a race with distance and basic info
2. User creates pace plan with target time and distance splits
3. **NEW:** User clicks on pace plan card to select it
4. **NEW:** Timeline canvas displays below, showing the selected pace plan
5. (Future) User can link a Spotify playlist to the pace plan
6. (Future) User can drag tracks to reorder them by race segments

## Future Enhancements

### Playlist Integration
- Fetch tracks from linked Spotify playlist
- Display green track rectangles aligned with race timeline
- Show track duration proportional to canvas height

### Drag-and-Drop (Prompt 7.1)
- Enable dragging track rectangles
- Visual feedback: highlight insertion point
- Update in-memory playlist order

### Save to Spotify (Prompt 7.2)
- Send reordered tracks to Spotify API
- Validate playlist update success
- Provide user feedback

## Technical Details

### Timeline Data Structure
```typescript
interface TimelineData {
  splits: Split[];           // Race splits with time and distance
  tracks?: SpotifyTrack[];   // Optional Spotify tracks
  totalTime: number;         // Total race time in seconds
  totalDistance: number;     // Total race distance in km
}
```

### Canvas Config
- Width: 400px
- Height: 600px
- Margins: top 20px, right 40px, bottom 20px, left 60px
- Colors: Spotify theme (green #1db954 for tracks, gray #2a2a2a for splits)

### Time Calculations
- Each pixel height represents: `(time_in_seconds / total_race_time) * available_height`
- 10-minute interval markers on the axis
- Time labels formatted as MM:SS or HH:MM:SS

## Testing

Mock data is available via `createMockTimelineData()` function for testing:
- 22.2 km race (5 splits + finish)
- 78 minutes total time
- 12 example Spotify tracks
- Toggle "Show Demo" button in UI to test without selecting a pace plan

## Dependencies

- React 18+ for component lifecycle
- TypeScript for type safety
- HTML5 Canvas API for rendering
- Material-UI for layout and theming

---

**Last Updated:** Implementation complete for Prompt 6.1
**Next Steps:** Implement drag-and-drop for Prompt 7.1
