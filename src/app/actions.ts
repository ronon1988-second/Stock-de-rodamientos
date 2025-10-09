
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { getAdminApp } from "@/firebase/server-app";
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
 * It now uses the Admin SDK for all writes to ensure permissions.
 */
export async function setupUserAndRole(uid: string, email: string | null): Promise<{ success: boolean; error?: string }> {
    if (!uid || !email) {
        return { success: false, error: 'User ID and email are required.' };
    }

    try {
        const adminApp = getAdminApp();
        const adminAuth = getAdminAuth(adminApp);
        const adminFirestore = getAdminFirestore(adminApp);

        // Batch writes using the Admin SDK
        const batch = adminFirestore.batch();

        // 1. Ensure User Profile Document Exists
        const userRef = adminFirestore.collection('users').doc(uid);
        const userDoc = await userRef.get();

        // Use a default display name if the email part is empty
        const displayName = email.split('@')[0] || `user_${uid.substring(0, 5)}`;
        
        if (!userDoc.exists) {
            const userData: Omit<UserProfile, 'id' | 'uid'> = {
                email: email,
                displayName: displayName,
            };
            batch.set(userRef, { uid, ...userData });
        }

        // 2. Set Role in Firestore '/roles' collection
        const roleRef = adminFirestore.collection('roles').doc(uid);
        const roleDoc = await roleRef.get();

        if (!roleDoc.exists) {
            let role: 'admin' | 'user' = 'user';
            if (email === 'maurofbordon@gmail.com') {
                console.log(`>>>>>> Matched admin user: ${email}. Setting role in Firestore. <<<<<<`);
                role = 'admin';
                
                // Set custom claim for admin user using Admin SDK
                try {
                    await adminAuth.setCustomUserClaims(uid, { admin: true });
                    console.log(`>>>>>> Successfully set custom claim 'admin:true' for UID: ${uid} <<<<<<`);
                } catch (claimError) {
                    console.error("Error setting custom claim:", claimError);
                    // Don't fail the whole operation, but log the error.
                }
            }
             batch.set(roleRef, { role: role });
        }
        
        await batch.commit();
        console.log(`Successfully set up user profile and role for ${email}`);
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
export async function updateUserRole(uid: string, role: 'admin' | 'editor' | 'user'): Promise<{ success: boolean; error?: string }> {
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
        const claims = {
            admin: role === 'admin',
            editor: role === 'editor',
        };
        await adminAuth.setCustomUserClaims(uid, claims);
        console.log(`(Admin) Successfully set custom claims for UID: ${uid}`, claims);

        return { success: true };
    } catch (error: any) {
        console.error(`Error updating role for UID ${uid}:`, error);
        return { success: false, error: error.message || 'An unexpected error occurred while updating the user role.' };
    }
}


export async function deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
    if (!uid) {
        return { success: false, error: 'User ID is required.' };
    }

    try {
        const adminApp = getAdminApp();
        const adminAuth = getAdminAuth(adminApp);
        const adminFirestore = getAdminFirestore(adminApp);

        // Step 1: Delete user from Firebase Authentication
        await adminAuth.deleteUser(uid);
        console.log(`(Admin) Successfully deleted user with UID: ${uid} from Authentication.`);

        // Step 2: Delete user documents from Firestore in a batch
        const batch = adminFirestore.batch();
        const userRef = adminFirestore.collection('users').doc(uid);
        const roleRef = adminFirestore.collection('roles').doc(uid);
        
        batch.delete(userRef);
        batch.delete(roleRef);
        
        await batch.commit();
        console.log(`(Admin) Successfully deleted user data for UID: ${uid} from Firestore.`);

        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting user with UID ${uid}:`, error);
        return { success: false, error: error.message || 'An unexpected error occurred while deleting the user.' };
    }
}
