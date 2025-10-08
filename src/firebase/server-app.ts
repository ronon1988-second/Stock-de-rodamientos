
import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';

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

  // DEBUG: Log the first 10 characters of the env var to see if it's being loaded.
  console.log("SERVER-APP: Checking for FIREBASE_SERVICE_ACCOUNT_BASE64. Found first 10 chars:", serviceAccountBase64?.substring(0, 10));

  if (serviceAccountBase64) {
    try {
      // Decode the Base64 string to a JSON string
      const decodedServiceAccount = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(decodedServiceAccount);
      console.log("Initializing Firebase Admin SDK with Base64 service account...");
      
      // Explicitly pass the projectId from the service account to avoid environment detection issues.
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      }, appName);

    } catch (e: any) {
      console.error(
        "Failed to parse Base64 encoded FIREBASE_SERVICE_ACCOUNT. Error:", e.message,
        "Falling back to default credentials."
      );
    }
  }
  
  console.log("FIREBASE_SERVICE_ACCOUNT_BASE64 not set or failed to parse. Attempting to use Application Default Credentials.");
  return initializeApp({
    credential: applicationDefault(),
  }, appName);
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
