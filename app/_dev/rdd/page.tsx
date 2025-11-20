// app/_dev/rdd/page.tsx
import { getBrandingEffectivePWA } from '@/complements/data/brandingFS';
import { getSettingsEffective } from '@/complements/data/settingsFS';
import { getStylesEffective } from '@/complements/data/stylesFS';
import { normalizeToSupported } from '@/context/AppContext';
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

export default async function RDDInspector({ searchParams }: { searchParams: { locale?: string } }) {
  const locale = normalizeToSupported(toShortLocale(searchParams?.locale || DEFAULT_LOCALE_SHORT));
  const [branding, settings, styles] = await Promise.all([
    getBrandingEffectivePWA(locale),
    getSettingsEffective(),
    getStylesEffective(),
  ]);

  const aliases = {
    light: String(settings?.website?.theme?.aliases?.light ?? 'light'),
    dark:  String(settings?.website?.theme?.aliases?.dark  ?? 'dark'),
  };
  const initialSlot = (String(settings?.website?.theme?.initialSlot || 'light') as 'light'|'dark');

  return (
    <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto', fontFamily: 'ui-sans-serif, system-ui' }}>
      <H1 style={{ fontSize: 24, fontWeight: 700 }}>RDD Inspector (Branding · Settings · Styles)</H1>
      <P style={{ opacity: .75 }}>Locale: <code>{locale}</code></P>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#0b1220', color: '#e5e7eb', padding: 12, borderRadius: 8 }}>
          <H2 style={{ fontSize: 16, marginBottom: 8 }}>Branding (effective, strings)</H2>
          <pre style={{ maxHeight: 360, overflow: 'auto' }}>{JSON.stringify(branding, null, 2)}</pre>
        </div>
        <div style={{ background: '#0b1220', color: '#e5e7eb', padding: 12, borderRadius: 8 }}>
          <H2 style={{ fontSize: 16, marginBottom: 8 }}>Settings (effective)</H2>
          <pre style={{ maxHeight: 360, overflow: 'auto' }}>{JSON.stringify(settings, null, 2)}</pre>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#0b1220', color: '#e5e7eb', padding: 12, borderRadius: 8 }}>
          <H2 style={{ fontSize: 16, marginBottom: 8 }}>Styles (effective schema)</H2>
          <pre style={{ maxHeight: 360, overflow: 'auto' }}>{JSON.stringify(styles, null, 2)}</pre>
        </div>
        <div style={{ background: '#0b1220', color: '#e5e7eb', padding: 12, borderRadius: 8 }}>
          <H2 style={{ fontSize: 16, marginBottom: 8 }}>Theme wiring</H2>
          <pre style={{ maxHeight: 360, overflow: 'auto' }}>{JSON.stringify({ aliases, initialSlot }, null, 2)}</pre>
          <P style={{opacity:.8, marginTop:8}}>Slots: <code>light</code> / <code>dark</code> → temas físicos por aliases.</P>
        </div>
      </section>

      <P style={{opacity:.65, marginTop: 16}}>
        * RDD: Branding (FS &gt; TSX(FM) &gt; JSON) · Settings (FS &gt; JSON &gt; TSX) · Styles (FS &gt; TSX).
      </P>
    </main>
  );
}
