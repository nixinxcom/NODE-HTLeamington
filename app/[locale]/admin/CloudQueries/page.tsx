import React from 'react';
import OriginalPage from '../../../lib/CloudQueries/page';

/**
 * Wrapper por locale que delega toda la UI/logic a app/lib/CloudQueries/page.
 * Mantener este patrón evita duplicar lógica entre idiomas.
 */
export default async function Page(props: any) {
  // Pasamos params intactos (incluye { locale })
  return <OriginalPage {...props} />;
}
