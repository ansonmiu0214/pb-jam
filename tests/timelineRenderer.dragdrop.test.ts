import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderTimelineWithDragState,
  createDragState,
  findTrackAtPosition,
  findInsertionPoint,
  createMockTimelineData,
  type TrackRectangle
} from '../src/ui/timelineRenderer';
import type { SpotifyTrack } from '../src/models/types';

// Mock canvas context
const createMockCanvas = () => {
  const mockContext = {
    getContext: () => mockContext,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    width: 400,
    height: 600,
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    measureText: () => ({ width: 50 }),
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    setLineDash: () => {},
  };
  return mockContext as unknown as HTMLCanvasElement;
};

describe('Timeline Renderer Drag and Drop', () => {
  let canvas: HTMLCanvasElement;
  let timelineData: ReturnType<typeof createMockTimelineData>;

  beforeEach(() => {
    canvas = createMockCanvas();
    timelineData = createMockTimelineData();
  });

  describe('createDragState', () => {
    it('should create initial drag state', () => {
      const dragState = createDragState();
      
      expect(dragState.isDragging).toBe(false);
      expect(dragState.draggedTrackIndex).toBeNull();
      expect(dragState.insertionPoint).toBeNull();
      expect(dragState.dragStartY).toBe(0);
      expect(dragState.dragCurrentY).toBe(0);
    });
  });

  describe('findTrackAtPosition', () => {
    it('should find track at valid position', () => {
      // Simulate a track rectangle
      const mockRectangles: TrackRectangle[] = [
        {
          index: 0,
          x: 250,
          y: 50,
          width: 150,
          height: 40,
          track: {
            id: '1',
            name: 'Test Track',
            artist: 'Test Artist',
            durationMs: 200000,
            uri: 'spotify:track:1'
          }
        }
      ];

      // Position within track
      const trackIndex = findTrackAtPosition(mockRectangles, 300, 70);
      expect(trackIndex).toBe(0);
    });

    it('should return null for position outside tracks', () => {
      const mockRectangles: TrackRectangle[] = [
        {
          index: 0,
          x: 250,
          y: 50,
          width: 150,
          height: 40,
          track: {
            id: '1',
            name: 'Test Track',
            artist: 'Test Artist',
            durationMs: 200000,
            uri: 'spotify:track:1'
          }
        }
      ];

      // Position outside track
      const trackIndex = findTrackAtPosition(mockRectangles, 100, 70);
      expect(trackIndex).toBeNull();
    });

    it('should handle empty rectangles array', () => {
      const trackIndex = findTrackAtPosition([], 300, 70);
      expect(trackIndex).toBeNull();
    });
  });

  describe('findInsertionPoint', () => {
    it('should find insertion point at beginning', () => {
      const mockRectangles: TrackRectangle[] = [
        { index: 0, x: 250, y: 50, width: 150, height: 40, track: {} as SpotifyTrack },
        { index: 1, x: 250, y: 100, width: 150, height: 40, track: {} as SpotifyTrack },
      ];

      const insertionPoint = findInsertionPoint(mockRectangles, 30);
      expect(insertionPoint).toBe(0);
    });

    it('should find insertion point in middle', () => {
      const mockRectangles: TrackRectangle[] = [
        { index: 0, x: 250, y: 50, width: 150, height: 40, track: {} as SpotifyTrack },
        { index: 1, x: 250, y: 100, width: 150, height: 40, track: {} as SpotifyTrack },
      ];

      const insertionPoint = findInsertionPoint(mockRectangles, 80);
      expect(insertionPoint).toBe(1);
    });

    it('should find insertion point at end', () => {
      const mockRectangles: TrackRectangle[] = [
        { index: 0, x: 250, y: 50, width: 150, height: 40, track: {} as SpotifyTrack },
        { index: 1, x: 250, y: 100, width: 150, height: 40, track: {} as SpotifyTrack },
      ];

      const insertionPoint = findInsertionPoint(mockRectangles, 200);
      expect(insertionPoint).toBe(2);
    });

    it('should handle empty rectangles array', () => {
      const insertionPoint = findInsertionPoint([], 100);
      expect(insertionPoint).toBe(0);
    });
  });

  describe('renderTimelineWithDragState', () => {
    it('should render without drag state', () => {
      const rectangles = renderTimelineWithDragState(canvas, timelineData);
      
      expect(Array.isArray(rectangles)).toBe(true);
      expect(rectangles.length).toBeGreaterThan(0);
    });

    it('should render with drag state', () => {
      const dragState = createDragState();
      dragState.isDragging = true;
      dragState.draggedTrackIndex = 0;
      dragState.insertionPoint = 1;

      const rectangles = renderTimelineWithDragState(canvas, timelineData, {}, dragState);
      
      expect(Array.isArray(rectangles)).toBe(true);
      expect(rectangles.length).toBeGreaterThan(0);
    });

    it('should handle timeline data without tracks', () => {
      const noTracksData = {
        ...timelineData,
        tracks: []
      };

      const rectangles = renderTimelineWithDragState(canvas, noTracksData);
      expect(rectangles).toEqual([]);
    });
  });
});