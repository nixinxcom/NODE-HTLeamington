// complements/factory/fui.crud.ts
// CRUD de PanelSchemas para la Factory UI (FUI)
// Se guarda SOLO como metadata de diseño en Firestore (colección "FactorySchemas").
// La versión "oficial" para NPM / PUI sigue siendo el .schema.ts en panelSchemas.

'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

import { FbDB } from '@/app/lib/services/firebase';
import type {
  PanelSchema,
  PanelSchemaSource,
  PanelSchemaStage,
} from './panelSchema.types';

/**
 * Colección interna del FUI.
 * No tiene nada que ver con Providers/Admin de la FDV.
 */
const FUI_COLLECTION = 'FactorySchemas';

/** Tipo resumido para listar esquemas en el panel del FUI */
export type FuiSchemaSummary = {
  id: string;
  labelKey: string;
  fsCollection: string;
  fsDocId: string;
  isProvider: boolean;
  version?: number;
  source: PanelSchemaSource;
  stage: PanelSchemaStage;
};

/**
 * Normaliza el objeto antes de guardarlo:
 * - quita propiedades undefined
 * - garantiza que id/docId sean strings simples
 * - pone defaults para source/stage
 */
function normalizeSchema(schema: PanelSchema): PanelSchema {
  const cleanFields = schema.fields.map((f) => {
    const base: any = { ...f };

    // Limpieza básica de undefined para que Firestore no se llene de basura
    Object.keys(base).forEach((k) => {
      if (base[k] === undefined) delete base[k];
    });

    return base;
  });

  const baseId = String(schema.id || '').trim();

  const clean: PanelSchema = {
    ...schema,
    id: baseId,
    labelKey: String(schema.labelKey || baseId).trim(),
    fsCollection: String(schema.fsCollection || '').trim(),
    fsDocId: String(schema.fsDocId || baseId).trim() || baseId,

    // 🔽 defaults para schemas creados por el FUI
    source: schema.source ?? 'factory',
    stage: schema.stage ?? 'draft',

    isProvider: !!schema.isProvider,
    access: {
      allowedRoles: schema.access?.allowedRoles?.length
        ? [...schema.access.allowedRoles]
        : ['superadmin'],
    },
    fields: cleanFields,
    version: schema.version,
  };

  // Limpieza de undefined en root
  (Object.keys(clean) as (keyof PanelSchema)[]).forEach((k) => {
    if ((clean as any)[k] === undefined) {
      delete (clean as any)[k];
    }
  });

  return clean;
}

/** Lista todos los schemas guardados por el FUI */
export async function fuiListSchemas(): Promise<FuiSchemaSummary[]> {
  const colRef = collection(FbDB, FUI_COLLECTION);
  const snap = await getDocs(colRef);

  const out: FuiSchemaSummary[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as PanelSchema;
    const id = data.id || docSnap.id;

    out.push({
      id,
      labelKey: data.labelKey || id,
      fsCollection: data.fsCollection || 'Providers',
      fsDocId: data.fsDocId || id,
      isProvider: !!data.isProvider,
      version: data.version,
      source: data.source ?? 'factory',
      stage: data.stage ?? 'draft',
    });
  });

  // Orden alfabético por id para que no sea caótico
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

/** Carga un schema completo desde Firestore por id */
export async function fuiLoadSchema(id: string): Promise<PanelSchema | null> {
  const cleanId = String(id || '').trim();
  if (!cleanId) return null;

  const ref = doc(FbDB, FUI_COLLECTION, cleanId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as PanelSchema;

  // Nos aseguramos de que id y fsDocId estén alineados y defaults de source/stage
  return {
    ...data,
    id: data.id || cleanId,
    fsDocId: data.fsDocId || data.id || cleanId,
    source: data.source ?? 'factory',
    stage: data.stage ?? 'draft',
  };
}

/** Guarda (crea/actualiza) un schema del FUI */
export async function fuiSaveSchema(schema: PanelSchema): Promise<void> {
  const normalized = normalizeSchema(schema);
  const docId = normalized.id;
  if (!docId) {
    throw new Error('[FUI CRUD] No se puede guardar un schema sin id');
  }

  const ref = doc(FbDB, FUI_COLLECTION, docId);

  // merge:true para no perder cosas si luego metes meta extra
  await setDoc(ref, normalized, { merge: true });
}

/** Elimina un esquema del FUI por id */
export async function fuiDeleteSchema(id: string): Promise<void> {
  const cleanId = String(id || '').trim();
  if (!cleanId) return;

  const ref = doc(FbDB, FUI_COLLECTION, cleanId);
  await deleteDoc(ref);
}
