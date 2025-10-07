
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { getFirestore } from "firebase-admin/firestore";
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
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


export async function updateUserRole(uid: string, role: 'admin' | 'editor') {
    try {
        // We use the client SDK here because this is a Server Action and our Firestore rules
        // will protect the 'roles' collection.
        // This avoids using the Admin SDK which requires special permissions.
        const { firestore } = getSdks();

        const roleRef = doc(firestore, 'roles', uid);
        await setDoc(roleRef, { role: role });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { success: false, error: error.message || "Ocurrió un error inesperado." };
    }
}

    
