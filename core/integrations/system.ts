/*
 ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
    path: @/core/integrations/capabilities/cloud/database/index.ts
    author: ???
    version: 1.0
    date: December 9, 2025

    DOCUMENTATION:

 ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
*/

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                              IMPORTS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

import * as FBVendor from "@/core/integrations/vendors/firebase"; import * as Database from "@/core/integrations/capabilities/cloud/database/index";

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                              IMPORTS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

export const configuration = {
  firebase: {
    general: {
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    
    }, functions: {
      region: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION ?? "us-central1",
    
    }, storage: {
      bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    
    }, auth: {
      domain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    },
  },
};


let FBconfig : FBVendor.Config = {
  apiKey: configuration.firebase.general.apiKey,
  authDomain: configuration.firebase.auth.domain,
  projectId: configuration.firebase.general.projectId,
  storageBucket: configuration.firebase.storage.bucket,
  messagingSenderId: configuration.firebase.general.messagingSenderId,
  appId: configuration.firebase.general.appId,
  measurementId: configuration.firebase.general.measurementId,
}

export function init() : void {

// services : {
  FBVendor.init( FBconfig );

// } capabilities {
  Database.init();

// }  
}