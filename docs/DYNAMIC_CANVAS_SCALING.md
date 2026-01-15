# Dynamic Canvas Scaling Implementation

## Overview
Implemented dynamic canvas height scaling to ensure all tracks in a Spotify playlist are fully visible on the timeline, even when the playlist exceeds the race duration.

## Problem Solved
- Canvas had a fixed height of 600px, which clipped track names and visibility
- Some tracks weren't fully rendered when playlists were longer than race duration
- Container had `minHeight: 620px` preventing proper scroll behavior

## Solution

### 1. Dynamic Height Calculation (timelineRenderer.ts)
The `renderTimelineWithDragState()` function now:

```typescript
// Calculate total duration including all tracks
let totalDuration = data.totalTime;
if (data.tracks && data.tracks.length > 0) {
  const playlistDuration = data.tracks.reduce((sum, track) => sum + (track.durationMs / 1000), 0);
  totalDuration = Math.max(totalDuration, playlistDuration);
}

// Calculate minimum height needed: minimum 30px per track for visibility, plus margins
const minTrackHeight = data.tracks ? Math.max(30, finalConfig.trackHeight) : 0;
const minHeightForTracks = (data.tracks?.length || 0) * minTrackHeight;
const minHeightNeeded = finalConfig.margin.top + finalConfig.margin.bottom + minHeightForTracks + 200;

// Use dynamic height based on content
const calculatedHeight = Math.max(finalConfig.height, minHeightNeeded);
finalConfig.height = calculatedHeight;
```

**Key Logic:**
- Uses `Math.max()` to pick the larger of race duration or playlist duration
- Ensures minimum 30px per track for text visibility
- Includes margins and padding (200px buffer for margins and UI elements)

### 2. Removed Clipping of Overflow Tracks
Previously, tracks extending beyond race duration were clipped. Now:

```typescript
// Don't draw tracks that extend beyond the timeline (they're now included)
if (currentTime >= totalDuration) return;

// Use full track height (don't clip overflow tracks)
const adjustedHeight = trackHeight;
```

The comment change indicates overflow tracks are now fully rendered.

### 3. Updated Scaling Calculations
All time-to-pixel conversions now use the calculated `totalDuration`:

**Before:**
```typescript
const trackHeight = (trackDurationSeconds / data.totalTime) * drawArea.height;
const y = drawArea.y + (currentTime / data.totalTime) * drawArea.height;
```

**After:**
```typescript
const trackHeight = (trackDurationSeconds / totalDuration) * drawArea.height;
const y = drawArea.y + (currentTime / totalDuration) * drawArea.height;
```

This ensures proper proportional scaling across the entire canvas.

### 4. Container Styling Updates (TimelineCanvas.tsx)
Changed canvas container styling:

**Before:**
```tsx
<Box sx={{ 
  alignItems: 'center',
  ...
}}>
  <canvas style={{
    maxHeight: '600px',  // STATIC CONSTRAINT
    ...
  }}/>
</Box>
```

**After:**
```tsx
<Box sx={{ 
  alignItems: 'flex-start',  // Align top instead of center
  ...
}}>
  <canvas style={{
    maxWidth: '100%',  // Removed maxHeight constraint
    ...
  }}/>
</Box>
```

## Impact on Track Visibility

### Text Rendering Logic
Tracks display text based on available height:

- **> 20px height**: Track name displayed
- **> 35px height**: Artist name also displayed
- **< 20px height**: No text (too small to be readable)

Dynamic height ensures:
- Short tracks (< 2 minutes) still get 30px minimum (if many tracks)
- Long tracks (> 10 minutes) get proportionally more space
- All 63+ tracks in a full playlist are accessible via scrolling

## Configuration Parameters

From `DEFAULT_CONFIG`:
- `margin.top`: 20px
- `margin.bottom`: 20px
- `margin.left`: 60px
- `margin.right`: 40px
- `trackHeight`: Default track height (used for minimum calculation)
- `minHeightBuffer`: 200px (ensures sufficient space for labels and margins)

## Testing Considerations

When testing with playlists:
1. Test with playlists shorter than race (should use race duration)
2. Test with playlists longer than race (should extend canvas)
3. Test with 63+ track playlists (should display all with scroll)
4. Test track name visibility at different zoom levels
5. Test drag-and-drop with extended canvas

## Performance Notes

- Height calculation is O(n) where n is number of tracks (one reduce operation)
- Canvas resize is handled by browser efficiently
- No impact on drag-and-drop performance
- Scrolling is handled by browser (minHeight removed allows native scroll)
