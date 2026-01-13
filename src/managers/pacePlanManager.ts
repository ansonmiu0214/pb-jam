// Pace plan management module
import { db } from '../services/firebaseService';
import { PacePlan } from '../models/types';
import { getUserId } from '../services/userService';
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
function getPacePlansCollectionName(): string {
  const env = import.meta.env.VITE_ENVIRONMENT || 'prod';
  return env === 'dev' ? 'pacePlans-dev' : 'pacePlans';
}

/**
 * Create a new pace plan and store it in Firestore linked to a race
 * @param raceId - Race ID to link this pace plan to
 * @param pacePlanData - Pace plan data object with title and targetTime
 * @returns The created PacePlan object with ID
 */
export async function createPacePlan(
  raceId: string,
  pacePlanData: {
    title: string;
    targetTime: number;
  }
): Promise<PacePlan> {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User must be authenticated to create pace plans');
  }

  try {
    const docData = {
      userId,
      raceId,
      title: pacePlanData.title,
      targetTime: pacePlanData.targetTime,
      splits: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pacePlansCollection = collection(db, 'users', userId, getPacePlansCollectionName());
    const docRef = await addDoc(pacePlansCollection, docData);

    const newPacePlan: PacePlan = {
      id: docRef.id,
      ...docData,
    } as PacePlan;

    console.log('[PacePlanManager] Pace plan created successfully:', newPacePlan);
    return newPacePlan;
  } catch (error) {
    console.error('[PacePlanManager] Failed to create pace plan:', error);
    throw error;
  }
}

/**
 * Fetch all pace plans for a given race
 * @param raceId - Race ID to fetch pace plans for
 * @returns Array of PacePlan objects linked to the race
 */
export async function fetchPacePlans(raceId: string): Promise<PacePlan[]> {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User must be authenticated to fetch pace plans');
  }

  try {
    const pacePlansCollection = collection(db, 'users', userId, getPacePlansCollectionName());
    const q = query(pacePlansCollection, where('raceId', '==', raceId));
    const querySnapshot = await getDocs(q);

    const pacePlans: PacePlan[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      pacePlans.push({
        id: doc.id,
        userId: data.userId,
        raceId: data.raceId,
        title: data.title,
        targetTime: data.targetTime,
        splits: data.splits || [],
        spotifyPlaylistId: data.spotifyPlaylistId,
        tags: data.tags || [],
        createdAt: data.createdAt?.toDate?.(),
        updatedAt: data.updatedAt?.toDate?.(),
      } as PacePlan);
    });

    console.log(
      `[PacePlanManager] Fetched ${pacePlans.length} pace plans for race ${raceId}`
    );
    return pacePlans;
  } catch (error) {
    console.error('[PacePlanManager] Failed to fetch pace plans:', error);
    throw error;
  }
}

/**
 * Delete a pace plan by ID
 * @param pacePlanId - Pace plan ID to delete
 */
export async function deletePacePlan(pacePlanId: string): Promise<void> {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User must be authenticated to delete pace plans');
  }

  try {
    const pacePlanRef = doc(db, 'users', userId, getPacePlansCollectionName(), pacePlanId);
    await deleteDoc(pacePlanRef);

    console.log(`[PacePlanManager] Pace plan deleted successfully: ${pacePlanId}`);
  } catch (error) {
    console.error('[PacePlanManager] Failed to delete pace plan:', error);
    throw error;
  }
}
