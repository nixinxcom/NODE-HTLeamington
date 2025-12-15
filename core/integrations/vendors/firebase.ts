/*
 ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
    path: @/core/integrations/vendors/firebase.ts
    author: ???
    version: 1.0
    date: December 3, 2025

    DOCUMENTATION:
    This Mode operates as a singleton. Its scope deals with Firebase and its services: Firestore, storage, authentication and functions. More precisely,
    it initializes the Firebase App (or gathers it) for the disposal of the system, and provides methods to access its suite (services and configuration).
 ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
*/

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                              IMPORTS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

import * as FBApp from 'firebase/app'; import * as FBFirestore from 'firebase/firestore'; import * as FBStorage from 'firebase/storage';
import * as FBAuth from 'firebase/auth'; import * as FBFunctions from 'firebase/functions'; import * as system from '@/core/integrations/system';

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                              GUIDELINES
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

export interface Config {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                              BODY
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

// singletons : {
    let firebaseApp: FBApp.FirebaseApp | null = null;
    let firestore: FBFirestore.Firestore | null = null;
    let storage: FBStorage.FirebaseStorage | null = null;
    let auth: FBAuth.Auth | null = null;
    let functions: FBFunctions.Functions | null = null;

    let cachedConfig: Config | null = null;
    let initialized = false;

// } main : {
    export function init(config: Config): void {
        if (!initialized) {
            cachedConfig = config;

            if (!firebaseApp) {
                firebaseApp = FBApp.getApps().length ? FBApp.getApp() : FBApp.initializeApp(config);
            }

            setServicesUp(firebaseApp);
            initialized = true;
        }
    }

    export function getApp() : FBApp.FirebaseApp {
        ensureInit("Attempted to get the Firebase app.");
        return firebaseApp!;
    }

    export function getFirestore() : FBFirestore.Firestore {
        ensureInit("Attempted to get the Firebase Firestore.");
        return firestore!;
    }

    export function getFunctions() : FBFunctions.Functions {
        ensureInit("Attempted to get the Firebase Functions.");
        return functions!;
    }

    export function getStorage() : FBStorage.FirebaseStorage {
        ensureInit("Attempted to get the Firebase Storage.");
        return storage!;
    }

    export function getAuth() : FBAuth.Auth {
        ensureInit("Attempted to get the Firebase Authentication.");
        return auth!;
    }

    export function getConfig() : Config {
        ensureInit("Attempted to get the Firebase Configuration");
        return cachedConfig!;
    }

// } helpers : {
    function setServicesUp(app : FBApp.FirebaseApp) : void {

//      firestore : {
            if (typeof window === "undefined") {
                firestore = FBFirestore.getFirestore(app);
            } else {
                try {
                    firestore = FBFirestore.initializeFirestore(app, {ignoreUndefinedProperties: true});
                } catch {
                    firestore = FBFirestore.getFirestore(app);
                }
            }
        
//      } storage : {
            storage = FBStorage.getStorage(app);

//      } authentication : {
            auth = FBAuth.getAuth(app);

//      } functions : {
            functions = FBFunctions.getFunctions(app, system.configuration.firebase.functions.region);
        
//      }
    }

    function ensureInit(txt: string) : void {
        if(!initialized || !firebaseApp) {
            throw new Error(
                '[FirebaseVendor] No Firebase app has been initialized ( firebase.init(config) ). ' + `${txt}`
            );
        }
    }
// }