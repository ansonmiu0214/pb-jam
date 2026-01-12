// Race management module
import { db } from '../services/firebaseService';
import { Race } from '../models/types';
import { getUserId } from '../services/userService';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

function getRacesCollectionName(): string {
  const env = import.meta.env.VITE_ENVIRONMENT || 'prod';
  return env === 'dev' ? 'races-dev' : 'races';
}

// Support two signatures for compatibility across UI and tests:
// createRace(userId, raceData) and createRace(raceData) which uses current user
export async function createRace(
  userIdOrData: string | { title: string; distance: number; unit: 'km' | 'mi' },
  maybeData?: { title: string; distance: number; unit: 'km' | 'mi' }
): Promise<Race> {
  const isUserProvided = typeof userIdOrData === 'string';
  const userId = isUserProvided ? (userIdOrData as string) : getUserId();
  const data = isUserProvided ? maybeData! : (userIdOrData as { title: string; distance: number; unit: 'km' | 'mi' });

  if (!userId) {
    throw new Error('User must be authenticated to create races');
  }

  const docData = {
    userId,
    title: data.title,
    distance: data.distance,
    unit: data.unit,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const racesCollection = collection(db, 'users', userId, getRacesCollectionName());
  const docRef = await addDoc(racesCollection, docData);

  const newRace = {
    id: docRef.id,
    ...docData,
  } as Race;

  console.log('[RaceManager] Race created successfully', newRace);
  return newRace;
}

// fetchRaces(userId?) - if no userId provided, use current Firebase user
export async function fetchRaces(userId?: string): Promise<Race[]> {
  const uid = userId || getUserId();
  if (!uid) {
    throw new Error('User must be authenticated to fetch races');
  }

  const racesCollection = collection(db, 'users', uid, getRacesCollectionName());
  const querySnapshot = await getDocs(racesCollection);

  const races: Race[] = [];
  querySnapshot.forEach((d) => {
    const data = d.data();
    races.push({
      id: d.id,
      userId: data.userId,
      title: data.title,
      distance: data.distance,
      unit: data.unit,
      tags: data.tags || [],
      pacePlans: data.pacePlans,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    } as Race);
  });

  console.log(`[RaceManager] Fetched ${races.length} races for user ${uid}`);
  return races;
}

// deleteRace(raceId) or deleteRace(userId, raceId)
export async function deleteRace(userIdOrRaceId: string, maybeRaceId?: string): Promise<void> {
  const isUserProvided = typeof maybeRaceId === 'string';
  const userId = isUserProvided ? userIdOrRaceId : getUserId();
  const raceId = isUserProvided ? maybeRaceId! : userIdOrRaceId;

  if (!userId) {
    throw new Error('User must be authenticated to delete races');
  }

  const raceRef = doc(db, 'users', userId, getRacesCollectionName(), raceId);
  await deleteDoc(raceRef);

  console.log(`[RaceManager] Race deleted successfully: ${raceId}`);
  // TODO: Implement cascade delete for associated pace plans
  console.log('[RaceManager] TODO: Implement cascade delete for pace plans');
}
