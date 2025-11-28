// app/lib/firebaseAdmin.ts  (server-only)
import 'server-only';
import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';

let app: App;
if (getApps().length) {
  app = getApps()[0]!;
} else {
  // Si hay credenciales explícitas en env -> cert(); si no -> ADC (applicationDefault)
  const hasExplicitCreds =
    Boolean(process.env.FIREBASE_PRIVATE_KEY) ||
    Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
    Boolean(process.env.FIREBASE_CLIENT_EMAIL);

  app = initializeApp({
    credential: hasExplicitCreds
      ? cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        })
      : applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const adminAuth: Auth = getAuth(app);
const adminDb: Firestore = getFirestore(app);

/* ===== Exports principales (los que ya usabas) ===== */
export function getAdminAuth() {
  return adminAuth;
}
export function getAdminDb() {
  return adminDb;
}
export { FieldValue, Timestamp };

/* ===== Aliases de compatibilidad (ADITIVOS) =====
   Para código existente que hace:
     import { db, FieldValue } from '@/app/lib/firebaseAdmin';
*/
export const auth = adminAuth;
export const db = adminDb;