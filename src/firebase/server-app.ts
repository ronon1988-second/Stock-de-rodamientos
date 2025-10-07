
import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';

// Define a unique name for the admin app to avoid conflicts.
const appName = 'firebase-admin-app';

/**
 * Creates and initializes the Firebase Admin App instance.
 * It first tries to use a service account from the `FIREBASE_SERVICE_ACCOUNT` environment variable.
 * If that's not available, it falls back to using Application Default Credentials,
 * which is common in many Google Cloud environments.
 * 
 * @returns The initialized Firebase Admin App.
 */
function createAdminApp(): App {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      return initializeApp({
        credential: cert(serviceAccount),
      }, appName);
    } catch (e) {
      console.error(
        "Failed to parse FIREBASE_SERVICE_ACCOUNT. Falling back to default credentials.",
        e
      );
    }
  }
  
  console.log("FIREBASE_SERVICE_ACCOUNT not set. Attempting to use Application Default Credentials.");
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
