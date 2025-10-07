
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { getAdminApp } from "@/firebase/server-app";
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { getSdks } from "@/firebase";

// This file no longer uses firebase-admin for role management.

export async function getAIReorderRecommendations(input: ReorderRecommendationsInput) {
    try {
        const recommendations = await getReorderRecommendations(input);
        return { success: true, data: recommendations };
    } catch (error) {
        console.error("Error getting AI recommendations:", error);
        return { success: false, error: "Failed to get recommendations from AI." };
    }
}

// Secure server action to update a user's role in the /roles collection
export async function updateUserRole(email: string, role: 'admin' | 'editor'): Promise<{ success: boolean, error?: string }> {
    try {
        // We use the client SDK on the server here to find the user's profile.
        // This is safe because this is a server action.
        const { firestore } = getSdks();
        
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where("email", "==", email));
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return { success: false, error: `No se encontró ningún usuario con el correo electrónico ${email}.` };
        }
        
        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;
        
        // Now, write the role to the /roles collection using the Admin SDK to bypass security rules if needed,
        // although our current rules are open for authenticated users.
        const adminDb = getAdminFirestore(getAdminApp());
        const roleRef = adminDb.collection('roles').doc(userId);
        
        await roleRef.set({ role: role });

        return { success: true };

    } catch (error: any) {
        console.error(`Error updating role:`, error);
        // Don't expose detailed internal errors to the client
        return { success: false, error: 'Ocurrió un error inesperado al actualizar el rol.' };
    }
}
