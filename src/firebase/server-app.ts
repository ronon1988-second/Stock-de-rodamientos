
import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';
import { config } from 'dotenv';

// Carga las variables de entorno del archivo .env al inicio del proceso del servidor.
// Esto es crucial para que las credenciales estén disponibles tanto en desarrollo como en producción.
config({ path: '.env' });


// Define a unique name for the admin app to avoid conflicts.
const appName = 'firebase-admin-app';

/**
 * Creates and initializes the Firebase Admin App instance.
 * It first tries to use a Base64 encoded service account from environment variables,
 * which is safer for deployment environments like Vercel.
 * If that's not available, it falls back to Application Default Credentials,
 * common in Google Cloud environments like Cloud Workstations.
 * 
 * @returns The initialized Firebase Admin App.
 */
function createAdminApp(): App {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  console.log("SERVER-APP: Checking for FIREBASE_SERVICE_ACCOUNT_BASE64...");

  const appOptions: { projectId: string; credential?: any } = {
    projectId: firebaseConfig.projectId, // Explicitly set the project ID
    credential: applicationDefault(), // Default to ADC
  };

  if (serviceAccountBase64) {
    try {
      console.log("SERVER-APP: Found variable, attempting to decode and initialize...");
      const decodedServiceAccount = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(decodedServiceAccount);
      
      appOptions.credential = cert(serviceAccount);
      // The project ID from the service account is preferred if available
      appOptions.projectId = serviceAccount.project_id || firebaseConfig.projectId;
      
      console.log("SERVER-APP: Successfully configured with Base64 credentials.");

    } catch (e: any) {
      console.error(
        "SERVER-APP: FATAL - Failed to parse Base64 encoded FIREBASE_SERVICE_ACCOUNT. The variable might be malformed. Error:", e.message,
        "Falling back to default credentials."
      );
    }
  } else {
    console.log("SERVER-APP: FIREBASE_SERVICE_ACCOUNT_BASE64 not set. Using Application Default Credentials.");
  }
  
  const app = initializeApp(appOptions, appName);
  
  console.log(`SERVER-APP: Initialized app for project: ${appOptions.projectId}`);
  return app;
}

/**
 * Retrieves the singleton instance of the Firebase Admin App.
 * If the app hasn't been initialized yet, it calls createAdminApp to create it.
 * This prevents re-initialization on every server-side function call.
 * 
 * @returns The singleton Firebase Admin App instance.
 */
export function getAdminApp(): App {
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return existingApp;
  }
  return createAdminApp();
}
