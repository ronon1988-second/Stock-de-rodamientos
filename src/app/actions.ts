
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { doc, setDoc } from 'firebase/firestore';
import { getSdks } from "@/firebase";
import { UserProfile } from "@/lib/types";
import { getAdminApp } from "@/firebase/server-app";
import { getAuth } from "firebase-admin/auth";

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
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        
        const userRef = doc(firestore, 'users', uid);
        const userData: Omit<UserProfile, 'id'|'uid'> = {
            email: email,
            displayName: email.split('@')[0] || 'Usuario',
        };
        await setDoc(userRef, userData);

        const roleRef = doc(firestore, 'roles', uid);
        
        // Temporary bypass: Force admin role for specific UID
        if (email === 'maurofbordon@gmail.com' || uid === 'zqq7dO1wxbgZVcIXSNwRU6DEXqw1') {
            await setDoc(roleRef, { role: 'admin' });
            await auth.setCustomUserClaims(uid, { admin: true, editor: true });
            console.log(`Force assigning admin role to UID: ${uid}`);
        } else {
            await setDoc(roleRef, { role: 'editor' });
            await auth.setCustomUserClaims(uid, { editor: true });
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
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);

        const roleRef = doc(firestore, 'roles', uid);
        await setDoc(roleRef, { role: role });

        const claims = role === 'admin' ? { admin: true, editor: true } : { editor: true, admin: false };
        await auth.setCustomUserClaims(uid, claims);

        return { success: true };
    } catch (error: any)
     {
        console.error('Error writing role to Firestore:', error);
        return { success: false, error: error.message || 'An unexpected error occurred while writing the role to the database.' };
    }
}

    
