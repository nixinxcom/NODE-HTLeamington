"use client";

import * as React from "react";
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";

// ⬇️ AJUSTA ESTA RUTA a donde tengas tu componente grande:
import StyleDesigner from "@/complements/components/StyleDesigner/StyleDesigner";
// (si quieres tipos, también puedes importar { StylesSchema } de ese mismo archivo)
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

const STYLES_REF = doc(
  FbDB,
  process.env.NEXT_PUBLIC_STYLES_COLL || "styles",
  process.env.NEXT_PUBLIC_STYLES_DOC || "default"
);
const SETTINGS_REF = doc(
  FbDB,
  process.env.NEXT_PUBLIC_SETTINGS_COLL || "settings",
  process.env.NEXT_PUBLIC_SETTINGS_DOC || "default"
);

// Aplana el schema → mapa de CSS vars (--comp-prop-theme-state y --body-*)
function flattenSchemaToCssVars(schema: any) {
  const out: Record<string, string | number> = {};
  const STATES = ["rest", "hover", "active", "disabled", "highlight"];

  // component → theme → state → tokens
  for (const [comp, compMap] of Object.entries(schema.components ?? {})) {
    for (const theme of schema.themes ?? []) {
      const themeMap: any = (compMap as any)[theme] ?? {};
      for (const st of STATES) {
        const tok: any = themeMap[st];
        if (!tok) continue;
        for (const [k, v] of Object.entries(tok)) {
          if (v == null) continue;
          out[`--${comp}-${k}-${theme}-${st}`] = v as any;
        }
      }
    }
  }

  // global/body por tema
  for (const theme of schema.themes ?? []) {
    const g: any = schema.global?.body?.[theme] ?? null;
    if (!g) continue;
    for (const [k, v] of Object.entries(g)) {
      if (v == null) continue;
      out[`--body-${k}-${theme}`] = v as any;
    }
  }
  return out;
}

export default function StylesTab() {
  // 1) Carga del schema de estilos desde FS
  const loadStyles = async () => {
    const snap = await getDoc(STYLES_REF);
    if (!snap.exists()) return null;
    const d = snap.data() as any;

    // Permitimos dos formatos: guardado plano o anidado en d.schema
    if (d?.components && d?.global && d?.themes) {
      return { $version: d.$version ?? 1, components: d.components, global: d.global, themes: d.themes };
    }
    if (d?.schema?.components && d?.schema?.global && d?.schema?.themes) {
      return d.schema;
    }
    return null;
  };

  // 2) Guardado del schema + publicación de 'flat' (CSS vars físicas)
  const saveStyles = async (schema: any) => {
    const flat = flattenSchemaToCssVars(schema);
    const batch = writeBatch(FbDB);
    // guardamos el schema legible + flat para el runtime
    batch.set(
      STYLES_REF,
      { ...schema, flat, updatedAt: Date.now() },
      { merge: true }
    );
    await batch.commit();
  };

  // 3) Carga/guardar alias e initialSlot desde Settings
  const [aliasInitial, setAliasInitial] = React.useState<{ light: string; dark: string }>();
  const [initialSlot, setInitialSlot] = React.useState<"light" | "dark" | undefined>();

  React.useEffect(() => {
    (async () => {
      const s = await getDoc(SETTINGS_REF);
      const data = s.exists() ? (s.data() as any) : {};
      const a = data?.website?.theme?.aliases;
      if (a?.light && a?.dark) setAliasInitial({ light: String(a.light), dark: String(a.dark) });
      const slot = data?.website?.theme?.initialSlot;
      if (slot === "light" || slot === "dark") setInitialSlot(slot);
    })();
  }, []);

  const onSaveAliases = async (aliases: { light: string; dark: string }) => {
    await setDoc(SETTINGS_REF, { website: { theme: { aliases } } }, { merge: true });
    setAliasInitial(aliases);
  };

  const onSaveInitialSlot = async (slot: "light" | "dark") => {
    await setDoc(SETTINGS_REF, { website: { theme: { initialSlot: slot } } }, { merge: true });
    setInitialSlot(slot);
  };

  return (
    <StyleDesigner
      loadStyles={loadStyles}
      saveStyles={saveStyles}
      aliasInitial={aliasInitial}
      initialSlot={initialSlot}
      onSaveAliases={onSaveAliases}
      onSaveInitialSlot={onSaveInitialSlot}
      className="pb-20"
    />
  );
}
