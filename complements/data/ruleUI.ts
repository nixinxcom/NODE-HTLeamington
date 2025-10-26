// complements/data/ruleUI.ts
import { doc, getDoc } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";

// i18n seed (para fallback) y seeds TSX
import seedDicts from "@/seeds/i18n";
import * as brandingSeedTsx from "@/seeds/branding";
import * as settingsSeedTsx from "@/seeds/settings";

// helpers de RDD
import { splitFM, resolveFM, mergeWithProvenance, pickSeedDict } from "./ruleHelpers";
import { getI18nEffectiveServer } from "@/complements/data/i18nFS.server";

/** Firestore REST (SSR-safe) */
async function loadDocFS(coll: string, id: string): Promise<any> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return undefined;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${coll}/${encodeURIComponent(
    id
  )}?key=${apiKey}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return undefined;
    const json = await res.json();
    const fields = json?.fields;
    const fromValue = (v: any): any => {
      if (!v || typeof v !== "object") return undefined;
      if ("stringValue" in v) return v.stringValue;
      if ("integerValue" in v) return Number(v.integerValue);
      if ("doubleValue" in v) return v.doubleValue;
      if ("booleanValue" in v) return v.booleanValue;
      if ("nullValue" in v) return null;
      if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
      if ("mapValue" in v) {
        const o: any = {};
        for (const [k, vv] of Object.entries(v.mapValue.fields || {})) o[k] = fromValue(vv);
        return o;
      }
      return undefined;
    };
    const out: any = {};
    for (const [k, v] of Object.entries(fields || {})) out[k] = fromValue(v);
    return out;
  } catch {
    return undefined;
  }
}

/** Carga doc FS en cliente (Web SDK) o en SSR (REST) */
async function loadFS(coll: string, id: string): Promise<any> {
  if (typeof window !== "undefined") {
    try {
      const snap = await getDoc(doc(FbDB, coll, id));
      return snap.exists() ? snap.data() : undefined;
    } catch {
      return undefined;
    }
  }
  return loadDocFS(coll, id);
}

/** Resolve locale sin hardcode:
 *  param → env → LC_* / LANG → Intl → en-US
 */
function resolveLocale(input?: string): string {
  return (
    input ??
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ??
    (process.env.LC_ALL ||
      process.env.LC_MESSAGES ||
      process.env.LANG ||
      process.env.LANGUAGE)?.replace(".UTF-8", "").replace("_", "-") ??
    Intl.DateTimeFormat().resolvedOptions().locale ??
    "en-US"
  );
}

/** SETTINGS (UI/Preview): FS > TSX(FM con i18n) > TSX */
export async function getSettingsEffectiveForUI(locale?: string) {
  const coll = process.env.NEXT_PUBLIC_SETTINGS_COLL || "settings";
  const id = process.env.NEXT_PUBLIC_SETTINGS_DOC || "default";
  const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "i18n_global";


  const loc = resolveLocale(locale);

  const fsGlobal = await loadFS(coll, id);

  // i18n para settings: seed + FS
  const dictSeed = pickSeedDict(seedDicts as any, loc);
  const fsI18n =
    typeof window !== "undefined"
      ? await loadFS(I18N_COLL, loc)
      : await getI18nEffectiveServer(loc);
  const dictEff = { ...(dictSeed || {}), ...(fsI18n || {}) };

  const tsxObj = (settingsSeedTsx as any).default ?? settingsSeedTsx;

  const { tsxFmOnly, tsxNoFm } = splitFM(tsxObj); // ahora permitimos FM en settings
  const tsxFMResolved = resolveFM(tsxFmOnly, dictEff);

  const { effective, provenance } = mergeWithProvenance([
    { tag: "tsx_plain", obj: tsxNoFm },
    { tag: "tsx_fm", obj: tsxFMResolved },
    { tag: "fs", obj: fsGlobal ?? {} },
  ]);

  return { effective, provenance, fsGlobal, fsI18n, dictEff, tsxObj, locale: loc };
}

/** BRANDING (UI/Preview, por locale): FS > TSX(FM con i18n FS>seed) > TSX */
export async function getBrandingEffectiveForUI(locale: string) {
  const collB = process.env.NEXT_PUBLIC_BRANDING_COLL || "branding";
  const idB = process.env.NEXT_PUBLIC_BRANDING_DOC || "default";
  const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "i18n_global";

  const loc = resolveLocale(locale);
  const fsGlobal = await loadFS(collB, idB);

  // i18n: FS > seed; usar REST seguro en SSR
  const dictSeed = pickSeedDict(seedDicts as any, loc);
  const fsI18n =
    typeof window !== "undefined"
      ? await loadFS(I18N_COLL, loc)
      : await getI18nEffectiveServer(loc); // ya devuelve objeto plano
  const dictEff = { ...(dictSeed || {}), ...(fsI18n || {}) };

  const tsxObj = (brandingSeedTsx as any).default ?? brandingSeedTsx;

  const { tsxFmOnly, tsxNoFm } = splitFM(tsxObj);
  const tsxFMResolved = resolveFM(tsxFmOnly, dictEff);

  const { effective, provenance } = mergeWithProvenance([
    { tag: "tsx_plain", obj: tsxNoFm },
    { tag: "tsx_fm", obj: tsxFMResolved },
    { tag: "fs", obj: fsGlobal ?? {} },
  ]);

  return {
    effective,
    provenance,
    fsGlobal,
    fsI18n,
    dictEff,
    tsxObj,
    locale: loc,
  };
}
