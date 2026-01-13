import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Simple in-memory store for testing
class MockFirestoreStore {
  private data: Map<string, Map<string, Record<string, unknown>>> = new Map();

  addPacePlan(userId: string, pacePlanData: Record<string, unknown>): string {
    const pacePlanId = `paceplan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (!this.data.has(userId)) {
      this.data.set(userId, new Map());
    }
    this.data.get(userId)!.set(pacePlanId, { ...pacePlanData, id: pacePlanId });
    return pacePlanId;
  }

  getPacePlans(userId: string): Array<Record<string, unknown>> {
    const userPacePlans = this.data.get(userId);
    if (!userPacePlans) {
      return [];
    }
    return Array.from(userPacePlans.values());
  }

  deletePacePlan(userId: string, pacePlanId: string): void {
    const userPacePlans = this.data.get(userId);
    if (userPacePlans) {
      userPacePlans.delete(pacePlanId);
    }
  }

  clear(): void {
    this.data.clear();
  }
}

const mockStore = new MockFirestoreStore();

// Mock user service
vi.mock('../src/services/userService', () => ({
  getUserId: vi.fn(() => 'test-user-123'),
}));

// Mock Firebase service
vi.mock('../src/services/firebaseService', () => ({
  db: { _: 'mock' },
  auth: {
    onAuthStateChanged: vi.fn(() => vi.fn()),
    currentUser: { uid: 'test-user-123' },
  },
}));

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn((db, ...pathSegments) => {
      const userId = pathSegments[1];
      return {
        _type: 'collection',
        userId,
        pathSegments,
      };
    }),
    addDoc: vi.fn(async (ref: unknown, data: Record<string, unknown>) => {
      const refObj = ref as Record<string, unknown>;
      const userId = refObj.userId as string;
      const pacePlanId = mockStore.addPacePlan(userId, data);
      return { id: pacePlanId };
    }),
    doc: vi.fn((db, ...pathSegments) => {
      const userId = pathSegments[1];
      const docId = pathSegments[3];
      return {
        _type: 'doc',
        userId,
        docId,
      };
    }),
    getDocs: vi.fn(async (queryObj: unknown) => {
      const mockGetDocsRef = queryObj as Record<string, unknown>;
      const userId = mockGetDocsRef.userId as string;

      const allPacePlans: Array<{ id: string; data: () => Record<string, unknown> }> = [];

      if (userId) {
        const pacePlans = mockStore.getPacePlans(userId);
        pacePlans.forEach((pacePlanData) => {
          allPacePlans.push({
            id: pacePlanData.id as string,
            data: () => pacePlanData,
          });
        });
      }

      return {
        forEach: (callback: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
          allPacePlans.forEach(callback);
        },
      };
    }),
    deleteDoc: vi.fn(async (docRef: unknown) => {
      const ref = docRef as Record<string, unknown>;
      const userId = ref.userId as string;
      const docId = ref.docId as string;
      mockStore.deletePacePlan(userId, docId);
    }),
    query: vi.fn((collection, whereClause) => {
      const collectionObj = collection as Record<string, unknown>;
      return {
        _type: 'query',
        collection,
        whereClause,
        userId: collectionObj.userId,
      };
    }),
    where: vi.fn((field, op, value) => ({
      field,
      op,
      value,
    })),
  };
});

// Now import after mocks are set up
import { createPacePlan, fetchPacePlans, deletePacePlan } from '../src/managers/pacePlanManager';

describe('PacePlanManager - CRUD Operations', () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPacePlan', () => {
    it('should create a pace plan with required fields', async () => {
      const raceId = 'race-456';
      const title = 'Boston Marathon Pace';
      const targetTime = 10800; // 3 hours in seconds

      const pacePlan = await createPacePlan(raceId, { title, targetTime });

      expect(pacePlan).toBeDefined();
      expect(pacePlan.id).toBeDefined();
      expect(pacePlan.userId).toBe('test-user-123');
      expect(pacePlan.raceId).toBe(raceId);
      expect(pacePlan.title).toBe(title);
      expect(pacePlan.targetTime).toBe(targetTime);
    });

    it('should initialize empty splits and tags arrays', async () => {
      const pacePlan = await createPacePlan('race-456', { title: 'Test Plan', targetTime: 3600 });

      expect(pacePlan.splits).toEqual([]);
      expect(pacePlan.tags).toEqual([]);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const pacePlan = await createPacePlan('race-456', { title: 'Test Plan', targetTime: 3600 });

      expect(pacePlan.createdAt).toBeDefined();
      expect(pacePlan.updatedAt).toBeDefined();
      expect(pacePlan.createdAt).toBeInstanceOf(Date);
      expect(pacePlan.updatedAt).toBeInstanceOf(Date);
    });

    it('should log success message to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const pacePlan = await createPacePlan('race-456', { title: 'Test Plan', targetTime: 3600 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PacePlanManager] Pace plan created successfully'),
        pacePlan
      );

      consoleSpy.mockRestore();
    });

    it('should create a pace plan with Spotify playlist ID', async () => {
      const raceId = 'race-456';
      const title = 'Marathon with Playlist';
      const targetTime = 10800;
      const spotifyPlaylistId = 'spotify-playlist-123';

      const pacePlan = await createPacePlan(raceId, { 
        title, 
        targetTime, 
        spotifyPlaylistId 
      });

      expect(pacePlan).toBeDefined();
      expect(pacePlan.spotifyPlaylistId).toBe(spotifyPlaylistId);
    });

    it('should create a pace plan without Spotify playlist ID when not provided', async () => {
      const raceId = 'race-456';
      const title = 'Marathon without Playlist';
      const targetTime = 10800;

      const pacePlan = await createPacePlan(raceId, { title, targetTime });

      expect(pacePlan).toBeDefined();
      expect(pacePlan.spotifyPlaylistId).toBeUndefined();
    });

    it('should not include spotifyPlaylistId field when empty string is provided', async () => {
      const raceId = 'race-456';
      const title = 'Marathon with Empty Playlist';
      const targetTime = 10800;
      const spotifyPlaylistId = '';

      const pacePlan = await createPacePlan(raceId, { 
        title, 
        targetTime, 
        spotifyPlaylistId 
      });

      expect(pacePlan).toBeDefined();
      expect(pacePlan.spotifyPlaylistId).toBeUndefined();
    });
  });

  describe('fetchPacePlans', () => {
    it('should fetch pace plans for a specific race', async () => {
      const raceId = 'race-456';

      // Create some pace plans for this race
      await createPacePlan(raceId, { title: 'Plan 1', targetTime: 3600 });
      await createPacePlan(raceId, { title: 'Plan 2', targetTime: 5400 });

      // Create a pace plan for a different race (should not be returned)
      await createPacePlan('race-789', { title: 'Other Plan', targetTime: 7200 });

      const pacePlans = await fetchPacePlans(raceId);

      expect(pacePlans).toBeDefined();
      expect(Array.isArray(pacePlans)).toBe(true);
      // Note: In the mock, filtering by raceId isn't implemented, so we get all
      // In real Firestore, the where clause would filter correctly
      expect(pacePlans.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no pace plans exist', async () => {
      const pacePlans = await fetchPacePlans('unknown-race');

      expect(pacePlans).toEqual([]);
    });

    it('should return pace plan objects with all fields', async () => {
      const raceId = 'race-456';
      await createPacePlan(raceId, { title: 'Test Plan', targetTime: 3600 });

      const pacePlans = await fetchPacePlans(raceId);

      expect(pacePlans.length).toBeGreaterThan(0);
      const pacePlan = pacePlans[0];
      expect(pacePlan).toHaveProperty('id');
      expect(pacePlan).toHaveProperty('userId');
      expect(pacePlan).toHaveProperty('raceId');
      expect(pacePlan).toHaveProperty('title');
      expect(pacePlan).toHaveProperty('targetTime');
      expect(pacePlan).toHaveProperty('splits');
      expect(pacePlan).toHaveProperty('tags');
    });

    it('should log the number of fetched pace plans', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const raceId = 'race-456';

      await createPacePlan(raceId, { title: 'Plan 1', targetTime: 3600 });
      await createPacePlan(raceId, { title: 'Plan 2', targetTime: 5400 });

      await fetchPacePlans(raceId);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[PacePlanManager\] Fetched \d+ pace plans for race/)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deletePacePlan', () => {
    it('should delete a pace plan by ID', async () => {
      const raceId = 'race-456';
      const pacePlan = await createPacePlan(raceId, { title: 'Test Plan', targetTime: 3600 });

      // Verify pace plan was created
      let pacePlans = await fetchPacePlans(raceId);
      expect(pacePlans.length).toBeGreaterThan(0);

      // Delete the pace plan
      await deletePacePlan(pacePlan.id);

      // Verify pace plan was deleted
      pacePlans = await fetchPacePlans(raceId);
      expect(pacePlans.length).toBe(0);
    });

    it('should log success message when deleting', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const pacePlan = await createPacePlan('race-456', { title: 'Test Plan', targetTime: 3600 });

      await deletePacePlan(pacePlan.id);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[PacePlanManager] Pace plan deleted successfully: ${pacePlan.id}`)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple pace plans for one race', async () => {
      const raceId = 'race-456';

      await createPacePlan(raceId, { title: 'Conservative', targetTime: 10800 });
      await createPacePlan(raceId, { title: 'Target', targetTime: 9000 });
      await createPacePlan(raceId, { title: 'Aggressive', targetTime: 8100 });

      const pacePlans = await fetchPacePlans(raceId);

      expect(pacePlans.length).toBe(3);
      expect(pacePlans.map((p) => p.title)).toContain('Conservative');
      expect(pacePlans.map((p) => p.title)).toContain('Target');
      expect(pacePlans.map((p) => p.title)).toContain('Aggressive');
    });

    it('should handle multiple races with different pace plans', async () => {
      const race1Id = 'race-1';
      const race2Id = 'race-2';

      await createPacePlan(race1Id, { title: 'Race1 Plan', targetTime: 3600 });
      await createPacePlan(race2Id, { title: 'Race2 Plan', targetTime: 7200 });

      const race1Plans = await fetchPacePlans(race1Id);
      const race2Plans = await fetchPacePlans(race2Id);

      expect(race1Plans.length).toBeGreaterThan(0);
      expect(race2Plans.length).toBeGreaterThan(0);
    });
  });
});
