// app/lib/firebaseAdmin.ts  (server-only)
import "server-only";

import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import {
  getFirestore,
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";

/*
  Core vs Nodo (NX)
  ----------------
  - getAdminDb()     -> Firestore del tenant (nodo)
  - getCoreAdminDb() -> Firestore del core (NIXINX.org) para licencias CCT

  NOTA:
  - cert() SOLO si hay email+privateKey válidos.
  - Si no, usa applicationDefault() SOLO si existe GOOGLE_APPLICATION_CREDENTIALS.
  - Si no hay nada, lanza error (para que tus callers hagan fallback a Web SDK).
*/

const CORE_APP_NAME = "nixinx-core";

function getDefaultApp(): App | null {
  return getApps().find((a) => a.name === "[DEFAULT]") ?? null;
}

function getCoreApp(): App | null {
  return getApps().find((a) => a.name === CORE_APP_NAME) ?? null;
}

function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0 && v !== "undefined" && v !== "null";
}

function normalizePrivateKey(pk: string) {
  return pk.includes("\\n") ? pk.replace(/\\n/g, "\n") : pk;
}

function resolveCredential(opts: {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}) {
  const { projectId, clientEmail, privateKey } = opts;

  const hasCertCreds = isNonEmpty(clientEmail) && isNonEmpty(privateKey);
  if (hasCertCreds) {
    return cert({
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    });
  }

  const hasAdc = isNonEmpty(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (hasAdc) {
    return applicationDefault();
  }

  // Si llegas aquí, NO hay credenciales utilizables en local.
  // Mejor fallar claro que quedar "admin" y dar UNAUTHENTICATED en runtime.
  throw new Error(
    "firebase-admin: missing credentials. Set FIREBASE_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY OR GOOGLE_APPLICATION_CREDENTIALS."
  );
}

function initTenantApp(): App {
  const existing = getDefaultApp();
  if (existing) return existing;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!isNonEmpty(projectId)) {
    throw new Error("firebase-admin(tenant): missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  }

  const credential = resolveCredential({
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  });

  return initializeApp({ credential, projectId });
}

function initCoreApp(): App {
  const existing = getCoreApp();
  if (existing) return existing;

  // Si no hay env del core, fallback a tenant (dev)
  const projectId =
    process.env.NIXINX_CORE_FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!isNonEmpty(projectId)) {
    throw new Error("firebase-admin(core): missing NIXINX_CORE_FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID)");
  }

  const clientEmail =
    process.env.NIXINX_CORE_FIREBASE_CLIENT_EMAIL ||
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.NIXINX_CORE_FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  const credential = resolveCredential({
    projectId,
    clientEmail,
    privateKey,
  });

  return initializeApp({ credential, projectId }, CORE_APP_NAME);
}

// ──────────────────────────────
// Tenant (Nodo)
// ──────────────────────────────
let tenantAuth: Auth | null = null;
let tenantDb: Firestore | null = null;

export function getAdminAuth() {
  if (tenantAuth) return tenantAuth;
  const app = initTenantApp();
  tenantAuth = getAuth(app);
  return tenantAuth;
}

export function getAdminDb() {
  if (tenantDb) return tenantDb;
  const app = initTenantApp();
  tenantDb = getFirestore(app);
  return tenantDb;
}

// ──────────────────────────────
// Core (Licencias / CCT)
// ──────────────────────────────
let coreAuth: Auth | null = null;
let coreDb: Firestore | null = null;

export function getCoreAdminAuth() {
  if (coreAuth) return coreAuth;
  const app = initCoreApp();
  coreAuth = getAuth(app);
  return coreAuth;
}

export function getCoreAdminDb() {
  if (coreDb) return coreDb;
  const app = initCoreApp();
  coreDb = getFirestore(app);
  return coreDb;
}

/* compat */
export { FieldValue, Timestamp };

// (si tienes imports legacy en otros lados)
export const auth = getAdminAuth();
export const db = getAdminDb();
