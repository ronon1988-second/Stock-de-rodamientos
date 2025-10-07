
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from "@/firebase/server-app";
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
 * This function now receives a UID directly and writes to Firestore.
 */
export async function updateUserRole(userId: string, role: 'admin' | 'editor'): Promise<{ success: boolean, error?: string }> {
    if (!userId || !role) {
        return { success: false, error: 'Se requieren el ID de usuario y el rol.' };
    }
    try {
        // We can't use the Admin SDK, so we use the regular server-side SDK.
        // This relies on the security rules allowing the write.
        // The rule is "allow write: if request.auth != null;", so this will work.
        const { firestore } = getSdks();
        const roleRef = doc(firestore, 'roles', userId);
        
        await setDoc(roleRef, { role: role });

        return { success: true };

    } catch (error: any) {
        console.error(`Error updating role in Firestore:`, error);
        // Do not expose detailed internal errors to the client
        return { success: false, error: 'Ocurrió un error inesperado al escribir el rol en la base de datos.' };
    }
}


