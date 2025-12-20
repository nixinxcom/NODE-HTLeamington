// complements/factory/pwa.sync.ts
"use client";

import { doc, setDoc } from "firebase/firestore";
import type { StorageReference } from "firebase/storage";
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { FbDB, FbStorage } from "@/app/lib/services/firebase";

/* ──────────────────────────────────────────────
   Tipos que se guardan en Providers/pwa
   ────────────────────────────────────────────── */

export type PwaIconDoc = {
  src: string; // URL https pública
  file: string; // "icons/Logo_192x192.webp"
  sizes?: string; // "192x192"
  type?: string; // "image/webp"
  purpose?: "any" | "maskable" | "monochrome";
};

export type PwaScreenshotDoc = {
  src: string;
  file: string; // "screenshots/narrow/Home_720x1280.webp"
  sizes?: string;
  type?: string;
  label?: string;
  formFactor?: "wide" | "narrow";
};

/* ──────────────────────────────────────────────
   Helpers internos
   ────────────────────────────────────────────── */

/** "Logo_192x192.webp" → "192x192" (toma cualquier 123x456 en el path) */
function inferSizesFromPath(path: string): string | undefined {
  const m = path.match(/(\d+)x(\d+)/);
  if (!m) return undefined;
  return `${m[1]}x${m[2]}`;
}

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

/** listAll NO es recursivo. Esto sí. */
async function listAllDeep(folderPath: string): Promise<StorageReference[]> {
  const root = ref(FbStorage, folderPath);
  const out: StorageReference[] = [];
  const q: StorageReference[] = [root];

  while (q.length) {
    const cur = q.shift()!;
    const res = await listAll(cur);
    out.push(...res.items);
    q.push(...res.prefixes);
  }

  return out;
}

/* ──────────────────────────────────────────────
   PURGE: Storage
   ────────────────────────────────────────────── */

export async function purgeStorageFolder(folderPath: string): Promise<void> {
  try {
    const items = await listAllDeep(folderPath);
    await Promise.allSettled(items.map((item) => deleteObject(item)));
  } catch (e) {
    console.warn("[pwa.sync] purgeStorageFolder() ignorado:", e);
  }
}

// Mantengo estos exports por compatibilidad
export async function purgePwaIcons(): Promise<void> {
  // OJO: yo NO lo llamaría automáticamente en upload,
  // porque necesitas poder acumular varios tamaños.
  return purgeStorageFolder("manifest/icons");
}

export async function purgePwaScreenshots(): Promise<void> {
  return purgeStorageFolder("manifest/screenshots");
}

/* ──────────────────────────────────────────────
   SYNC: Storage → Providers/pwa
   ────────────────────────────────────────────── */

export async function syncPwaAssetsIntoDoc(): Promise<void> {
  const pwaRef = doc(FbDB, "Providers", "pwa");

  const [iconItems, narrowItems, wideItems] = await Promise.all([
    listAllDeep("manifest/icons").catch(() => []),
    listAllDeep("manifest/screenshots/narrow").catch(() => []),
    listAllDeep("manifest/screenshots/wide").catch(() => []),
  ]);

  // ───── Icons ─────
  const icons: PwaIconDoc[] = await Promise.all(
    iconItems.map(async (item) => {
      const fullPath = item.fullPath; // "manifest/icons/Logo_192x192.webp"
      const src = await getDownloadURL(item);
      const sizes = inferSizesFromPath(fullPath);
      const type = inferMimeFromPath(fullPath);

      return {
        src,
        file: fullPath.replace(/^manifest\//, ""), // "icons/Logo_192x192.webp"
        ...(sizes ? { sizes } : {}),
        type,
        purpose: "any",
      };
    }),
  );

  // ───── Screenshots ─────
  const mapShots = async (
    items: StorageReference[],
    formFactor: "narrow" | "wide",
  ): Promise<PwaScreenshotDoc[]> => {
    return Promise.all(
      items.map(async (item) => {
        const fullPath = item.fullPath; // "manifest/screenshots/narrow/Home_720x1280.webp"
        const src = await getDownloadURL(item);
        const sizes = inferSizesFromPath(fullPath);
        const type = inferMimeFromPath(fullPath);

        return {
          src,
          file: fullPath.replace(/^manifest\//, ""), // "screenshots/narrow/Home_720x1280.webp"
          ...(sizes ? { sizes } : {}),
          type,
          formFactor,
        };
      }),
    );
  };

  const [shotsNarrow, shotsWide] = await Promise.all([
    mapShots(narrowItems, "narrow"),
    mapShots(wideItems, "wide"),
  ]);

  const screenshots: PwaScreenshotDoc[] = [...shotsNarrow, ...shotsWide];

  await setDoc(
    pwaRef,
    {
      icons,
      screenshots,
      assetsBase: "manifest",
    },
    { merge: true },
  );
}
