
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
 * Ensures a user profile exists and sets up their role in Firestore.
 * This is the definitive source of truth for role creation.
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

        // 2. Set Role in Firestore '/roles' collection
        const roleRef = doc(firestore, 'roles', uid);
        const roleDoc = await getDoc(roleRef);

        // Assign admin role only to the master user.
        if (email === 'maurofbordon@gmail.com') {
             console.log(`>>>>>> Matched admin user: ${email}. Setting role in Firestore. <<<<<<`);
             batch.set(roleRef, { role: 'admin' }, { merge: true });
        } else {
            // For any other user, if they don't have a role document, create an empty one.
            // This prevents errors if we try to read it later.
            if (!roleDoc.exists()) {
                batch.set(roleRef, {}); 
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
 * Updates a user's role ONLY in the Firestore 'roles' collection.
 * This is the definitive function for role management.
 */
export async function updateUserRole(uid: string, role: 'admin' | 'editor'): Promise<{ success: boolean; error?: string }> {
    if (!uid || !role) {
        return { success: false, error: 'User ID and role are required.' };
    }

    try {
        const { firestore } = getSdks();
        const roleRef = doc(firestore, 'roles', uid);
        
        // Set the role in the Firestore 'roles' collection
        await setDoc(roleRef, { role: role });
        
        console.log(`Successfully assigned role '${role}' to UID: ${uid} in Firestore.`);
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating role for UID ${uid} in Firestore:`, error);
        return { success: false, error: error.message || 'An unexpected error occurred while updating the user role.' };
    }
}
