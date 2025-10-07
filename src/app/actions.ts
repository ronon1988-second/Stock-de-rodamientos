
'use server';

import { getReorderRecommendations, ReorderRecommendationsInput } from "@/ai/flows/reorder-recommendations";
import { getAdminApp } from "@/firebase/server-app";
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


export async function updateUserRoleByEmail(email: string, role: 'admin' | 'editor') {
    try {
        // We can't use the Admin SDK here due to permissions, so we'll use the client SDK
        // This is secure because this is a Server Action, and our Firestore rules
        // will protect the 'roles' collection.
        const { firestore } = getSdks(getAdminApp());

        // 1. Find the user's UID from the 'users' collection based on their email.
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("No se encontró ningún usuario con ese correo electrónico.");
        }

        const userDoc = querySnapshot.docs[0];
        const uid = userDoc.id;

        // 2. Set the role in the 'roles' collection.
        const roleRef = doc(firestore, 'roles', uid);
        await setDoc(roleRef, { role: role });
        
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user role:", error);
        return { success: false, error: error.message || "Ocurrió un error inesperado." };
    }
}

    