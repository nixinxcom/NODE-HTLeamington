// lib/services/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};

// App (una sola vez)
export const Firebase = getApps().length ? getApp() : initializeApp(FirebaseConfig);

// Firestore: inicializa UNA vez. En navegador, usa cache persistente moderna.
// En SSR/Node, devuelve un Firestore sin cache local.
export const FbDB = (() => {
  if (typeof window === "undefined") {
    return getFirestore(Firebase);
  }
  try {
    return initializeFirestore(Firebase, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({}),
      }),
    });
  } catch {
    // Ya estaba inicializado
    return getFirestore(Firebase);
  }
})();

export const FbAuth = getAuth(Firebase);
export const FbStorage = getStorage(Firebase);
export const FbFunct = getFunctions(Firebase, "us-central1");

// Proveedores (si los usas)
export const GoogleProvider = new GoogleAuthProvider();
export const FacebookProvider = new FacebookAuthProvider();

/**
 * Llamar ANTES de escribir (para reglas que requieren auth). En dev, también te sirve para desbloquear lecturas si tus reglas piden request.auth.
 */
export async function ensureAnon(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await setPersistence(FbAuth, browserLocalPersistence);
    if (!FbAuth.currentUser) await signInAnonymously(FbAuth);
  } catch (e) {
    console.warn("[auth] seguimos sin sesión (anónimo falló)", e);
  }
}