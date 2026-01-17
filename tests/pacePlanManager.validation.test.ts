import { describe, it, expect } from 'vitest';
import { validateSplits, areSplitsValid, mergeSplits, splitSplit } from '../src/managers/pacePlanManager';
import type { Split } from '../src/models/types';

describe('PacePlanManager - Split Validation', () => {
  describe('validateSplits', () => {
    it('should return no errors for valid splits', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: 10 }, // 5km, 25 minutes
        { distance: 5, targetTime: 1500, pace: 5, elevation: -5 }, // 5km, 25 minutes
      ];
      const raceDistance = 10; // 10km race
      const targetTime = 3000; // 50 minutes total

      const result = validateSplits(splits, raceDistance, targetTime);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return error for empty splits array', () => {
      const splits: Split[] = [];
      const raceDistance = 10;
      const targetTime = 3000;

      const result = validateSplits(splits, raceDistance, targetTime);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('splits');
      expect(result.errors[0].message).toBe('At least one split is required');
    });

    it('should return error for split distance below minimum', () => {
      const splits: Split[] = [
        { distance: 0.05, targetTime: 300, pace: 10, elevation: 0 }, // 0.05km, below 0.1km minimum
      ];
      const raceDistance = 0.05;
      const targetTime = 300;

      const result = validateSplits(splits, raceDistance, targetTime);

      expect(result.errors).toContainEqual({
        field: 'distance',
        message: 'Split distance must be at least 0.1 km',
        splitIndex: 0,
      });
    });

    it('should return error for negative target time', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: -100, pace: 5, elevation: 0 },
      ];
      const raceDistance = 5;
      const targetTime = -100;

      const result = validateSplits(splits, raceDistance, targetTime);

      expect(result.errors).toContainEqual({
        field: 'targetTime',
        message: 'Split target time must be greater than 0',
        splitIndex: 0,
      });
    });

    it('should return error when total distance does not equal race distance', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: 0 },
        { distance: 4, targetTime: 1200, pace: 5, elevation: 0 }, // Total 9km instead of 10km
      ];
      const raceDistance = 10;
      const targetTime = 2700;

      const result = validateSplits(splits, raceDistance, targetTime);

      expect(result.errors).toContainEqual({
        field: 'distance',
        message: 'Total split distance (9.00 km) must equal race distance (10.00 km)',
      });
    });

    it('should return error when total time does not equal target time', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: 0 },
        { distance: 5, targetTime: 1500, pace: 5, elevation: 0 }, // Total 3000s instead of 2700s
      ];
      const raceDistance = 10;
      const targetTime = 2700;

      const result = validateSplits(splits, raceDistance, targetTime);

      expect(result.errors).toContainEqual({
        field: 'targetTime',
        message: 'Total split time (3000s) must equal pace plan target time (2700s)',
      });
    });

    it('should allow negative elevation values', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: -100 }, // Negative elevation should be allowed
        { distance: 5, targetTime: 1500, pace: 5, elevation: 50 },
      ];
      const raceDistance = 10;
      const targetTime = 3000;

      const result = validateSplits(splits, raceDistance, targetTime);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle floating point precision for distances', () => {
      const splits: Split[] = [
        { distance: 3.33, targetTime: 1000, pace: 5, elevation: 0 },
        { distance: 3.33, targetTime: 1000, pace: 5, elevation: 0 },
        { distance: 3.34, targetTime: 1000, pace: 5, elevation: 0 }, // Total 10.00 km
      ];
      const raceDistance = 10.0;
      const targetTime = 3000;

      const result = validateSplits(splits, raceDistance, targetTime);

      expect(result.errors).toHaveLength(0);
    });

    it('should return multiple errors for multiple issues', () => {
      const splits: Split[] = [
        { distance: 0.05, targetTime: -100, pace: 5, elevation: 0 }, // Below min distance and negative time
        { distance: 4, targetTime: 1200, pace: 5, elevation: 0 },
      ];
      const raceDistance = 10; // Total distance will be 4.05, not 10
      const targetTime = 2000; // Total time will be 1100, not 2000

      const result = validateSplits(splits, raceDistance, targetTime);

      expect(result.errors).toHaveLength(4); // Min distance, negative time, total distance mismatch, total time mismatch
    });
  });

  describe('areSplitsValid', () => {
    it('should return true for valid splits', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: 0 },
        { distance: 5, targetTime: 1500, pace: 5, elevation: 0 },
      ];
      const raceDistance = 10;
      const targetTime = 3000;

      const isValid = areSplitsValid(splits, raceDistance, targetTime);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid splits', () => {
      const splits: Split[] = [
        { distance: 0.05, targetTime: 1500, pace: 5, elevation: 0 }, // Below minimum distance
      ];
      const raceDistance = 0.05;
      const targetTime = 1500;

      const isValid = areSplitsValid(splits, raceDistance, targetTime);

      expect(isValid).toBe(false);
    });

    it('should return false for empty splits', () => {
      const splits: Split[] = [];
      const raceDistance = 10;
      const targetTime = 3000;

      const isValid = areSplitsValid(splits, raceDistance, targetTime);

      expect(isValid).toBe(false);
    });
  });

  describe('mergeSplits', () => {
    it('should merge two adjacent splits correctly', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: 10 },
        { distance: 3, targetTime: 900, pace: 5, elevation: 20 },
        { distance: 2, targetTime: 600, pace: 5, elevation: 0 },
      ];

      const result = mergeSplits(splits, 0, 1);

      expect(result).toHaveLength(2);
      expect(result[0].distance).toBe(8); // 5 + 3
      expect(result[0].targetTime).toBe(2400); // 1500 + 900
      expect(result[0].elevation).toBe(15); // Average of 10 and 20
      expect(result[0].pace).toBeCloseTo(5); // 2400s / 60 / 8km = 5 min/km
      expect(result[1]).toEqual(splits[2]); // Third split unchanged
    });

    it('should merge non-adjacent splits correctly', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: 10 },
        { distance: 3, targetTime: 900, pace: 5, elevation: 20 },
        { distance: 2, targetTime: 600, pace: 5, elevation: 0 },
      ];

      const result = mergeSplits(splits, 0, 2);

      expect(result).toHaveLength(2);
      expect(result[0].distance).toBe(7); // 5 + 2
      expect(result[0].targetTime).toBe(2100); // 1500 + 600
      expect(result[0].elevation).toBe(5); // Average of 10 and 0
      expect(result[1]).toEqual(splits[1]); // Middle split unchanged
    });

    it('should handle splits with undefined elevation', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5 }, // No elevation
        { distance: 3, targetTime: 900, pace: 5, elevation: 20 },
      ];

      const result = mergeSplits(splits, 0, 1);

      expect(result).toHaveLength(1);
      expect(result[0].elevation).toBe(20); // Takes the defined elevation
    });

    it('should throw error for invalid indices', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: 0 },
      ];

      expect(() => mergeSplits(splits, 0, 2)).toThrow('Invalid split indices for merge operation');
      expect(() => mergeSplits(splits, -1, 0)).toThrow('Invalid split indices for merge operation');
    });

    it('should throw error when merging split with itself', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: 0 },
      ];

      expect(() => mergeSplits(splits, 0, 0)).toThrow('Cannot merge a split with itself');
    });
  });

  describe('splitSplit', () => {
    it('should split a split evenly', () => {
      const splits: Split[] = [
        { distance: 10, targetTime: 3000, pace: 5, elevation: 100 },
        { distance: 5, targetTime: 1500, pace: 5, elevation: 50 },
      ];

      const result = splitSplit(splits, 0, 'even');

      expect(result).toHaveLength(3);
      expect(result[0].distance).toBe(5); // Half of 10
      expect(result[0].targetTime).toBe(1500); // Half of 3000
      expect(result[0].elevation).toBe(100); // Same as original
      expect(result[0].pace).toBeCloseTo(5); // 1500s / 60 / 5km = 5 min/km
      
      expect(result[1].distance).toBe(5); // Half of 10
      expect(result[1].targetTime).toBe(1500); // Half of 3000
      expect(result[1].elevation).toBe(100); // Same as original
      expect(result[1].pace).toBeCloseTo(5);
      
      expect(result[2]).toEqual(splits[1]); // Second split unchanged
    });

    it('should handle split with undefined elevation', () => {
      const splits: Split[] = [
        { distance: 10, targetTime: 3000, pace: 5 }, // No elevation
      ];

      const result = splitSplit(splits, 0, 'even');

      expect(result).toHaveLength(2);
      expect(result[0].elevation).toBe(0); // Default to 0
      expect(result[1].elevation).toBe(0); // Default to 0
    });

    it('should use even strategy by default', () => {
      const splits: Split[] = [
        { distance: 10, targetTime: 3000, pace: 5, elevation: 0 },
      ];

      const result = splitSplit(splits, 0); // No strategy specified

      expect(result).toHaveLength(2);
      expect(result[0].distance).toBe(5);
      expect(result[0].targetTime).toBe(1500);
      expect(result[1].distance).toBe(5);
      expect(result[1].targetTime).toBe(1500);
    });

    it('should throw error for invalid index', () => {
      const splits: Split[] = [
        { distance: 5, targetTime: 1500, pace: 5, elevation: 0 },
      ];

      expect(() => splitSplit(splits, 2)).toThrow('Invalid split index for split operation');
      expect(() => splitSplit(splits, -1)).toThrow('Invalid split index for split operation');
    });
  });
});