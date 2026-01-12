// Race management module
import { db } from '../services/firebaseService';
import { Race } from '../models/types';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from 'firebase/firestore';

/**
 * Get the collection name based on environment
 */
function getRacesCollectionName(): string {
  const env = import.meta.env.VITE_ENVIRONMENT || 'prod';
  return env === 'dev' ? 'races-dev' : 'races';
}

/**
 * Create a new race and store it in Firestore
 * @param userId - Current user's ID
 * @param raceData - Race data object with title, distance, unit
 * @returns The created Race object with ID
 */
export async function createRace(
  userId: string,
  raceData: {
    title: string;
    distance: number;
    unit: 'km' | 'mi';
  }
): Promise<Race> {
  try {
    console.log('[RaceManager.createRace] Called with:', { userId, raceData });
    
    const docData = {
      userId,
      title: raceData.title,
      distance: raceData.distance,
      unit: raceData.unit,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('[RaceManager.createRace] Preparing to add doc with data:', docData);

    const racesCollection = collection(db, 'users', userId, getRacesCollectionName());
    console.log('[RaceManager.createRace] Got collection reference');
    
    console.log('[RaceManager.createRace] About to call addDoc...');
    const docRef = await addDoc(racesCollection, docData);
    console.log('[RaceManager.createRace] Document added with ID:', docRef.id);

    const newRace: Race = {
      id: docRef.id,
      ...docData,
    };

    console.log('[RaceManager] Race created successfully:', newRace);
    return newRace;
  } catch (error) {
    console.error('[RaceManager] Failed to create race:', error);
    throw error;
  }
}

/**
 * Fetch all races for the current user
 * @param userId - Current user's ID
 * @returns Array of Race objects
 */
export async function fetchRaces(userId: string): Promise<Race[]> {
  try {
    const racesCollection = collection(db, 'users', userId, getRacesCollectionName());
    const q = query(racesCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const races: Race[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      races.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        distance: data.distance,
        unit: data.unit,
        tags: data.tags || [],
        pacePlans: data.pacePlans,
        createdAt: data.createdAt?.toDate?.(),
        updatedAt: data.updatedAt?.toDate?.(),
      } as Race);
    });

    console.log(`[RaceManager] Fetched ${races.length} races for user ${userId}`);
    return races;
  } catch (error) {
    console.error('[RaceManager] Failed to fetch races:', error);
    throw error;
  }
}

/**
 * Delete a race by ID
 * Note: This is a placeholder that deletes the race document.
 * A cascade delete for associated pace plans should be implemented
 * @param userId - Current user's ID
 * @param raceId - Race ID to delete
 */
export async function deleteRace(userId: string, raceId: string): Promise<void> {
  try {
    const raceRef = doc(db, 'users', userId, getRacesCollectionName(), raceId);
    await deleteDoc(raceRef);

    console.log(`[RaceManager] Race deleted successfully: ${raceId}`);
    // TODO: Implement cascade delete for associated pace plans
    console.log('[RaceManager] TODO: Implement cascade delete for pace plans');
  } catch (error) {
    console.error('[RaceManager] Failed to delete race:', error);
    throw error;
  }
}
