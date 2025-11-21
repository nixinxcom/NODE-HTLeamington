import 'server-only';
import crypto from 'node:crypto';
import { getBrandingEffectiveForUI } from '@/complements/data/ruleUI';
import { getSettingsEffective } from '@/complements/data/settingsFS';

type Short = 'es'|'en'|'fr';
type BssData = { branding: any; settings: any; version: string; updatedAt: string };

const TTL_MS = Number(process.env.SERVER_RDD_CACHE_MIN ?? 7) * 60 * 1000; // 10 min por defecto
const cache = new Map<string, { ts: number; data: BssData }>();

function toShort(v?: string): Short {
  const s = String(v || '').toLowerCase();
  if (s.startsWith('en')) return 'en';
  if (s.startsWith('fr')) return 'fr';
  return 'es';
}

export async function getBssEffectiveCached(locale?: string): Promise<BssData> {
  const short = toShort(locale);
  const now = Date.now();
  const hit = cache.get(short);
  if (hit && now - hit.ts < TTL_MS) return hit.data;

  const { effective: branding } = await getBrandingEffectiveForUI(short);
  const settings = await getSettingsEffective(undefined, short);

  const payload = JSON.stringify({ branding, settings });
  const version = crypto.createHash('sha1').update(payload).digest('hex').slice(0, 12);
  const data: BssData = { branding, settings, version, updatedAt: new Date().toISOString() };

  cache.set(short, { ts: now, data });
  return data;
}
