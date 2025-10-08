
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { getAdminApp } from "@/firebase/server-app";
import { getFirestore as getClientFirestore } from 'firebase/firestore';
import { getSdks } from "@/firebase/client-provider";
import { UserProfile } from "@/lib/types";
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';


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
 * It also sets the custom claim for the admin user.
 */
export async function setupUserAndRole(uid: string, email: string | null): Promise<{ success: boolean; error?: string }> {
    if (!uid || !email) {
        return { success: false, error: 'User ID and email are required.' };
    }

    try {
        // This action can be called from client components, so we use the client SDKs here for writes.
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

        if (!roleDoc.exists()) {
            if (email === 'maurofbordon@gmail.com') {
                console.log(`>>>>>> Matched admin user: ${email}. Setting role in Firestore. <<<<<<`);
                batch.set(roleRef, { role: 'admin' });
                
                // Set custom claim for admin user using Admin SDK
                try {
                    const adminApp = getAdminApp();
                    const adminAuth = getAdminAuth(adminApp);
                    await adminAuth.setCustomUserClaims(uid, { admin: true });
                    console.log(`>>>>>> Successfully set custom claim 'admin:true' for UID: ${uid} <<<<<<`);
                } catch (claimError) {
                    console.error("Error setting custom claim:", claimError);
                    // Don't fail the whole operation, but log the error.
                }

            } else {
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
 * Updates a user's role in the Firestore 'roles' collection and their custom claims using the Admin SDK.
 * This function is designed to be called from the server.
 */
export async function updateUserRole(uid: string, role: 'admin' | 'editor'): Promise<{ success: boolean; error?: string }> {
    if (!uid || !role) {
        return { success: false, error: 'User ID and role are required.' };
    }

    try {
        const adminApp = getAdminApp();
        const adminAuth = getAdminAuth(adminApp);
        const adminFirestore = getAdminFirestore(adminApp);
        
        // Step 1: Update the role in the Firestore 'roles' collection using Admin SDK
        const roleRef = adminFirestore.collection('roles').doc(uid);
        await roleRef.set({ role: role }, { merge: true });
        console.log(`(Admin) Successfully assigned role '${role}' to UID: ${uid} in Firestore.`);

        // Step 2: Update the custom claims in Firebase Auth using Admin SDK
        const claims = role === 'admin' ? { admin: true, editor: false } : { editor: true, admin: false };
        await adminAuth.setCustomUserClaims(uid, claims);
        console.log(`(Admin) Successfully set custom claims for UID: ${uid}`, claims);

        return { success: true };
    } catch (error: any) {
        console.error(`Error updating role for UID ${uid}:`, error);
        return { success: false, error: error.message || 'An unexpected error occurred while updating the user role.' };
    }
}
