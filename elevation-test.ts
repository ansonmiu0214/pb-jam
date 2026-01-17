// Simple compilation test for elevation support
import type { Split, PacePlan } from '../src/models/types';
import { mergeSplits, splitSplit } from '../src/managers/pacePlanManager';

// Test that elevation is properly typed and handled
const testSplit: Split = {
  distance: 5,
  targetTime: 1500,
  pace: 5,
  elevation: 100, // Should work with elevation
};

const testSplitWithoutElevation: Split = {
  distance: 5,
  targetTime: 1500,
  pace: 5,
  // elevation is optional, should work without it
};

// Test that mergeSplits and splitSplit work with elevation
const splits: Split[] = [
  { distance: 5, targetTime: 1500, pace: 5, elevation: 10 },
  { distance: 5, targetTime: 1500, pace: 5, elevation: -5 },
];

// These should compile without errors
const merged = mergeSplits(splits, 0, 1);
const splitSplits = splitSplit(splits, 0);

console.log('Elevation support compilation test passed!');