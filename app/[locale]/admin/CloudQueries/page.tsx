import React from 'react';
import OriginalPage from '../../../lib/CloudQueries/page';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

/**
 * Wrapper por locale que delega toda la UI/logic a app/lib/CloudQueries/page.
 * Mantener este patrón evita duplicar lógica entre idiomas.
 */
export default async function Page(props: any) {
  // Pasamos params intactos (incluye { locale })
  return <OriginalPage {...props} />;
}
