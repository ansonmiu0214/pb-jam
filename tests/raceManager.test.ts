import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Simple in-memory store for testing
class MockFirestoreStore {
  private data: Map<string, Map<string, Record<string, unknown>>> = new Map();

  addRace(userId: string, raceData: Record<string, unknown>): string {
    const raceId = `race-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (!this.data.has(userId)) {
      this.data.set(userId, new Map());
    }
    this.data.get(userId)!.set(raceId, { ...raceData, id: raceId });
    return raceId;
  }

  getRaces(userId: string): Array<Record<string, unknown>> {
    const userRaces = this.data.get(userId);
    if (!userRaces) {
      return [];
    }
    return Array.from(userRaces.values());
  }

  deleteRace(userId: string, raceId: string): void {
    const userRaces = this.data.get(userId);
    if (userRaces) {
      userRaces.delete(raceId);
    }
  }

  clear(): void {
    this.data.clear();
  }
}

const mockStore = new MockFirestoreStore();

// Mock Firebase service
vi.mock('../src/services/firebaseService', () => ({
  db: { _: 'mock' },
}));

// Mock Firebase Firestore functions
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn((db, ...pathSegments) => {
      // pathSegments will be like ['users', userId, 'races']
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
      const raceId = mockStore.addRace(userId, data);
      return { id: raceId };
    }),
    doc: vi.fn((db, ...pathSegments) => {
      // pathSegments will be like ['users', userId, 'races', raceId]
      const userId = pathSegments[1];
      const docId = pathSegments[3];
      return {
        _type: 'doc',
        userId,
        docId,
      };
    }),
    getDocs: vi.fn(async (queryObj: unknown) => {
      // Extract userId from the query object
      const mockGetDocsRef = queryObj as Record<string, unknown>;
      const userId = mockGetDocsRef.userId as string;

      const allRaces: Array<{ id: string; data: () => Record<string, unknown> }> = [];

      if (userId) {
        const races = mockStore.getRaces(userId);
        races.forEach((raceData) => {
          allRaces.push({
            id: raceData.id as string,
            data: () => raceData,
          });
        });
      }

      return {
        forEach: (callback: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
          allRaces.forEach(callback);
        },
      };
    }),
    deleteDoc: vi.fn(async (docRef: unknown) => {
      const ref = docRef as Record<string, unknown>;
      const userId = ref.userId as string;
      const docId = ref.docId as string;
      mockStore.deleteRace(userId, docId);
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
import { createRace, fetchRaces, deleteRace } from '../src/managers/raceManager';

describe('RaceManager - CRUD Operations', () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createRace', () => {
    it('should create a race with required fields', async () => {
      const userId = 'user-123';
      const title = 'Boston Marathon';
      const distance = 42.195;
      const unit = 'km' as const;

      const race = await createRace(userId, { title, distance, unit });

      expect(race).toBeDefined();
      expect(race.id).toBeDefined();
      expect(race.userId).toBe(userId);
      expect(race.title).toBe(title);
      expect(race.distance).toBe(distance);
      expect(race.unit).toBe(unit);
    });

    it('should initialize empty tags array', async () => {
      const race = await createRace('user-123', { title: 'Test Race', distance: 10, unit: 'km' });

      expect(race.tags).toEqual([]);
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const race = await createRace('user-123', { title: 'Test Race', distance: 10, unit: 'km' });

      expect(race.createdAt).toBeDefined();
      expect(race.updatedAt).toBeDefined();
      expect(race.createdAt).toBeInstanceOf(Date);
      expect(race.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle both km and mi units', async () => {
      const raceKm = await createRace('user-123', { title: 'Race KM', distance: 10, unit: 'km' });
      const raceMi = await createRace('user-123', { title: 'Race MI', distance: 5, unit: 'mi' });

      expect(raceKm.unit).toBe('km');
      expect(raceMi.unit).toBe('mi');
    });

    it('should log success message to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const race = await createRace('user-123', { title: 'Test Race', distance: 10, unit: 'km' });

      // Check that console.log was called with the success message and the race object
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RaceManager] Race created successfully'),
        race
      );

      consoleSpy.mockRestore();
    });
  });

  describe('fetchRaces', () => {
    it('should fetch races for a user', async () => {
      const userId = 'user-123';

      // Create some test races
      await createRace(userId, { title: 'Race 1', distance: 10, unit: 'km' });
      await createRace(userId, { title: 'Race 2', distance: 5, unit: 'mi' });

      const races = await fetchRaces(userId);

      expect(races).toBeDefined();
      expect(Array.isArray(races)).toBe(true);
      expect(races.length).toBe(2);
    });

    it('should return empty array when no races exist', async () => {
      const races = await fetchRaces('unknown-user');

      expect(races).toEqual([]);
    });

    it('should return race objects with all fields', async () => {
      const userId = 'user-123';
      await createRace(userId, { title: 'Test Race', distance: 21.1, unit: 'km' });

      const races = await fetchRaces(userId);

      expect(races.length).toBeGreaterThan(0);
      const race = races[0];
      expect(race).toHaveProperty('id');
      expect(race).toHaveProperty('userId');
      expect(race).toHaveProperty('title');
      expect(race).toHaveProperty('distance');
      expect(race).toHaveProperty('unit');
      expect(race).toHaveProperty('tags');
    });

    it('should log the number of fetched races', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const userId = 'user-123';

      await createRace(userId, { title: 'Race 1', distance: 10, unit: 'km' });
      await createRace(userId, { title: 'Race 2', distance: 5, unit: 'mi' });

      await fetchRaces(userId);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[RaceManager\] Fetched \d+ races for user/)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deleteRace', () => {
    it('should delete a race by ID', async () => {
      const userId = 'user-123';
      const race = await createRace(userId, { title: 'Test Race', distance: 10, unit: 'km' });

      // Verify race was created
      let races = await fetchRaces(userId);
      expect(races.length).toBe(1);

      // Delete the race
      await deleteRace(userId, race.id);

      // Verify race was deleted
      races = await fetchRaces(userId);
      expect(races.length).toBe(0);
    });

    it('should log success message when deleting', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const userId = 'user-123';
      const race = await createRace(userId, { title: 'Test Race', distance: 10, unit: 'km' });

      await deleteRace(userId, race.id);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[RaceManager] Race deleted successfully: ${race.id}`)
      );

      consoleSpy.mockRestore();
    });

    it('should log TODO for cascade delete', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const userId = 'user-123';
      const race = await createRace(userId, { title: 'Test Race', distance: 10, unit: 'km' });

      await deleteRace(userId, race.id);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('TODO: Implement cascade delete for pace plans')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple users independently', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      await createRace(user1, { title: 'User1 Race', distance: 10, unit: 'km' });
      await createRace(user2, { title: 'User2 Race', distance: 5, unit: 'mi' });

      const user1Races = await fetchRaces(user1);
      const user2Races = await fetchRaces(user2);

      expect(user1Races.length).toBe(1);
      expect(user2Races.length).toBe(1);
    });

    it('should support creating multiple races for one user', async () => {
      const userId = 'user-123';

      await createRace(userId, { title: 'Marathon', distance: 42.195, unit: 'km' });
      await createRace(userId, { title: 'Half Marathon', distance: 21.1, unit: 'km' });
      await createRace(userId, { title: '5K', distance: 5, unit: 'km' });

      const races = await fetchRaces(userId);

      expect(races.length).toBe(3);
      expect(races.map((r) => r.title)).toContain('Marathon');
      expect(races.map((r) => r.title)).toContain('Half Marathon');
      expect(races.map((r) => r.title)).toContain('5K');
    });
  });
});
