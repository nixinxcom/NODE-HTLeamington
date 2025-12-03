'use client';
import { useSearchParams } from 'next/navigation';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

export default function Wip() {
  const sp = useSearchParams();
  const from = sp.get('from') || '/';

  // (Opcional) Timer 0s “por si acaso”
  // useEffect(() => { const t = setTimeout(() => router.replace(`/wip`), 0); return () => clearTimeout(t); }, []);

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="max-w-md text-center space-y-4">
        <H1 className="text-2xl font-semibold">Sitio en construcción</H1>
        <P className="opacity-80 text-sm">
          Estamos trabajando. Vuelve pronto.
        </P>
        <P className="opacity-60 text-xs">Intentaste visitar: <code>{from}</code></P>
      </div>
    </main>
  );
}
