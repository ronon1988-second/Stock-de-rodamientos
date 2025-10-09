
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { getAdminApp } from "@/firebase/server-app";
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
 * This function is idempotent and safe to call on every login.
 */
export async function setupUserAndRole(uid: string, email: string | null): Promise<{ success: boolean; error?: string }> {
    if (!uid || !email) {
        return { success: false, error: 'User ID and email are required.' };
    }

    const adminApp = getAdminApp();
    const adminFirestore = getAdminFirestore(adminApp);
    const userRef = adminFirestore.collection('users').doc(uid);

    try {
        const userDoc = await userRef.get();

        // If the user document already exists, we assume everything is set up.
        if (userDoc.exists) {
            console.log(`User profile for ${email} already exists. Skipping setup.`);
            return { success: true };
        }

        // If the document does not exist, it's a new user. Let's create everything.
        console.log(`New user: ${email}. Setting up profile and role.`);

        const adminAuth = getAdminAuth(adminApp);
        const roleRef = adminFirestore.collection('roles').doc(uid);
        
        let role: 'admin' | 'user' = 'user';
        
        // Determine role and set custom claims if they are the designated admin.
        if (email === 'maurofbordon@gmail.com') {
            role = 'admin';
            try {
                await adminAuth.setCustomUserClaims(uid, { admin: true });
                console.log(`Successfully set custom claim 'admin:true' for UID: ${uid}`);
            } catch (claimError) {
                console.error("Error setting custom claim:", claimError);
                // We will still proceed to create the user docs.
            }
        }

        const displayName = email.split('@')[0] || `user_${uid.substring(0, 5)}`;
        const userData: Omit<UserProfile, 'id' | 'uid'> = {
            email: email,
            displayName: displayName,
        };

        // Use a single batch to create both documents atomically.
        const batch = adminFirestore.batch();
        batch.create(userRef, { uid, ...userData }); // Use create to ensure it only happens once.
        batch.create(roleRef, { role });
        
        await batch.commit();

        console.log(`Successfully created user profile and role for ${email}`);
        return { success: true };

    } catch (error: any) {
        // This specific error code means a `create` operation failed because the document already exists.
        // This can happen in a race condition. We can safely consider this a success.
        if (error.code === 'ALREADY_EXISTS' || error.code === 6) {
            console.warn(`User setup for ${uid} was likely completed by a concurrent process. Considering it a success.`, error.message);
            return { success: true }; 
        }
        
        console.error('Error in setupUserAndRole:', error);
        return { success: false, error: error.message || 'An unexpected error occurred during user setup.' };
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
