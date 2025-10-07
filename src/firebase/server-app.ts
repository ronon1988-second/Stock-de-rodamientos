
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

const appName = 'firebase-admin-app';

function createAdminApp(): App {
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
  }

  return initializeApp({
    credential: cert(serviceAccount),
  }, appName);
}

export function getAdminApp(): App {
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return existingApp;
  }
  return createAdminApp();
}
