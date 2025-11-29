// complements/data/i18nFS.ts
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";

export type I18nDict = Record<string, string>;

const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "Providers";

function baseLang(locale: string) {
  const i = locale.indexOf("-");
  return i > 0 ? locale.slice(0, i) : locale;
}

function flatten(obj: any, pfx = "", out: I18nDict = {}): I18nDict {
  if (!obj) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = pfx ? `${pfx}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v as any, key, out);
    else out[key] = String(v ?? "");
  }
  return out;
}

/**
 * Carga efectiva:
 * 1) Intenta API: /api/out/rdd/i18n/[lang]?tenant=...  (mezcla seeds cliente + FS)
 * 2) Fallback: solo Firestore (mantiene el comportamiento previo)
 */
export async function getI18nEffective(locale: string, tenant?: string): Promise<I18nDict> {
  const lang = baseLang(locale);

  // Intento API (disponible en server y client)
  try {
    const q = tenant ? `?tenant=${encodeURIComponent(tenant)}` : "";
    const r = await fetch(`/api/out/rdd/i18n/${lang}${q}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      const dict = (j?.dict ?? {}) as Record<string, unknown>;
      return flatten(dict);
    }
  } catch {
    // ignora y cae a FS
  }

  // Fallback: FS (doc corto)
  const snap = await getDoc(doc(FbDB, I18N_COLL, lang));
  const data = snap.exists() ? snap.data() : {};
  return flatten(data);
}

export async function saveI18n(locale: string, dict: I18nDict) {
  const lang = baseLang(locale); // guardar siempre en corto
  await setDoc(doc(FbDB, I18N_COLL, lang), dict, { merge: true });
}
