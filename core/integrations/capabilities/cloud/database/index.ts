/*
 ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
    path: @/core/integrations/capabilities/cloud/database/index.ts
    author: ???
    version: 1.1
    date: December 11, 2025

    DOCUMENTATION:

 ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
*/

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                              IMPORTS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

// service : {
    import * as FBVendor from "@/core/integrations/vendors/firebase"; import * as Firestore from "firebase/firestore";
// }

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                              BODY
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

let firestore : Firestore.Firestore | null = null;
let initialized : boolean  = false;

export function init() : Firestore.Firestore {
    try{
        firestore = FBVendor.getFirestore();
        initialized = true;

        return firestore;
    } catch( e ) {
        throw new Error('[Database] The service cannot be initialized; ' + `${e instanceof Error ? e.message : String(e)}`);
    }
}

export async function read<T extends Data>( ref: Reference<T> ) : Promise<T | null> {
  ensureInit(`Attempted to read: ${ref.path}`);

  const docRef = Firestore.doc(firestore!, ref.path) as Firestore.DocumentReference<T>;
  const snap = await Firestore.getDoc(docRef);

  if (!snap.exists()) return null;
  return snap.data() as T;
}

export function write<T extends Data>( reference : Reference<T>, data : T) : Promise<void> {
    ensureInit( `Attempted to write: ${reference.path}` );

    const docRef = Firestore.doc( firestore!, reference.path) as Firestore.DocumentReference<T>;
    return Firestore.setDoc(docRef, data);
}

function ensureInit(txt: string) : void {
    if(!initialized || !firestore) {
        throw new Error('[Database] The database has not been initialized ( database.init() ). ' + `${txt}`);
    }
}

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                          PILLARS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

export interface Data extends Firestore.DocumentData {};

export class Reference<T extends Data = Data> {
    constructor(public readonly path: string) {}
}

export class Pointer<T extends Data = Data> {

//  fields : {
        busy : boolean = false;
        reference : Reference<T> | null = null;

//  } constructor : {
        constructor();
        constructor( reference? : Reference<T> ){
            ensureInit("[Database] Attempted to create a database pointer.");

            if (reference !== null) {
                this.busy = true;
                this.reference = reference!;
            }
        }
    
//  } methods : {
        open(reference: Reference<T>) : void {
            if (this.busy) {
                throw new Error("[Pointer] Already busy with another reference. Call close() first.");
            } else {
                this.busy = true;
                this.reference = reference;
            }
        }

        close(): void {
            this.busy = false;
            this.reference = null;
        }

        async write( data : T ) : Promise<void> {
            if (this.busy) {
                const docRef = Firestore.doc(firestore!, this.reference!.path) as Firestore.DocumentReference<T>;
                return Firestore.setDoc(docRef, data);
            } else {
                throw new Error("[Pointer] Attempted to write without a reference. Call open(reference) first.");
            }
        }

        async read() : Promise<T | void> {
            if (this.busy) {
                const docRef = Firestore.doc(firestore!, this.reference!.path) as Firestore.DocumentReference<T>;
                const snap = await Firestore.getDoc(docRef);

                if (snap.exists()) {
                    return snap.data() as T;
                }

            } else {
                throw new Error("[Pointer] Attempted to read without a reference. Call open(reference) first.");
            }
        }

//  }
}