import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderTimeline, createMockTimelineData } from '../src/ui/timelineRenderer';

// Mock HTML canvas
class MockCanvasRenderingContext2D {
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 0;
  font = '';
  textAlign = '';

  fillRect = vi.fn();
  strokeRect = vi.fn();
  fillText = vi.fn();
  measureText = vi.fn().mockReturnValue({ width: 50 });
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
}

class MockHTMLCanvasElement {
  width = 0;
  height = 0;
  
  getContext = vi.fn().mockReturnValue(new MockCanvasRenderingContext2D());
}

// Mock the global HTMLCanvasElement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.HTMLCanvasElement = MockHTMLCanvasElement as any;

describe('Timeline Renderer', () => {
  let mockCanvas: MockHTMLCanvasElement;
  let mockContext: MockCanvasRenderingContext2D;

  beforeEach(() => {
    mockCanvas = new MockHTMLCanvasElement();
    mockContext = mockCanvas.getContext('2d') as MockCanvasRenderingContext2D;
  });

  describe('createMockTimelineData', () => {
    it('should create valid mock data with splits and tracks', () => {
      const mockData = createMockTimelineData();

      expect(mockData.splits).toBeDefined();
      expect(mockData.tracks).toBeDefined();
      expect(mockData.totalTime).toBeGreaterThan(0);
      expect(mockData.totalDistance).toBeGreaterThan(0);
      expect(mockData.splits.length).toBeGreaterThan(0);
      expect(mockData.tracks!.length).toBeGreaterThan(0);
    });

    it('should have valid split data structure', () => {
      const mockData = createMockTimelineData();
      
      mockData.splits.forEach(split => {
        expect(split.distance).toBeGreaterThan(0);
        expect(split.targetTime).toBeGreaterThan(0);
        expect(split.pace).toBeGreaterThan(0);
      });
    });

    it('should have valid track data structure', () => {
      const mockData = createMockTimelineData();
      
      mockData.tracks!.forEach(track => {
        expect(track.id).toBeDefined();
        expect(track.name).toBeDefined();
        expect(track.artist).toBeDefined();
        expect(track.durationMs).toBeGreaterThan(0);
        expect(track.uri).toContain('spotify:track:');
      });
    });

    it('should calculate correct totals', () => {
      const mockData = createMockTimelineData();
      
      const calculatedTime = mockData.splits.reduce((sum, split) => sum + split.targetTime, 0);
      const calculatedDistance = mockData.splits.reduce((sum, split) => sum + split.distance, 0);
      
      expect(mockData.totalTime).toBe(calculatedTime);
      expect(mockData.totalDistance).toBe(calculatedDistance);
    });
  });

  describe('renderTimeline', () => {
    it('should render without errors', () => {
      const mockData = createMockTimelineData();
      
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderTimeline(mockCanvas as any, mockData);
      }).not.toThrow();
    });

    it('should set canvas dimensions', () => {
      const mockData = createMockTimelineData();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderTimeline(mockCanvas as any, mockData);
      
      expect(mockCanvas.width).toBeGreaterThan(0);
      expect(mockCanvas.height).toBeGreaterThan(0);
    });

    it('should call canvas drawing methods', () => {
      const mockData = createMockTimelineData();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderTimeline(mockCanvas as any, mockData);
      
      // Should clear canvas (fill background)
      expect(mockContext.fillRect).toHaveBeenCalled();
      
      // Should draw text for labels
      expect(mockContext.fillText).toHaveBeenCalled();
      
      // Should draw timeline axis
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalled();
      expect(mockContext.lineTo).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle empty splits gracefully', () => {
      const emptyData = {
        splits: [],
        tracks: [],
        totalTime: 0,
        totalDistance: 0,
      };
      
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderTimeline(mockCanvas as any, emptyData);
      }).not.toThrow();
    });

    it('should handle data without tracks', () => {
      const mockData = createMockTimelineData();
      const dataWithoutTracks = {
        ...mockData,
        tracks: undefined,
      };
      
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderTimeline(mockCanvas as any, dataWithoutTracks);
      }).not.toThrow();
    });

    it('should respect custom config', () => {
      const mockData = createMockTimelineData();
      const customConfig = {
        width: 1000,
        height: 300,
        colors: {
          background: '#000000',
          splitBorder: '#ff0000',
          splitFill: '#00ff00',
          trackBorder: '#0000ff',
          trackFill: '#ffff00',
          text: '#ffffff',
        },
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderTimeline(mockCanvas as any, mockData, customConfig);
      
      expect(mockCanvas.width).toBe(1000);
      expect(mockCanvas.height).toBe(300);
    });

    it('should throw error if canvas context is null', () => {
      const mockBadCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(null),
      };
      
      const mockData = createMockTimelineData();
      
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderTimeline(mockBadCanvas as any, mockData);
      }).toThrow('Could not get canvas 2D context');
    });
  });
});