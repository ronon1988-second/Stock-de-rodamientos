
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { getAdminApp } from "@/firebase/server-app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export async function getAIReorderRecommendations(input: ReorderRecommendationsInput) {
    try {
        const recommendations = await getReorderRecommendations(input);
        return { success: true, data: recommendations };
    } catch (error) {
        console.error("Error getting AI recommendations:", error);
        return { success: false, error: "Failed to get recommendations from AI." };
    }
}


export async function updateUserRoleByEmail(email: string, role: 'admin' | 'editor') {
    try {
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        const firestore = getFirestore(adminApp);

        // Find the user by email
        const userRecord = await auth.getUserByEmail(email);
        const uid = userRecord.uid;

        // Set the custom claim on the user's auth token
        const currentClaims = userRecord.customClaims || {};
        const newClaims = {
            ...currentClaims, // Preserve existing claims
            admin: role === 'admin',
            editor: role === 'editor' || role === 'admin', // an admin is always an editor
        };
        await auth.setCustomUserClaims(uid, newClaims);

        return { success: true };
    } catch (error: any) {
        console.error("Error updating user role:", error);
        
        let errorMessage = "Ocurrió un error inesperado.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "No se encontró ningún usuario con ese correo electrónico.";
        } else if (error.code === 'permission-denied') {
            errorMessage = "Permiso denegado. Asegúrese de que la cuenta de servicio tenga los permisos correctos.";
        }
        
        return { success: false, error: errorMessage };
    }
}
