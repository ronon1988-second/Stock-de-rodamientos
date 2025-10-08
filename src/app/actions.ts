
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

export async function setupUserAndRole(uid: string, email: string): Promise<{ success: boolean; error?: string }> {
    if (!uid || !email) {
        return { success: false, error: 'User ID and email are required.' };
    }

    try {
        const { firestore } = getSdks();
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        
        const userRef = doc(firestore, 'users', uid);
        const roleRef = doc(firestore, 'roles', uid);

        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            const userData: Omit<UserProfile, 'id'|'uid'> = {
                email: email,
                displayName: email.split('@')[0] || 'Usuario',
            };
            await setDoc(userRef, userData);
        }

        // Special admin role assignment for the master user.
        // This block runs every time the master user logs in, ensuring claims are set.
        if (email === 'maurofbordon@gmail.com' || uid === 'zqq7dO1wxbgZVcIXSNwRU6DEXqw1') {
            console.log(`>>>>>> SUCCESS: Matched admin user: ${email}. Attempting to set admin claims. <<<<<<`);
            await setDoc(roleRef, { role: 'admin' }, { merge: true });
            await auth.setCustomUserClaims(uid, { admin: true, editor: true });
            console.log(`Force assigned admin role to UID: ${uid}`);
            // Force token refresh on client side after this
            return { success: true };
        } 
        
        // For new non-admin users, check if a role already exists. If not, create an empty one.
        const roleDoc = await getDoc(roleRef);
        if (!roleDoc.exists()) {
            await setDoc(roleRef, {}, { merge: true }); 
        }
        

        return { success: true };
    } catch (error: any) {
        console.error('Error setting up user and role:', error);
        return { success: false, error: error.message || 'An unexpected error occurred while setting up the user.' };
    }
}


/**
 * !! SUPER ADMIN OVERRIDE !!
 * This function is temporarily modified to ALWAYS assign the admin role
 * to the master user, regardless of the input.
 * This is a fail-safe mechanism to grant initial admin access.
 */
export async function updateUserRole(uid: string, role: 'admin' | 'editor'): Promise<{ success: boolean; error?: string }> {
    const MASTER_UID = 'zqq7dO1wxbgZVcIXSNwRU6DEXqw1';
    console.log(`!!!!!! EXECUTING SUPER ADMIN OVERRIDE FOR UID: ${MASTER_UID} !!!!!!`);
    
    try {
        const { firestore } = getSdks();
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);

        const roleRef = doc(firestore, 'roles', MASTER_UID);
        await setDoc(roleRef, { role: 'admin' });

        const claims = { admin: true, editor: true };
        await auth.setCustomUserClaims(MASTER_UID, claims);
        
        console.log('!!!!!! SUPER ADMIN ROLE SUCCESSFULLY ASSIGNED !!!!!!');
        return { success: true };
    } catch (error: any)
     {
        console.error('Error writing SUPER ADMIN role:', error);
        return { success: false, error: error.message || 'An unexpected error occurred while writing the super admin role.' };
    }
}

