// complements/factory/pwa.sync.ts
"use client";

import { doc, setDoc } from "firebase/firestore";
import {
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { FbDB, FbStorage } from "@/app/lib/services/firebase";

/* ──────────────────────────────────────────────
   Tipos que se guardan en Providers/pwa
   ────────────────────────────────────────────── */

export type PwaIconDoc = {
  src: string;                    // URL https pública
  file: string;                   // ruta lógica (ej: "icons/Logo_192x192.webp")
  sizes?: string;                 // ej: "192x192"
  type?: string;                  // ej: "image/webp"
  purpose?: "any" | "maskable" | "monochrome";
};

export type PwaScreenshotDoc = {
  src: string;
  file: string;                   // ej: "screenshots/Banner_700x700.webp"
  sizes?: string;                 // ej: "700x700"
  type?: string;
  label?: string;
  formFactor?: "wide" | "narrow";
};

/* ──────────────────────────────────────────────
   Helpers internos
   ────────────────────────────────────────────── */

/** "Logo_192x192.webp" → "192x192" */
function inferSizesFromPath(path: string): string | undefined {
  const m = path.match(/(\d+)x(\d+)/);
  if (!m) return undefined;
  return `${m[1]}x${m[2]}`;
}

/** Inferir mime-type desde la extensión del archivo */
function inferMimeFromPath(path: string): string {
  const clean = path.split("?")[0];
  const ext = clean.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "image/*";
  }
}

/* ──────────────────────────────────────────────
   PURGES: solo Storage, no Firestore
   ────────────────────────────────────────────── */

export async function purgePwaIcons(): Promise<void> {
  try {
    const folderRef = ref(FbStorage, "manifest/icons");
    const list = await listAll(folderRef);
    await Promise.allSettled(
      list.items.map((item) => deleteObject(item))
    );
  } catch (e) {
    console.warn("[pwa.sync] purgePwaIcons() ignorado:", e);
  }
}

export async function purgePwaScreenshots(): Promise<void> {
  try {
    const folderRef = ref(FbStorage, "manifest/screenshots");
    const list = await listAll(folderRef);
    await Promise.allSettled(
      list.items.map((item) => deleteObject(item))
    );
  } catch (e) {
    console.warn("[pwa.sync] purgePwaScreenshots() ignorado:", e);
  }
}

/* ──────────────────────────────────────────────
   SYNC: Storage → Providers/pwa
   ────────────────────────────────────────────── */

/**
 * Lee lo que hay actualmente en:
 *   - manifest/icons/*
 *   - manifest/screenshots/*
 * genera:
 *   - icons: PwaIconDoc[]
 *   - screenshots: PwaScreenshotDoc[]
 * y los guarda en Providers/pwa.
 */
export async function syncPwaAssetsIntoDoc(): Promise<void> {
  const pwaRef = doc(FbDB, "Providers", "pwa");

  const iconsFolderRef = ref(FbStorage, "manifest/icons");
  const screenshotsFolderRef = ref(FbStorage, "manifest/screenshots");

  const [iconsList, screenshotsList] = await Promise.all([
    listAll(iconsFolderRef).catch(() => ({ items: [] })),
    listAll(screenshotsFolderRef).catch(() => ({ items: [] })),
  ]);

  // ───── Icons ─────
  const icons: PwaIconDoc[] = await Promise.all(
    iconsList.items.map(async (item) => {
      const fullPath = item.fullPath; // "manifest/icons/Logo_192x192.webp"
      const src = await getDownloadURL(item); // URL https pública
      const sizes = inferSizesFromPath(fullPath);
      const type = inferMimeFromPath(fullPath);

      return {
        src,
        file: fullPath.replace(/^manifest\//, ""), // "icons/Logo_192x192.webp"
        ...(sizes ? { sizes } : {}),
        type,
      };
    })
  );

  // ───── Screenshots ─────
  const screenshots: PwaScreenshotDoc[] = await Promise.all(
    screenshotsList.items.map(async (item) => {
      const fullPath = item.fullPath; // "manifest/screenshots/Banner_700x700.webp"
      const src = await getDownloadURL(item);
      const sizes = inferSizesFromPath(fullPath);
      const type = inferMimeFromPath(fullPath);

      return {
        src,
        file: fullPath.replace(/^manifest\//, ""), // "screenshots/Banner_700x700.webp"
        ...(sizes ? { sizes } : {}),
        type,
      };
    })
  );

  await setDoc(
    pwaRef,
    {
      icons,
      screenshots,
      assetsBase: "manifest",
    },
    { merge: true }
  );
}
