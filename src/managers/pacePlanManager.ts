// Pace plan management module
import { db } from '../services/firebaseService';
import { PacePlan } from '../models/types';
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
 * Create a new pace plan and store it in Firestore linked to a race
 * @param userId - Current user's ID
 * @param raceId - Race ID to link this pace plan to
 * @param title - Pace plan title
 * @param targetTime - Target time in seconds
 * @returns The created PacePlan object with ID
 */
export async function createPacePlan(
  userId: string,
  raceId: string,
  title: string,
  targetTime: number
): Promise<PacePlan> {
  try {
    const pacePlanData = {
      userId,
      raceId,
      title,
      targetTime,
      splits: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pacePlansCollection = collection(db, 'users', userId, 'pacePlans');
    const docRef = await addDoc(pacePlansCollection, pacePlanData);

    const newPacePlan: PacePlan = {
      id: docRef.id,
      ...pacePlanData,
    };

    console.log('[PacePlanManager] Pace plan created successfully:', newPacePlan);
    return newPacePlan;
  } catch (error) {
    console.error('[PacePlanManager] Failed to create pace plan:', error);
    throw error;
  }
}

/**
 * Fetch all pace plans for a given race
 * @param userId - Current user's ID
 * @param raceId - Race ID to fetch pace plans for
 * @returns Array of PacePlan objects linked to the race
 */
export async function fetchPacePlans(userId: string, raceId: string): Promise<PacePlan[]> {
  try {
    const pacePlansCollection = collection(db, 'users', userId, 'pacePlans');
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
 * @param userId - Current user's ID
 * @param pacePlanId - Pace plan ID to delete
 */
export async function deletePacePlan(userId: string, pacePlanId: string): Promise<void> {
  try {
    const pacePlanRef = doc(db, 'users', userId, 'pacePlans', pacePlanId);
    await deleteDoc(pacePlanRef);

    console.log(`[PacePlanManager] Pace plan deleted successfully: ${pacePlanId}`);
  } catch (error) {
    console.error('[PacePlanManager] Failed to delete pace plan:', error);
    throw error;
  }
}
