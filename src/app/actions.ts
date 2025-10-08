
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { getSdks } from "@/firebase";
import { UserProfile } from "@/lib/types";

export async function getAIReorderRecommendations(input: ReorderRecommendationsInput) {
    try {
        const recommendations = await getReorderRecommendations(input);
        return { success: true, data: recommendations };
    } catch (error) {
        console.error("Error getting AI recommendations:", error);
        return { success: false, error: "Failed to get recommendations from AI." };
    }
}

/**
 * Ensures a user profile exists and sets up their initial role in Firestore if needed.
 * This is the primary source of truth for user and role creation.
 */
export async function setupUserAndRole(uid: string, email: string | null): Promise<{ success: boolean; error?: string }> {
    if (!uid || !email) {
        return { success: false, error: 'User ID and email are required.' };
    }

    try {
        const { firestore } = getSdks();
        const batch = writeBatch(firestore);

        // 1. Ensure User Profile Document Exists
        const userRef = doc(firestore, 'users', uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            const userData: Omit<UserProfile, 'id' | 'uid'> = {
                email: email,
                displayName: email.split('@')[0] || 'Usuario',
            };
            batch.set(userRef, userData);
        }

        // 2. Set Role in Firestore '/roles' collection ONLY if it doesn't exist
        const roleRef = doc(firestore, 'roles', uid);
        const roleDoc = await getDoc(roleRef);

        if (!roleDoc.exists()) {
            if (email === 'maurofbordon@gmail.com') {
                console.log(`>>>>>> Matched admin user: ${email}. Setting role in Firestore. <<<<<<`);
                batch.set(roleRef, { role: 'admin' });
            } else {
                // For other users, we can decide to set a default role or leave it empty.
                // Leaving it empty means they won't have a role until an admin assigns one.
                batch.set(roleRef, {}); // Creates an empty doc to signify a 'user' role without special perms
            }
        }
        
        await batch.commit();
        return { success: true };

    } catch (error: any) {
        console.error('Error setting up user and role in Firestore:', error);
        return { success: false, error: error.message || 'An unexpected error occurred while setting up the user.' };
    }
}


/**
 * Updates a user's role in the Firestore 'roles' collection.
 */
export async function updateUserRole(uid: string, role: 'admin' | 'editor'): Promise<{ success: boolean; error?: string }> {
    if (!uid || !role) {
        return { success: false, error: 'User ID and role are required.' };
    }

    try {
        const { firestore } = getSdks();
        const roleRef = doc(firestore, 'roles', uid);
        
        // Overwrite the role in the Firestore 'roles' collection
        await setDoc(roleRef, { role: role });
        
        console.log(`Successfully assigned role '${role}' to UID: ${uid} in Firestore.`);
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating role for UID ${uid} in Firestore:`, error);
        return { success: false, error: error.message || 'An unexpected error occurred while updating the user role.' };
    }
}

    