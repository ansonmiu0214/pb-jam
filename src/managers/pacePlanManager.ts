// Pace plan management module
import { db } from '../services/firebaseService';
import { PacePlan, Split } from '../models/types';
import { getUserId } from '../services/userService';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
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
 * @param pacePlanData - Pace plan data object with title, targetTime, and optional spotifyPlaylistId
 * @returns The created PacePlan object with ID
 */
export async function createPacePlan(
  raceId: string,
  pacePlanData: {
    title: string;
    targetTime: number;
    spotifyPlaylistId?: string;
    raceDistance?: number;
  }
): Promise<PacePlan> {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User must be authenticated to create pace plans');
  }

  try {
    // Create a single default split for the entire race
    const defaultDistance = pacePlanData.raceDistance || 10; // Default to 10km if not provided
    const defaultSplit: Split = {
      distance: defaultDistance,
      targetTime: pacePlanData.targetTime,
      pace: pacePlanData.targetTime / 60 / defaultDistance, // minutes per km
    };

    const docData = {
      userId,
      raceId,
      title: pacePlanData.title,
      targetTime: pacePlanData.targetTime,
      splits: [defaultSplit],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(pacePlanData.spotifyPlaylistId && { spotifyPlaylistId: pacePlanData.spotifyPlaylistId }),
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

/**
 * Update pace plan splits
 * @param pacePlanId - Pace plan ID to update
 * @param splits - New splits array
 * @returns Updated PacePlan object
 */
export async function updatePacePlanSplits(
  pacePlanId: string,
  splits: Split[]
): Promise<void> {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User must be authenticated to update pace plans');
  }

  try {
    // Recalculate pace for each split
    const updatedSplits = splits.map(split => ({
      ...split,
      pace: split.distance > 0 ? (split.targetTime / 60) / split.distance : 0, // minutes per km
    }));

    // Calculate new total target time
    const newTargetTime = updatedSplits.reduce((sum, split) => sum + split.targetTime, 0);

    const pacePlanRef = doc(db, 'users', userId, getPacePlansCollectionName(), pacePlanId);
    await updateDoc(pacePlanRef, {
      splits: updatedSplits,
      targetTime: newTargetTime,
      updatedAt: new Date(),
    });

    console.log(`[PacePlanManager] Pace plan splits updated successfully: ${pacePlanId}`);
  } catch (error) {
    console.error('[PacePlanManager] Failed to update pace plan splits:', error);
    throw error;
  }
}

/**
 * Calculate pace from distance and time
 * @param distance - Distance in km
 * @param timeInSeconds - Time in seconds
 * @returns Pace in minutes per km
 */
export function calculatePace(distance: number, timeInSeconds: number): number {
  if (distance <= 0) return 0;
  return (timeInSeconds / 60) / distance;
}

/**
 * Format time from seconds to MM:SS or HH:MM:SS
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse time string (MM:SS or HH:MM:SS) to seconds
 * @param timeString - Time string in MM:SS or HH:MM:SS format
 * @returns Time in seconds
 */
export function parseTimeToSeconds(timeString: string): number {
  const parts = timeString.split(':').map(part => parseInt(part, 10));
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0; // Invalid format
}
