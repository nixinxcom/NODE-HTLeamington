// app/lib/googleProfileSync.ts
import "server-only";

import { google } from "googleapis";
import type iBranding from "@/app/lib/branding/interface";
import { lat, lng } from "@/app/lib/branding/interface";
import { getAdminDb } from "@/app/lib/firebaseAdmin";

/**
 * iBranding con todo serializable (sin JSX)
 */
type BrandingFS = iBranding<string>;

/**
 * DeepPartial para poder mandar solo pedacitos del árbol
 * sin que TypeScript se queje con company/contact/etc.
 */
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[K] extends object
    ? DeepPartial<T[K]>
    : T[K];
};

type BrandingFSUpdate = DeepPartial<BrandingFS>;

/**
 * ENV:
 *  - NEXT_PUBLIC_GBP_LOCATION_NAME  -> "locations/{location_id}"
 *  - NEXT_PUBLIC_BRANDING_DOC_PATH  -> ruta del doc de branding en FS
 */
const GBP_LOCATION_NAME = process.env.NEXT_PUBLIC_GBP_LOCATION_NAME;
const BRANDING_DOC_PATH = process.env.NEXT_PUBLIC_BRANDING_DOC_PATH;

if (!GBP_LOCATION_NAME) {
  console.warn(
    '[googleProfileSync] Falta NEXT_PUBLIC_GBP_LOCATION_NAME (debe ser "locations/{location_id}")'
  );
}
if (!BRANDING_DOC_PATH) {
  console.warn(
    "[googleProfileSync] Falta NEXT_PUBLIC_BRANDING_DOC_PATH (ruta del doc de branding en Firestore)"
  );
}

/**
 * Scopes y helper para crear el cliente de Google Business Profile
 * usando credenciales explícitas:
 *
 * 1) Si existe GOOGLE_APPLICATION_CREDENTIALS => GoogleAuth normal
 * 2) Si no, reutiliza FIREBASE_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY
 */
const GBP_SCOPES = ["https://www.googleapis.com/auth/business.manage"];

function createMyBusinessInfoClient() {
  let auth: any;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Usar ADC si está configurado (gcloud, JSON en disco, etc.)
    auth = new google.auth.GoogleAuth({
      scopes: GBP_SCOPES,
    });
  } else if (
    process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  ) {
    // Reutilizar service account de Firebase Admin
    const privateKey = process
      .env
      .FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n");

    auth = new google.auth.JWT({
      email: process.env.FIREBASE_CLIENT_EMAIL,
      key: privateKey,
      scopes: GBP_SCOPES,
    });
  } else {
    throw new Error(
      "[googleProfileSync] No hay credenciales de Google: define GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_ADMIN_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL"
    );
  }

  return google.mybusinessbusinessinformation({
    version: "v1",
    auth,
  });
}

/**
 * Convierte regularHours de GBP a iBranding.schedule
 */
function mapBusinessHoursToSchedule(
  regularHours: any
): BrandingFS["schedule"] {
  const base: BrandingFS["schedule"] = [
    { day: "monday", open: null, close: null, closed: true },
    { day: "tuesday", open: null, close: null, closed: true },
    { day: "wednesday", open: null, close: null, closed: true },
    { day: "thursday", open: null, close: null, closed: true },
    { day: "friday", open: null, close: null, closed: true },
    { day: "saturday", open: null, close: null, closed: true },
    { day: "sunday", open: null, close: null, closed: true },
  ];

  if (!regularHours?.periods || !Array.isArray(regularHours.periods)) {
    return base;
  }

  for (const period of regularHours.periods) {
    const apiDay: string | undefined =
      period.openDay || period.closeDay || undefined;
    if (!apiDay) continue;

    const key = apiDay.toLowerCase(); // 'MONDAY' -> 'monday', etc.
    const idx = base.findIndex((d) => d.day === key);
    if (idx === -1) continue;

    const openTime: string | null = period.openTime ?? null;
    const closeTime: string | null = period.closeTime ?? null;

    base[idx] = {
      day: base[idx].day,
      open: openTime,
      close: closeTime,
      closed: !openTime || !closeTime,
    };
  }

  return base;
}

/**
 * Quita todos los undefined para no romper Firestore
 */
function pruneUndefined<T>(value: T): T {
  if (value === undefined || value === null) return value;

  if (Array.isArray(value)) {
    return value.map((v) => pruneUndefined(v)) as unknown as T;
  }

  if (typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = pruneUndefined(v as any);
      if (cleaned !== undefined) {
        out[k] = cleaned;
      }
    }
    return out;
  }

  return value;
}

/**
 * Llama a GBP, trae datos de la Location y los mergea
 * en el documento de branding de Firestore.
 */
export async function syncBrandingFromGoogleProfile(): Promise<void> {
  if (!GBP_LOCATION_NAME || !BRANDING_DOC_PATH) {
    console.warn(
      "[googleProfileSync] Falta GBP_LOCATION_NAME o BRANDING_DOC_PATH; no se sincroniza."
    );
    return;
  }

  const myBusinessInfo = createMyBusinessInfoClient();

  // Campos que realmente nos interesan
  const readMask =
    "regularHours,specialHours,storefrontAddress,websiteUri,primaryPhone,latlng,metadata";

  // IMPORTANTE: aquí es .locations.get, NO accounts.locations.get
  const { data: location } = await myBusinessInfo.locations.get({
    name: GBP_LOCATION_NAME, // "locations/{location_id}"
    readMask,
  });

  const db = getAdminDb();
  const docRef = db.doc(BRANDING_DOC_PATH);

  const storefront = (location as any).storefrontAddress as any | undefined;
  const latlngVal = (location as any).latlng as any | undefined;
  const phoneNumbers = (location as any).phoneNumbers as any | undefined;
  const metadata = (location as any).metadata as any | undefined;

  const latitude =
    typeof latlngVal?.latitude === "number" ? latlngVal.latitude : undefined;
  const longitude =
    typeof latlngVal?.longitude === "number" ? latlngVal.longitude : undefined;

  const primaryPhone: string | undefined =
    phoneNumbers?.primaryPhone ?? undefined;
  const website: string | undefined = (location as any).websiteUri ?? undefined;

  const mapsUri: string | undefined = metadata?.mapsUri ?? undefined;

  // Construimos actualización "profunda" pero parcial
  const update: BrandingFSUpdate = {
    company: {
      contact: {
        website: website,
        phone: primaryPhone,
        // googleProfileURL lo puedes poner desde env si quieres
        // googleProfileURL: process.env.NEXT_PUBLIC_GOOGLE_PROFILE_URL,
        address: {
          street: storefront?.addressLines?.[0],
          city: storefront?.locality,
          state: storefront?.administrativeArea,
          zip: storefront?.postalCode,
          country: storefront?.regionCode,
          latitud:
            typeof latitude === "number" ? (lat(latitude) as any) : undefined,
          longitude:
            typeof longitude === "number"
              ? (lng(longitude) as any)
              : undefined,
        },
      },
    },
    contact: {
      address: {
        street: storefront?.addressLines?.[0],
        city: storefront?.locality,
        state: storefront?.administrativeArea,
        zip: storefront?.postalCode,
        country: storefront?.regionCode,
        lat:
          typeof latitude === "number" ? (lat(latitude) as any) : undefined,
        lng:
          typeof longitude === "number"
            ? (lng(longitude) as any)
            : undefined,
        zoom: 17,
      },
      phone: primaryPhone,
      google: mapsUri,
      googleMaps: mapsUri,
      directions: mapsUri ? `${mapsUri}&dirflg=d` : undefined,
    },
    schedule: mapBusinessHoursToSchedule((location as any).regularHours),
  };

  const cleaned = pruneUndefined(update) as BrandingFSUpdate;

  // Merge profundo a nivel de Firestore: no borra claves existentes,
  // solo pisa lo que mandamos en "cleaned".
  await docRef.set(cleaned, { merge: true });

  console.log("[googleProfileSync] Branding actualizado desde Google Profile");
}
