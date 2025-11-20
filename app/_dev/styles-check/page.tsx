// app/_dev/styles-check/page.tsx
import { getSettingsEffective } from "@/complements/data/settingsFS";
import { getStylesEffective } from "@/complements/data/stylesFS";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Colors = { primary?: string; background?: string };
type StyleThemes = Record<string, any>;

function readColor(themes: StyleThemes, themeName: string, key: "primary"|"background") {
  const t = themes?.[themeName] ?? {};
  const pick = (v: any) => (typeof v === "string" ? v.trim() : undefined);
  return (
    pick(t[key]) ||
    pick(t?.colors?.[key]) ||
    pick(t?.palette?.[key]) ||
    pick(t?.tokens?.colors?.[key]) ||
    undefined
  );
}

export default async function StylesCheckPage() {
  const settings = await getSettingsEffective();
  const styles = await getStylesEffective();

  const lightName = String(settings?.website?.theme?.aliases?.light ?? "light");
  const darkName  = String(settings?.website?.theme?.aliases?.dark  ?? "dark");

  const themes: StyleThemes =
    (styles as any)?.themes ??
    (styles as any)?.styles?.themes ?? // por si tu shape es styles.styles.themes
    {};

  const light: Colors = {
    primary:    readColor(themes, lightName, "primary"),
    background: readColor(themes, lightName, "background"),
  };

  const dark: Colors = {
    primary:    readColor(themes, darkName, "primary"),
    background: readColor(themes, darkName, "background"),
  };

  const swatch = (label: string, v?: string) => (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{
        width:24,height:24,borderRadius:6,border:"1px solid #333",
        background: v ?? "transparent"
      }}/>
      <code>{label}: {v ?? "(sin definir)"}</code>
    </div>
  );

  return (
    <main style={{padding:24, fontFamily:"system-ui, sans-serif"}}>
      <H1 style={{fontSize:22, marginBottom:12}}>Styles – Data Rule Check</H1>

      <section style={{marginBottom:16}}>
        <H2 style={{fontSize:16}}>Aliases</H2>
        <pre style={{background:"#0b1220", color:"#e5e7eb", padding:12, borderRadius:8}}>
{JSON.stringify(settings?.website?.theme?.aliases ?? {}, null, 2)}
        </pre>
      </section>

      <section style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
        <div style={{padding:12, border:"1px solid #1f2937", borderRadius:8}}>
          <H3>Light → <code>{lightName}</code></H3>
          {swatch("primary", light.primary)}
          {swatch("background", light.background)}
        </div>
        <div style={{padding:12, border:"1px solid #1f2937", borderRadius:8}}>
          <H3>Dark → <code>{darkName}</code></H3>
          {swatch("primary", dark.primary)}
          {swatch("background", dark.background)}
        </div>
      </section>

      <section style={{marginTop:16}}>
        <H2 style={{fontSize:16}}>Temas disponibles (keys)</H2>
        <pre style={{background:"#0b1220", color:"#e5e7eb", padding:12, borderRadius:8, maxHeight:240, overflow:"auto"}}>
{JSON.stringify(Object.keys(themes || {}), null, 2)}
        </pre>
      </section>

      <P style={{opacity:.75, marginTop:16}}>
        * Si un color aparece “(sin definir)”, falta en ese tema físico o está en otra ruta;
        amplía el lector <code>readColor()</code> si tu shape es distinto.
      </P>
    </main>
  );
}
