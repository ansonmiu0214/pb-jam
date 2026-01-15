# Drag-and-Drop Timeline Reordering Implementation

## Overview

This document describes the implementation of drag-and-drop functionality for Spotify track reordering in the timeline canvas. Users can now click and drag song rectangles to reorder tracks in their linked playlist, with changes saved back to Spotify.

## Technical Implementation

### Core Components

#### 1. Timeline Renderer Enhancements (`src/ui/timelineRenderer.ts`)

**New Interfaces:**
- `DragState`: Tracks current drag operation state
- `TrackRectangle`: Defines hit testing areas for tracks

**New Functions:**
- `renderTimelineWithDragState()`: Enhanced rendering with drag state support
- `createDragState()`: Creates initial drag state object
- `findTrackAtPosition()`: Hit testing to find track under cursor/finger
- `findInsertionPoint()`: Determines where to insert dragged track
- `drawInsertionLine()`: Visual feedback for drop target

**Visual Feedback:**
- Orange highlighting for dragged track
- Dashed insertion line showing drop position
- Real-time updates during drag operation

#### 2. Interactive Timeline Canvas (`src/components/TimelineCanvas.tsx`)

**Enhanced Features:**
- Mouse and touch event handlers
- Real-time playlist track fetching via `fetchPlaylistTracks()`
- Automatic Spotify playlist reordering via `reorderPlaylistTracks()`
- Error handling with user notifications
- Loading states and feedback

**Event Handlers:**
- `handleMouseDown/handleTouchStart`: Initiate drag operation
- `handleMouseMove/handleTouchMove`: Update drag position and visual feedback
- `handleMouseUp/handleTouchEnd`: Complete drag and save changes

#### 3. Playlist Manager API (`src/services/playlistManager.ts`)

**New Functions:**
- `fetchPlaylistTracks(playlistId)`: Retrieves tracks from Spotify playlist with pagination
- `reorderPlaylistTracks(playlistId, fromIndex, toIndex)`: Updates track order in Spotify

## User Experience

### Workflow
1. User creates a pace plan and links it to a Spotify playlist
2. Timeline automatically fetches and displays playlist tracks as green rectangles
3. User clicks/touches a track rectangle to start dragging
4. Visual feedback shows dragged track in orange and insertion point with dashed line
5. User releases to drop track at new position
6. Changes are immediately saved to Spotify playlist
7. Error notifications appear if save fails

### Features
- **Visual Feedback**: Highlighted tracks and insertion indicators
- **Cross-Platform**: Works on desktop (mouse) and mobile (touch)
- **Error Handling**: User notifications for failed operations
- **Loading States**: Progress indicators during track fetching
- **Real-time Updates**: Immediate visual updates with background saving

## Error Handling

### Common Scenarios
- **Network Issues**: Retry prompts and error messages
- **Authentication Failures**: Redirects to login
- **Playlist Permissions**: Clear error messaging
- **API Rate Limits**: Graceful degradation

### User Feedback
- Snackbar notifications for errors
- Loading spinners during operations
- Success/failure visual indicators

## Testing

### Test Coverage
- **Unit Tests**: `tests/timelineRenderer.dragdrop.test.ts`
  - Hit testing algorithms
  - Insertion point calculation
  - Drag state management
- **Integration Tests**: Playlist manager functions
  - Authentication requirements
  - API error handling

### Test Scenarios
- Track positioning and hit detection
- Insertion point calculation at different positions
- Drag state creation and management
- Error handling for unauthenticated requests

## Performance Considerations

### Optimizations
- **Efficient Rendering**: Only re-render affected areas during drag
- **Debounced Updates**: Prevent excessive API calls
- **Caching**: Track rectangles cached for hit testing
- **Progressive Loading**: Pagination for large playlists

### Resource Management
- Memory-efficient track rectangle storage
- Canvas context reuse
- Event listener cleanup

## Future Enhancements

### Potential Improvements
- **Undo/Redo**: Track operation history
- **Multi-Select**: Drag multiple tracks at once
- **Keyboard Navigation**: Accessibility improvements
- **Batch Operations**: Optimize multiple track moves
- **Conflict Resolution**: Handle concurrent playlist edits

### Performance Optimizations
- **Virtual Scrolling**: For very large playlists
- **WebGL Rendering**: Hardware-accelerated graphics
- **Service Worker Caching**: Offline playlist management

## Related Documentation
- [Spotify Authentication](SPOTIFY_AUTHENTICATION.md)
- [Timeline Integration](TIMELINE_INTEGRATION.md)
- [Architecture Overview](ARCHITECTURE.md)