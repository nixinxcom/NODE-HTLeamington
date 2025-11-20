"use client";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 text-center">
      <div>
        <H1 className="text-2xl font-semibold mb-2">
          <FM id="offline.title" defaultMessage="Estás sin conexión" />
        </H1>
        <P className="mb-6 opacity-80">
          <FM id="offline.description" defaultMessage="Algunas funciones requieren internet. Intenta de nuevo cuando tengas señal." />
        </P>
        <div className="flex items-center gap-3 justify-center">
          <BUTTON onClick={() => location.reload()} className="px-4 py-2 rounded-md bg-black text-white">
            <FM id="offline.retry" defaultMessage="Reintentar" />
          </BUTTON>
          <LINK href="/menus" className="px-4 py-2 rounded-md border">
            <FM id="offline.menu" defaultMessage="Ver menú" />
          </LINK>
        </div>
      </div>
    </main>
  );
}