import { describe, it, expect } from 'vitest';
import { calculatePace, formatTime, parseTimeToSeconds } from '../src/managers/pacePlanManager';

describe('PacePlanManager Split Functions', () => {
  describe('calculatePace', () => {
    it('should calculate pace correctly for valid inputs', () => {
      expect(calculatePace(10, 3000)).toBe(5); // 10km in 3000 seconds = 5 min/km
      expect(calculatePace(5, 1500)).toBe(5); // 5km in 1500 seconds = 5 min/km
      expect(calculatePace(21.1, 6600)).toBeCloseTo(5.21, 2); // Half marathon in 1h50m
    });

    it('should return 0 for zero distance', () => {
      expect(calculatePace(0, 1000)).toBe(0);
    });

    it('should return 0 for negative distance', () => {
      expect(calculatePace(-5, 1000)).toBe(0);
    });
  });

  describe('formatTime', () => {
    it('should format seconds to MM:SS for times under 1 hour', () => {
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(3599)).toBe('59:59');
      expect(formatTime(60)).toBe('1:00');
    });

    it('should format seconds to HH:MM:SS for times over 1 hour', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(7325)).toBe('2:02:05');
      expect(formatTime(3665)).toBe('1:01:05');
    });

    it('should handle zero time', () => {
      expect(formatTime(0)).toBe('0:00');
    });
  });

  describe('parseTimeToSeconds', () => {
    it('should parse MM:SS format correctly', () => {
      expect(parseTimeToSeconds('25:30')).toBe(1530);
      expect(parseTimeToSeconds('5:00')).toBe(300);
      expect(parseTimeToSeconds('0:45')).toBe(45);
    });

    it('should parse HH:MM:SS format correctly', () => {
      expect(parseTimeToSeconds('1:25:30')).toBe(5130);
      expect(parseTimeToSeconds('2:00:00')).toBe(7200);
      expect(parseTimeToSeconds('0:05:30')).toBe(330);
    });

    it('should return 0 for invalid formats', () => {
      expect(parseTimeToSeconds('invalid')).toBe(0);
      expect(parseTimeToSeconds('25')).toBe(0);
      expect(parseTimeToSeconds('')).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(parseTimeToSeconds('0:00')).toBe(0);
      expect(parseTimeToSeconds('0:00:00')).toBe(0);
    });
  });
});