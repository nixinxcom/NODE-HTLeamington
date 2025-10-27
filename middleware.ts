// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['es','en','fr'] as const
const DEFAULT_LOCALE = 'es'

// extensiones públicas a ignorar
const PUBLIC_FILE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|json|xml|css|js|map|mp4|webm|woff2?|ttf|otf)$/i
const IGNORED_PREFIXES = [
  '/_next',
  '/api',
  '/favicon',
  '/icons',
  '/og',
  '/sitemap',
  '/robots.txt',
  '/sw.js',
  '/workbox-',
  '/ads.txt',
  '/manifest.webmanifest',
]

// === NUEVO: tenant por host (puedes moverlo a ENV/DB si quieres) ===
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'nixinx'
const TENANT_BY_HOST: Record<string, string> = {
  'localhost:3000': 'nixinx',
  'localhost:3001': 'nixinx',
  'localhost:3002': 'elpatron',
  'patronbarandgrill.com': 'elpatron',
  'www.patronbarandgrill.com': 'elpatron',
  // agrega aquí más dominios/puertos → tenant
}
function getTenantForHost(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase()
  return TENANT_BY_HOST[host] || DEFAULT_TENANT
}

// === Firestore REST (tu lógica existente) ===
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const SETTINGS_DOC = process.env.NEXT_PUBLIC_SETTINGS_DOC_PATH || 'settings/default'

// elige locale por Accept-Language solo para la raíz
function pickLocale(req: NextRequest): typeof LOCALES[number] {
  const header = (req.headers.get('accept-language') || '').toLowerCase()
  const langs = header.split(',').map(l => l.trim().split(';')[0].split('-')[0])
  for (const l of langs) if ((LOCALES as readonly string[]).includes(l)) return l as any
  return DEFAULT_LOCALE
}

// paths helpers
function isI18nPath(pathname: string) {
  const first = pathname.split('/').filter(Boolean)[0]
  return (LOCALES as readonly string[]).includes(first ?? '')
}

// ⚠️ Ajustado para soportar opcionalmente el segmento {tenant}
function isAdminOrWip(pathname: string) {
  const segs = pathname.split('/').filter(Boolean)
  if (!segs.length) return false
  // segs[0] = locale; segs[1] puede ser admin|wip o tenant
  const s1 = segs[1]?.toLowerCase()
  const s2 = segs[2]?.toLowerCase()
  return (s1 === 'admin' || s1 === 'wip' || s2 === 'admin' || s2 === 'wip')
}

function looksLikeAgentApi(pathname: string) {
  if (!pathname.startsWith('/api')) return false
  return /\/api\/(ai(\b|\/)|assistant\b|agent(s)?\b|ai-agents\b)/.test(pathname)
}

async function fetchSettingsDoc(): Promise<any | null> {
  if (!FIREBASE_PROJECT_ID) return null
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${encodeURIComponent(SETTINGS_DOC)}`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function readBool(doc: any, path: string[], defaultValue: boolean | null): boolean | null {
  try {
    let node = doc?.fields
    for (let i = 0; i < path.length - 1; i++) {
      node = node?.[path[i]]?.mapValue?.fields
    }
    const last = path[path.length - 1]
    const val = node?.[last]?.booleanValue
    if (typeof val === 'boolean') return val
    return defaultValue
  } catch {
    return defaultValue
  }
}

async function websiteEnabled(): Promise<boolean> {
  const doc = await fetchSettingsDoc()
  const v1 = readBool(doc, ['faculties','website'], null)
  const v2 = readBool(doc, ['website'], null)
  const value = v1 ?? v2
  return value !== false
}

async function agentEnabled(): Promise<boolean> {
  const doc = await fetchSettingsDoc()
  const v1 = readBool(doc, ['agentAI'], null)
  const v2 = readBool(doc, ['agentAI','enabled'], null)
  const value = v1 ?? v2
  return value !== false
}

export async function middleware(req: NextRequest) {
  const { pathname, search, hash } = req.nextUrl

  // normalización /en-US → /en (tu lógica)
  const segs = pathname.split('/').filter(Boolean)
  const first = (segs[0] || '').toLowerCase()
  const LONG_TO_SHORT: Record<string, typeof LOCALES[number]> = {
    'en-us': 'en',
    'es-mx': 'es',
    'fr-ca': 'fr',
  }
  if (first in LONG_TO_SHORT) {
    const short = LONG_TO_SHORT[first]
    const rest = segs.slice(1).join('/')
    const url = req.nextUrl.clone()
    url.pathname = `/${short}${rest ? `/${rest}` : ''}`
    url.search = search
    url.hash = hash
    return NextResponse.redirect(url)
  }

  // APIs (incluye kill-switch del agente)
  if (pathname.startsWith('/api')) {
    if (looksLikeAgentApi(pathname)) {
      const on = await agentEnabled()
      if (!on) {
        return new NextResponse(JSON.stringify({ ok: false, error: 'agent_disabled' }), {
          status: 503,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        })
      }
    }
    return NextResponse.next()
  }

  // estáticos/ignorados
  if (IGNORED_PREFIXES.some(p => pathname.startsWith(p)) || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  // === Rutas con locale visible: kill-switch + multi-tenant rewrite ===
  if (isI18nPath(pathname)) {
    if (!isAdminOrWip(pathname)) {
      const enabled = await websiteEnabled()
      if (!enabled) {
        const url = req.nextUrl.clone()
        const locale = pathname.split('/').filter(Boolean)[0] || DEFAULT_LOCALE
        url.pathname = `/${locale}/wip`
        url.searchParams.set('from', pathname)
        const res = NextResponse.redirect(url, 307)
        res.headers.set('Cache-Control', 'no-store')
        res.headers.set('X-Robots-Tag', 'noindex, nofollow')
        return res
      }
    }

    // ⬇️ NUEVO: ocultar /{tenant} en la URL pública con rewrite interno
    const tenant = getTenantForHost(req)
    const parts = pathname.split('/').filter(Boolean)
    const locale = parts[0]
    const afterLocale = parts.slice(1) // puede estar vacío
    const firstAfter = afterLocale[0]?.toLowerCase()

    // si ya trae el tenant o es admin/wip, no reescribas
    const alreadyHasTenant = firstAfter === tenant.toLowerCase()
    const isAdminWip = firstAfter === 'admin' || firstAfter === 'wip'

    if (!alreadyHasTenant && !isAdminWip) {
      const url = req.nextUrl.clone()
      const rest = afterLocale.join('/')
      url.pathname = `/${locale}/${tenant}${rest ? `/${rest}` : ''}`
      // REWRITE (no cambia la URL visible)
      return NextResponse.rewrite(url)
    }

    return NextResponse.next()
  }

  // === Sin locale visible: decide locale y redirige a /{locale}/… (URL limpia, sin tenant) ===
  const locale = pathname === '/' ? pickLocale(req) : DEFAULT_LOCALE

  // kill-switch en destino
  const candidatePath = `/${locale}${pathname}`
  if (!isAdminOrWip(candidatePath)) {
    const enabled = await websiteEnabled()
    if (!enabled) {
      const url = req.nextUrl.clone()
      url.pathname = `/${locale}/wip`
      url.searchParams.set('from', pathname)
      const res = NextResponse.redirect(url, 307)
      res.headers.set('Cache-Control', 'no-store')
      res.headers.set('X-Robots-Tag', 'noindex, nofollow')
      return res
    }
  }

  // redirección i18n (la inserción de {tenant} se hace luego vía rewrite en el bloque de arriba)
  const url = req.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  url.search = search
  url.hash = hash

  const res = NextResponse.redirect(url)
  res.headers.set('Vary', 'Accept-Language')
  return res
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
