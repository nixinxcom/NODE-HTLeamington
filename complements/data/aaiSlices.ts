// complements/data/aaiSlices.ts
import { getBrandingEffectivePWA } from '@/complements/data/brandingFS';
import { createHash } from 'crypto';
import type { ShortLocale } from '@/app/lib/i18n/locale';

type Locale = ShortLocale | string;
type Scope =
  | 'contact' | 'hours' | 'location' | 'socials'
  | 'menu' | 'services' | 'brand' | 'policies';

type Manifest = {
  locale: string;
  version: string;                 // hash global del efectivo por locale
  core_version: string;            // hash del core
  scope_versions: Record<Scope,string>;
  updated_at: string;
};

const SCOPES: Scope[] = ['contact','hours','location','socials','menu','services','brand','policies'];

const pick = (obj:any, path:string) => path.split('.').reduce((o,k)=>o?.[k], obj);
const hash = (data:any) => createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0,16);

function toCore(eff:any){
  // Solo invariantes a locale (ajústalo a tu shape real):
  const phone = eff?.company?.phone ?? eff?.contact?.phone ?? eff?.params?.phone;
  const domain = eff?.company?.website ?? eff?.agentAI?.domain ?? eff?.params?.domain;
  const map = eff?.contact?.map ?? eff?.params?.map;
  const geo = eff?.company?.geo ?? eff?.params?.geo;
  return { phone_main: phone, domain, links: { map }, geo };
}

function toScope(eff:any, scope:Scope){
  switch(scope){
    case 'contact':  return { phones: [eff?.company?.phone, eff?.contact?.phone].filter(Boolean),
                              emails: [eff?.company?.email, eff?.contact?.email].filter(Boolean),
                              addresses: [eff?.contact?.address?.street, eff?.contact?.address?.full].filter(Boolean) };
    case 'hours':    return eff?.params?.hours ?? eff?.schedule ?? null;
    case 'location': return { address: eff?.contact?.address, map: eff?.contact?.map, geo: eff?.company?.geo };
    case 'socials':  return eff?.socials ?? [];
    case 'menu':     return eff?.products ?? [];
    case 'services': return eff?.services ?? [];
    case 'brand':    return { name: eff?.company?.brandName ?? eff?.agentAI?.displayName,
                              tagline: eff?.company?.tagline, story: eff?.company?.mission };
    case 'policies': return eff?.policies ?? [];
  }
}

export async function buildSlices(locale:Locale){
  // 1) Branding efectivo (RDD ya aplicado)
  const eff = await getBrandingEffectivePWA(locale);
  // 2) Core + scopes
  const core = toCore(eff);
  const core_version = hash(core);
  const scope_versions: Record<string,string> = {};
  const slices: Record<string,any> = {};
  for (const s of SCOPES){
    const data = toScope(eff, s as Scope);
    const v = hash(data ?? null);
    scope_versions[s] = v;
    slices[s] = data;
  }
  const version = hash({ eff }); // hash global (sirve para invalidar caches)
  const manifest: Manifest = {
    locale: String(locale),
    version, core_version,
    scope_versions: scope_versions as Record<Scope,string>,
    updated_at: new Date().toISOString(),
  };
  return { manifest, core, slices };
}

// Acceso granular (server)
const _mem = new Map<string, {ts:number, v:any}>();
const TTL = Number(process.env.AI_CACHE_MINUTES ?? 7) * 60 * 1000;
function getMemo(k:string){ const e=_mem.get(k); return e && (Date.now()-e.ts<TTL) ? e.v : null; }
function setMemo(k:string, v:any){ _mem.set(k,{ts:Date.now(),v}); }

export async function getSliceServer(locale:Locale, scope:Scope){
  const key = `slice:${locale}:${scope}`;
  const hit = getMemo(key);
  if (hit) return hit;
  const { core, slices, manifest } = await buildSlices(locale);
  const out = { core, slice: slices[scope], version: manifest.version, core_version: manifest.core_version, scope_version: manifest.scope_versions[scope] };
  setMemo(key, out);
  return out;
}

export async function getManifestServer(locale:Locale){
  const key = `manifest:${locale}`;
  const hit = getMemo(key);
  if (hit) return hit;
  const { manifest } = await buildSlices(locale);
  setMemo(key, manifest);
  return manifest;
}
