// app/lib/audiences/loadUtmAudiences.ts
import { doc, getDoc } from 'firebase/firestore';
import { FbDB } from '@/app/lib/services/firebase';
import type { AudienceDoc } from './types';

export async function loadUtmAudiences(): Promise<AudienceDoc[]> {
  const snap = await getDoc(doc(FbDB, 'Providers', 'utms'));
  if (!snap.exists()) return [];

  const data = snap.data() as any;
  const utms = Array.isArray(data.utms) ? data.utms : [];

  return utms
    // solo las activas y marcadas como listas para campañas
    .filter(
      (u: any) =>
        u &&
        u.status === 'active' &&
        u.readyForCampaigns === true &&
        typeof u.audienceId === 'string' &&
        u.audienceId.trim() !== '',
    )
    .map(
      (u: any): AudienceDoc => ({
        audienceId: u.audienceId,
        name: u.name || u.audienceId,
        description: u.description,
        // si quieres separar lógicamente:
        // type: 'ruleBased', // o agrega 'utm' al type
        type: 'ruleBased',
        source: (u.utmSource as any) || 'internal',
        track: u.track || undefined,
        // aquí podrías guardar metadata UTM si luego quieres:
        // rules: { utmSource: u.utmSource, utmMedium: u.utmMedium, ... }
      }),
    );
}
