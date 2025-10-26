// app/lib/admin.server.ts
import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function init() {
  if (!getApps().length) {
    const hasSa = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    initializeApp({
      // Si definiste FIREBASE_SERVICE_ACCOUNT_KEY (JSON string), úsalo;
      // de lo contrario intenta Application Default Credentials (ADC).
      credential: hasSa
        ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string))
        : applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // opcional pero recomendable
    });
  }
}

export function adminAuth() {
  init();
  return getAuth();
}

export function adminDb() {
  init();
  return getFirestore();
}
