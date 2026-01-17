import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPacePlans } from '../src/managers/pacePlanManager';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('../src/services/firebaseService', () => ({
  db: {},
  getPacePlansCollectionName: () => 'pacePlans',
}));

vi.mock('../src/services/userService', () => ({
  getUserId: () => 'test-user-id',
}));

describe('PacePlanManager - Elevation Backward Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should default elevation to 0 for splits without elevation data', async () => {
    // Mock Firestore data with splits missing elevation field
    const mockDoc = {
      id: 'pace-plan-1',
      data: () => ({
        userId: 'test-user-id',
        raceId: 'race-1',
        title: 'Test Pace Plan',
        targetTime: 3000,
        splits: [
          { distance: 5, targetTime: 1500, pace: 5 }, // Missing elevation
          { distance: 5, targetTime: 1500, pace: 5, elevation: 10 }, // Has elevation
        ],
        tags: [],
      }),
    };

    const mockQuerySnapshot = {
      forEach: (callback: (doc: any) => void) => {
        callback(mockDoc);
      },
    };

    (getDocs as any).mockResolvedValue(mockQuerySnapshot);
    (collection as any).mockReturnValue('mock-collection');
    (query as any).mockReturnValue('mock-query');
    (where as any).mockReturnValue('mock-where');

    const pacePlans = await fetchPacePlans('race-1');

    expect(pacePlans).toHaveLength(1);
    expect(pacePlans[0].splits).toHaveLength(2);
    
    // First split should have elevation defaulted to 0
    expect(pacePlans[0].splits[0].elevation).toBe(0);
    
    // Second split should keep its elevation value
    expect(pacePlans[0].splits[1].elevation).toBe(10);
  });

  it('should handle splits with null elevation values', async () => {
    const mockDoc = {
      id: 'pace-plan-2', 
      data: () => ({
        userId: 'test-user-id',
        raceId: 'race-1',
        title: 'Test Pace Plan',
        targetTime: 3000,
        splits: [
          { distance: 5, targetTime: 1500, pace: 5, elevation: null }, // Null elevation
          { distance: 5, targetTime: 1500, pace: 5, elevation: undefined }, // Undefined elevation
        ],
        tags: [],
      }),
    };

    const mockQuerySnapshot = {
      forEach: (callback: (doc: any) => void) => {
        callback(mockDoc);
      },
    };

    (getDocs as any).mockResolvedValue(mockQuerySnapshot);

    const pacePlans = await fetchPacePlans('race-1');

    expect(pacePlans[0].splits[0].elevation).toBe(0);
    expect(pacePlans[0].splits[1].elevation).toBe(0);
  });

  it('should preserve existing elevation values', async () => {
    const mockDoc = {
      id: 'pace-plan-3',
      data: () => ({
        userId: 'test-user-id', 
        raceId: 'race-1',
        title: 'Test Pace Plan',
        targetTime: 3000,
        splits: [
          { distance: 5, targetTime: 1500, pace: 5, elevation: -50 },
          { distance: 5, targetTime: 1500, pace: 5, elevation: 100 },
        ],
        tags: [],
      }),
    };

    const mockQuerySnapshot = {
      forEach: (callback: (doc: any) => void) => {
        callback(mockDoc);
      },
    };

    (getDocs as any).mockResolvedValue(mockQuerySnapshot);

    const pacePlans = await fetchPacePlans('race-1');

    expect(pacePlans[0].splits[0].elevation).toBe(-50);
    expect(pacePlans[0].splits[1].elevation).toBe(100);
  });
});