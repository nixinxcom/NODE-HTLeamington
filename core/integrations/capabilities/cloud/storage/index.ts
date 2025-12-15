// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                              IMPORTS
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

import * as FBVendor from '@/core/integrations/vendors/firebase'; import * as Storage from 'firebase/storage';

// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
//                                                                              BODY
// ———————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————


let storage : Storage.FirebaseStorage | null = null;
let initialized : boolean = false;

export function init() {
    storage = FBVendor.getStorage()
    initialized = true;
}

function ensureInit(txt : string) {
    if(!initialized || !storage) {
        throw new Error('[Storage] The storage has not been initialized ( storage.init() ). ' + `${txt}`);
    }
}

export class Reference {
    reference :Storage.StorageReference | null = null;

    constructor( reference : string ) {
        ensureInit("[Reference] Attempted to create a storage reference.")

        this.reference = Storage.ref(storage!, reference);
    }

    toString() : string {
        return this.reference?.toString()!;
    }
}

export class Pointer {
    reference : Reference | null = null;
    busy : boolean = false;

    constructor();
    constructor(reference? : Reference) {
        ensureInit("[Pointer] Attempted to create a storage pointer.");

        if (reference !== null) {
            this.busy = true;
            this.reference = reference!;
        }
    }
    
    open( reference : Reference ) : void {
        if (this.busy) {
            throw new Error("[Pointer] Already busy with another reference. Call close() first.");
        }
        this.reference = reference;
    }

    close() : void {
        this.busy = false;
        this.reference = null;
    }

    async locate() : Promise<string> {
        if( this.busy ) {
            return Storage.getDownloadURL( this.reference?.reference! );
        } else {
            throw new Error( "[Pointer] Attempted to locate without a reference." );
        }
    }

    async upload( data : Blob | Uint8Array | ArrayBuffer, metadata : Storage.UploadMetadata ) : Promise<void> {
        Storage.uploadBytes( this.reference?.reference!, data);
    }
}