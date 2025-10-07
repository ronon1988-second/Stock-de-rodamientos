
import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';

const appName = 'firebase-admin-app';

function createAdminApp(): App {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

  // Use service account from environment variable if available
  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      return initializeApp({
        credential: cert(serviceAccount),
      }, appName);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Falling back to default credentials.", e);
    }
  }
  
  // Otherwise, fall back to Application Default Credentials
  // This works in many GCP environments, including Firebase Studio (Workstations)
  console.log("FIREBASE_SERVICE_ACCOUNT not set. Attempting to use Application Default Credentials.");
  return initializeApp({
    credential: applicationDefault(),
  }, appName);
}

export function getAdminApp(): App {
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return existingApp;
  }
  return createAdminApp();
}
