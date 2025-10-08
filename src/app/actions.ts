
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { doc, setDoc, getDoc } from 'firebase/firestore';
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

export async function setupUserAndRole(uid: string, email: string | null): Promise<{ success: boolean; error?: string }> {
    if (!uid || !email) {
        return { success: false, error: 'User ID and email are required.' };
    }

    try {
        const { firestore } = getSdks();
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        
        const userRef = doc(firestore, 'users', uid);
        const roleRef = doc(firestore, 'roles', uid);

        // Always ensure the user document exists or is created.
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            const userData: Omit<UserProfile, 'id'|'uid'> = {
                email: email,
                displayName: email.split('@')[0] || 'Usuario',
            };
            await setDoc(userRef, userData);
        }

        // Special admin role assignment for the master user.
        // This block runs every time the master user logs in.
        if (email === 'maurofbordon@gmail.com') {
            console.log(`>>>>>> Matched admin user: ${email}. Attempting to set admin claims. <<<<<<`);
            await setDoc(roleRef, { role: 'admin' }, { merge: true });
            await auth.setCustomUserClaims(uid, { admin: true, editor: true });
            console.log(`>>>>>> Successfully assigned admin claims to UID: ${uid} <<<<<<`);
        } else {
            // For new non-admin users, ensure a role document exists but without specific roles.
            const roleDoc = await getDoc(roleRef);
            if (!roleDoc.exists()) {
                await setDoc(roleRef, {}, { merge: true }); 
            }
        }
        
        return { success: true };
    } catch (error: any) {
        console.error('Error setting up user and role:', error);
        return { success: false, error: error.message || 'An unexpected error occurred while setting up the user.' };
    }
}


/**
 * Updates a user's role and sets the corresponding custom claims in Firebase Auth.
 * This is the definitive function for role management.
 */
export async function updateUserRole(uid: string, role: 'admin' | 'editor'): Promise<{ success: boolean; error?: string }> {
    if (!uid || !role) {
        return { success: false, error: 'User ID and role are required.' };
    }

    try {
        const { firestore } = getSdks();
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);

        // Set the role in the Firestore 'roles' collection
        const roleRef = doc(firestore, 'roles', uid);
        await setDoc(roleRef, { role: role });

        // Set the custom claims in Firebase Auth
        const claims = {
            admin: role === 'admin',
            editor: role === 'admin' || role === 'editor',
        };
        await auth.setCustomUserClaims(uid, claims);
        
        console.log(`Successfully assigned role '${role}' to UID: ${uid}`);
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating role for UID ${uid}:`, error);
        return { success: false, error: error.message || 'An unexpected error occurred while updating the user role.' };
    }
}

