// Timeline canvas renderer module
import type { Split, SpotifyTrack } from '../models/types';

export interface TimelineData {
  splits: Split[];
  tracks?: SpotifyTrack[];
  totalTime: number;
  totalDistance: number;
  unit?: 'km' | 'mi';
}

interface CanvasConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  splitHeight: number;
  trackHeight: number;
  colors: {
    background: string;
    splitBorder: string;
    splitFill: string;
    trackBorder: string;
    trackFill: string;
    text: string;
    dragHighlight: string;
    insertionLine: string;
  };
}

export interface DragState {
  isDragging: boolean;
  draggedTrackIndex: number | null;
  insertionPoint: number | null;
  dragStartY: number;
  dragCurrentY: number;
}

export interface TrackRectangle {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  track: SpotifyTrack;
}

const DEFAULT_CONFIG: CanvasConfig = {
  width: 400,
  height: 600,
  margin: { top: 20, right: 40, bottom: 20, left: 60 },
  splitHeight: 80,
  trackHeight: 80,
  colors: {
    background: '#1e1e1e',
    splitBorder: '#444',
    splitFill: '#2a2a2a',
    trackBorder: '#1db954',
    trackFill: '#1aa34a',
    text: '#ffffff',
    dragHighlight: '#ff6b35',
    insertionLine: '#ff6b35',
  },
};

/**
 * Render timeline on HTML canvas
 */
export function renderTimeline(
  canvas: HTMLCanvasElement,
  data: TimelineData,
  config: Partial<CanvasConfig> = {}
): void {
  renderTimelineWithDragState(canvas, data, config, null);
}

/**
 * Render timeline with drag state support
 */
export function renderTimelineWithDragState(
  canvas: HTMLCanvasElement,
  data: TimelineData,
  config: Partial<CanvasConfig> = {},
  dragState: DragState | null = null
): TrackRectangle[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas 2D context');
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
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
  
  // Use dynamic height based on content, but respect custom config if provided
  const canvasHeight = config.height !== undefined ? finalConfig.height : Math.max(finalConfig.height, minHeightNeeded);
  
  // Set canvas size
  canvas.width = finalConfig.width;
  canvas.height = canvasHeight;

  // Clear canvas
  ctx.fillStyle = finalConfig.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate drawing area
  const drawArea = {
    x: finalConfig.margin.left,
    y: finalConfig.margin.top,
    width: finalConfig.width - finalConfig.margin.left - finalConfig.margin.right,
    height: canvasHeight - finalConfig.margin.top - finalConfig.margin.bottom,
  };

  // Draw timeline axis
  drawTimelineAxis(ctx, drawArea, data, finalConfig, totalDuration);

  // Draw race splits
  drawRaceSplits(ctx, drawArea, data, finalConfig, totalDuration);

  // Draw song tracks if available and return track rectangles
  let trackRectangles: TrackRectangle[] = [];
  if (data.tracks && data.tracks.length > 0) {
    trackRectangles = drawSongTracksWithDragState(ctx, drawArea, data, finalConfig, dragState, totalDuration);
  }

  // Draw insertion point if dragging
  if (dragState?.isDragging && dragState.insertionPoint !== null) {
    drawInsertionLine(ctx, drawArea, data, finalConfig, dragState.insertionPoint, totalDuration);
  }

  return trackRectangles;
}

/**
 * Draw the main timeline axis (vertical)
 */
function drawTimelineAxis(
  ctx: CanvasRenderingContext2D,
  drawArea: { x: number; y: number; width: number; height: number },
  data: TimelineData,
  config: CanvasConfig,
  totalDuration: number
): void {
  ctx.strokeStyle = config.colors.splitBorder;
  ctx.lineWidth = 2;

  // Main vertical timeline
  const timelineX = drawArea.x + 50; // Offset from left for time labels
  ctx.beginPath();
  ctx.moveTo(timelineX, drawArea.y);
  ctx.lineTo(timelineX, drawArea.y + drawArea.height);
  ctx.stroke();

  // Time markers going down
  ctx.fillStyle = config.colors.text;
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const timeIntervals = Math.ceil(totalDuration / 600); // Every 10 minutes
  for (let i = 0; i <= timeIntervals; i++) {
    const time = i * 600;
    if (time > totalDuration) break;

    const y = drawArea.y + (time / totalDuration) * drawArea.height;
    
    // Tick mark
    ctx.beginPath();
    ctx.moveTo(timelineX - 5, y);
    ctx.lineTo(timelineX + 5, y);
    ctx.stroke();

    // Time label (to the left of the axis)
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    ctx.fillText(label, timelineX - 10, y);
  }
}

/**
 * Draw race splits as rectangles (vertical layout)
 */
function drawRaceSplits(
  ctx: CanvasRenderingContext2D,
  drawArea: { x: number; y: number; width: number; height: number },
  data: TimelineData,
  config: CanvasConfig,
  totalDuration: number
): void {
  let currentTime = 0;
  const splitX = drawArea.x + 60; // Start after time axis and labels
  const splitWidth = 120; // Fixed width for split rectangles

  data.splits.forEach((split, _index) => {
    const splitHeight = (split.targetTime / totalDuration) * drawArea.height;
    const y = drawArea.y + (currentTime / totalDuration) * drawArea.height;

    // Draw split rectangle
    ctx.fillStyle = config.colors.splitFill;
    ctx.fillRect(splitX, y, splitWidth, splitHeight);

    ctx.strokeStyle = config.colors.splitBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(splitX, y, splitWidth, splitHeight);

    // Draw split label
    ctx.fillStyle = config.colors.text;
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = splitX + splitWidth / 2;
    const centerY = y + splitHeight / 2;
    
    // Only show labels if there's enough height
    if (splitHeight > 30) {
      // Split distance with correct unit
      const unit = data.unit || 'km';
      ctx.fillText(`${split.distance}${unit}`, centerX, centerY - 8);
      
      // Split time
      const minutes = Math.floor(split.targetTime / 60);
      const seconds = split.targetTime % 60;
      ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, centerX, centerY + 8);
    }

    currentTime += split.targetTime;
  });
}

/**
 * Draw song tracks as rectangles to the right of splits (vertical layout) with drag state support
 */
function drawSongTracksWithDragState(
  ctx: CanvasRenderingContext2D,
  drawArea: { x: number; y: number; width: number; height: number },
  data: TimelineData,
  config: CanvasConfig,
  dragState: DragState | null,
  totalDuration: number
): TrackRectangle[] {
  let currentTime = 0;
  const trackX = drawArea.x + 60 + 120 + 10; // Start after splits with some padding
  const trackWidth = 150; // Fixed width for track rectangles
  const trackRectangles: TrackRectangle[] = [];

  data.tracks!.forEach((track, index) => {
    const trackDurationSeconds = track.durationMs / 1000;
    const trackHeight = (trackDurationSeconds / totalDuration) * drawArea.height;
    let y = drawArea.y + (currentTime / totalDuration) * drawArea.height;

    // Don't draw tracks that extend beyond the timeline (they're now included)
    if (currentTime >= totalDuration) return;

    // Use full track height (don't clip overflow tracks)
    const adjustedHeight = trackHeight;

    // Apply drag offset if this track is being dragged
    if (dragState?.isDragging && dragState.draggedTrackIndex === index) {
      y += dragState.dragCurrentY - dragState.dragStartY;
    }

    // Store track rectangle for hit testing (using original position for hit testing)
    trackRectangles.push({
      index,
      x: trackX,
      y: drawArea.y + (currentTime / totalDuration) * drawArea.height,
      width: trackWidth,
      height: adjustedHeight,
      track
    });

    // Determine colors based on drag state
    let fillColor = config.colors.trackFill;
    let borderColor = config.colors.trackBorder;
    
    if (dragState?.isDragging && dragState.draggedTrackIndex === index) {
      fillColor = config.colors.dragHighlight;
      borderColor = config.colors.dragHighlight;
    }

    // Draw track rectangle
    ctx.fillStyle = fillColor;
    ctx.fillRect(trackX, y, trackWidth, adjustedHeight);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = dragState?.isDragging && dragState.draggedTrackIndex === index ? 2 : 1;
    ctx.strokeRect(trackX, y, trackWidth, adjustedHeight);

    // Draw track name
    if (adjustedHeight > 20) { // Only show text if there's enough space
      ctx.fillStyle = config.colors.text;
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      const maxTextWidth = trackWidth - 8; // Leave some padding
      let trackName = track.name;
      
      // Truncate text if it's too long
      const textWidth = ctx.measureText(trackName).width;
      if (textWidth > maxTextWidth) {
        while (ctx.measureText(trackName + '...').width > maxTextWidth && trackName.length > 0) {
          trackName = trackName.slice(0, -1);
        }
        trackName += '...';
      }

      // Draw track name at top of rectangle
      ctx.fillText(trackName, trackX + 4, y + 4);
      
      // Draw artist name if there's enough height
      if (adjustedHeight > 35) {
        ctx.font = '9px Arial';
        ctx.fillStyle = '#cccccc';
        let artistName = track.artist;
        
        // Truncate artist name if needed
        const artistWidth = ctx.measureText(artistName).width;
        if (artistWidth > maxTextWidth) {
          while (ctx.measureText(artistName + '...').width > maxTextWidth && artistName.length > 0) {
            artistName = artistName.slice(0, -1);
          }
          artistName += '...';
        }
        
        ctx.fillText(artistName, trackX + 4, y + 16);
      }
    }

    currentTime += trackDurationSeconds;
  });

  return trackRectangles;
}

/**
 * Draw insertion line to show where track will be inserted
 */
function drawInsertionLine(
  ctx: CanvasRenderingContext2D,
  drawArea: { x: number; y: number; width: number; height: number },
  data: TimelineData,
  config: CanvasConfig,
  insertionPoint: number,
  totalDuration: number
): void {
  let currentTime = 0;
  const trackX = drawArea.x + 60 + 120 + 10;
  const trackWidth = 150;

  // Find the Y position for the insertion point
  for (let i = 0; i < insertionPoint && i < data.tracks!.length; i++) {
    currentTime += data.tracks![i].durationMs / 1000;
  }

  const y = drawArea.y + (currentTime / totalDuration) * drawArea.height;

  // Draw insertion line
  ctx.strokeStyle = config.colors.insertionLine;
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(trackX - 5, y);
  ctx.lineTo(trackX + trackWidth + 5, y);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash
}

/**
 * Find track index at given Y coordinate
 */
export function findTrackAtPosition(
  trackRectangles: TrackRectangle[],
  x: number,
  y: number
): number | null {
  for (const rect of trackRectangles) {
    if (x >= rect.x && x <= rect.x + rect.width &&
        y >= rect.y && y <= rect.y + rect.height) {
      return rect.index;
    }
  }
  return null;
}

/**
 * Find insertion point for given Y coordinate
 */
export function findInsertionPoint(
  trackRectangles: TrackRectangle[],
  y: number
): number {
  if (trackRectangles.length === 0) return 0;

  // Find the track closest to the Y position
  for (let i = 0; i < trackRectangles.length; i++) {
    const rect = trackRectangles[i];
    const trackCenterY = rect.y + rect.height / 2;
    
    if (y < trackCenterY) {
      return i;
    }
  }
  
  // If Y is beyond all tracks, insert at the end
  return trackRectangles.length;
}

/**
 * Create drag state object
 */
export function createDragState(): DragState {
  return {
    isDragging: false,
    draggedTrackIndex: null,
    insertionPoint: null,
    dragStartY: 0,
    dragCurrentY: 0
  };
}



/**
 * Create mock data for testing
 */
export function createMockTimelineData(): TimelineData {
  const splits: Split[] = [
    { distance: 5, targetTime: 1500, pace: 5 }, // 25 minutes, 5 min/km
    { distance: 5, targetTime: 1440, pace: 4.8 }, // 24 minutes, 4.8 min/km
    { distance: 5, targetTime: 1380, pace: 4.6 }, // 23 minutes, 4.6 min/km
    { distance: 5, targetTime: 1320, pace: 4.4 }, // 22 minutes, 4.4 min/km
    { distance: 2.2, targetTime: 600, pace: 4.5 }, // 10 minutes, ~4.5 min/km
  ];

  const tracks: SpotifyTrack[] = [
    { id: '1', name: 'Eye of the Tiger', artist: 'Survivor', durationMs: 246000, uri: 'spotify:track:1' },
    { id: '2', name: 'Pump It Up', artist: 'Elvis Costello', durationMs: 198000, uri: 'spotify:track:2' },
    { id: '3', name: "Don't Stop Me Now", artist: 'Queen', durationMs: 219000, uri: 'spotify:track:3' },
    { id: '4', name: 'Thunderstruck', artist: 'AC/DC', durationMs: 292000, uri: 'spotify:track:4' },
    { id: '5', name: 'Lose Yourself', artist: 'Eminem', durationMs: 326000, uri: 'spotify:track:5' },
    { id: '6', name: 'We Will Rock You', artist: 'Queen', durationMs: 122000, uri: 'spotify:track:6' },
    { id: '7', name: 'Another One Bites the Dust', artist: 'Queen', durationMs: 215000, uri: 'spotify:track:7' },
    { id: '8', name: 'Born to Run', artist: 'Bruce Springsteen', durationMs: 270000, uri: 'spotify:track:8' },
    { id: '9', name: 'Push It', artist: 'Salt-N-Pepa', durationMs: 267000, uri: 'spotify:track:9' },
    { id: '10', name: 'Gonna Fly Now', artist: 'Bill Conti', durationMs: 177000, uri: 'spotify:track:10' },
    { id: '11', name: 'Hearts on Fire', artist: 'John Caffery', durationMs: 240000, uri: 'spotify:track:11' },
    { id: '12', name: 'Final Countdown', artist: 'Europe', durationMs: 312000, uri: 'spotify:track:12' },
  ];

  const totalTime = splits.reduce((sum, split) => sum + split.targetTime, 0);
  const totalDistance = splits.reduce((sum, split) => sum + split.distance, 0);

  return {
    splits,
    tracks,
    totalTime,
    totalDistance,
  };
}