import { FbDB } from "../../app/lib/services/firebase";
import { doc, setDoc, collection, addDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

interface iDocument {
    Dcto?: Record<string, any>, // Datos del documento
    Id?: string,               // Id opcional para create
    Fields?: Partial<Record<string, any>>,  // Campos para update parcial
}

interface iCRUD {
    CRUD: 'create' | 'retrieve' | 'update' | 'replace' | 'delete' | 'remove';
    Collection: string;
    Documents?: Array<iDocument>; // Opcional porque en retrieve no siempre es necesario
    DBQuery?: () => Promise<Array<string>>; // Función para el query de documentos
}

async function UseFirestoreFunc({CRUD, Collection, Documents, DBQuery}: iCRUD) {
    try {
        switch (CRUD) {
            case 'create':
                if (Documents) {
                    for (const docData of Documents) {
                        const { Dcto, Id } = docData;
                        if (Id) {
                            await setDoc(doc(FbDB, Collection, Id), {
                                ...Dcto,
                                createdAt: serverTimestamp(),
                            });
                        } else {
                            await addDoc(collection(FbDB, Collection), {
                                ...Dcto,
                                createdAt: serverTimestamp(),
                            });
                        }
                    }
                }
                break;

            case 'retrieve':
                if (Documents && Documents.length > 0) {
                    // Si hay documentos específicos
                    for (const { Id } of Documents) {
                        if (Id) {
                            const docRef = doc(FbDB, Collection, Id);
                            const docSnap = await getDoc(docRef);
                            if (docSnap.exists()) {
                                // console.log("Document data:", docSnap.data());
                                return docSnap.data();
                            } else {
                                console.log("No such document!");
                            }
                        }
                    }
                } else if (DBQuery) {
                    // Si no hay documentos específicos, ejecutamos DBQuery
                    const documentIds = await DBQuery(); // Obtener IDs con la función DBQuery
                    for (const Id of documentIds) {
                        const docRef = doc(FbDB, Collection, Id);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            // console.log("Document data:", docSnap.data());
                            return docSnap.data();
                        } else {
                            console.log("No such document!");
                        }
                    }
                } else if(!Documents && !DBQuery){
                    // Si no hay documentos ni DBQuery, obtener todos los documentos de la colección
                    const querySnapshot = await getDocs(collection(FbDB, Collection));
                    const customers: Array<any> = []; // Aquí puedes definir una interfaz más específica si lo deseas
                    querySnapshot.forEach((doc) => {
                        customers.push({ id: doc.id, ...doc.data() }); // Agrega el ID del documento y los datos
                    });
                    // console.log("All documents in collection:", customers);
                    return customers
                } else {
                    console.error("No Documents, DBQuery or Valid Collection");
                }
                break;

            case 'update':
                if (Documents) {
                    for (const { Id, Fields } of Documents) {
                        if (Id && Fields) {
                            const docRef = doc(FbDB, Collection, Id);
                            await updateDoc(docRef, {
                                ...Fields,
                                updatedAt: serverTimestamp(),
                            });
                        }
                    }
                }
                break;

            case 'replace':
                if (Documents) {
                    for (const { Id, Dcto } of Documents) {
                        if (Id && Dcto) {
                            const docRef = doc(FbDB, Collection, Id);
                            await setDoc(docRef, {
                                ...Dcto,
                                updatedAt: serverTimestamp(),
                            });
                        }
                    }
                }
                break;

            case 'delete':
                if (Documents) {
                    for (const { Id } of Documents) {
                        if (Id) {
                            const docRef = doc(FbDB, Collection, Id);
                            await deleteDoc(docRef);
                        }
                    }
                }
                break;

            case 'remove':
                if (Documents) {
                    for (const { Id, Fields } of Documents) {
                        if (Id && Fields) {
                            const docRef = doc(FbDB, Collection, Id);
                            await updateDoc(docRef, {
                                ...Fields,
                                removedAt: serverTimestamp(),
                            });
                        }
                    }
                }
                break;

            default:
                console.error("Invalid CRUD action");
                break;
        }
    } catch (error) {
        console.error('Error in Firestore operation:', error);
    }
}


interface iQueryCriteria {
    field: string;    // Campo del documento
    operator: "<" | "<=" | "==" | ">" | ">=" | "!=" | "array-contains" | "array-contains-any" | "in" | "not-in";
    value: any;       // Valor para comparar
}

// Funcion de querys para firestore

async function FirestoreQueryFunc(Collection: string, criteria: iQueryCriteria[]): Promise<Array<string>> {
    try {
        console.log(Collection, criteria)
        let collectionRef = collection(FbDB, Collection);
        if (!criteria || criteria.length === 0) {
            const querySnapshot = await getDocs(collectionRef);
            const documentIds = querySnapshot.docs.map((doc) => doc.id);
            return documentIds;
        } else {
            let q = query(collectionRef);
            criteria.forEach(({ field, operator, value }) => {
                q = query(q, where(field, operator, value));
            });
            const querySnapshot = await getDocs(q);
            const documentIds = querySnapshot.docs.map((doc) => doc.id);
            return documentIds;
        }
    } catch (error) {
        console.error("Error en el query de Firestore:", error);
        return [];
    }
}

export { UseFirestoreFunc, FirestoreQueryFunc }
