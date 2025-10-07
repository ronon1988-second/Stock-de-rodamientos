
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { doc, setDoc } from 'firebase/firestore';
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

export async function setupUserAndRole(uid: string, email: string): Promise<{ success: boolean; error?: string }> {
    if (!uid || !email) {
        return { success: false, error: 'User ID and email are required.' };
    }

    try {
        const { firestore } = getSdks();
        
        // 1. Create user profile document
        const userRef = doc(firestore, 'users', uid);
        const userData: Omit<UserProfile, 'id'> = {
            uid: uid,
            email: email,
            displayName: email.split('@')[0] || 'Usuario',
        };
        await setDoc(userRef, userData);

        // 2. Create default role document
        const roleRef = doc(firestore, 'roles', uid);
        // Special case for master user
        if (email === 'maurofbordon@gmail.com') {
            await setDoc(roleRef, { role: 'admin' });
        } else {
            await setDoc(roleRef, { role: 'editor' });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error setting up user and role:', error);
        return { success: false, error: error.message || 'An unexpected error occurred while setting up the user.' };
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

    