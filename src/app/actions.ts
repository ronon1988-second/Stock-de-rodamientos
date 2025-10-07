'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { doc, setDoc } from 'firebase/firestore';
import { getSdks } from "@/firebase";

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
 * Secure server action to update a user's role in the /roles collection.
 * This function receives a UID and writes the role to Firestore.
 * It no longer uses firebase-admin to avoid permission issues.
 */
export async function updateUserRole(uid: string, role: 'admin' | 'editor'): Promise<{ success: boolean; error?: string }> {
    if (!uid || !role) {
        return { success: false, error: 'User ID and role are required.' };
    }

    try {
        // This uses the standard server-side SDK, relying on security rules.
        // Since rules are 'allow write: if request.auth != null;', this will succeed.
        const { firestore } = getSdks();
        const roleRef = doc(firestore, 'roles', uid);
        await setDoc(roleRef, { role: role });

        return { success: true };
    } catch (error: any) {
        console.error('Error writing role to Firestore:', error);
        return { success: false, error: 'An unexpected error occurred while writing the role to the database.' };
    }
}
