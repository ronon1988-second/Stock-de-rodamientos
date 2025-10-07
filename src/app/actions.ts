
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { doc, getDocs, query, setDoc, where, collection } from 'firebase/firestore';
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

export async function updateUserRole(uid: string, role: 'admin' | 'editor'): Promise<{ success: boolean; error?: string }> {
    if (!uid || !role) {
        return { success: false, error: 'User ID and role are required.' };
    }

    try {
        const { firestore } = getSdks();
        const roleRef = doc(firestore, 'roles', uid);
        await setDoc(roleRef, { role: role });

        return { success: true };
    } catch (error: any) {
        console.error('Error writing role to Firestore:', error);
        return { success: false, error: error.message || 'An unexpected error occurred while writing the role to the database.' };
    }
}

    