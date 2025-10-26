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

// === NUEVO: configuración para Firestore REST (fail-open si no hay envs) ===
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const SETTINGS_DOC = process.env.NEXT_PUBLIC_SETTINGS_DOC_PATH || 'settings/default'

// elige locale por Accept-Language solo para la raíz
function pickLocale(req: NextRequest): typeof LOCALES[number] {
  const header = (req.headers.get('accept-language') || '').toLowerCase()
  const langs = header.split(',').map(l => l.trim().split(';')[0].split('-')[0])
  for (const l of langs) if ((LOCALES as readonly string[]).includes(l)) return l as any
  return DEFAULT_LOCALE
}

// === NUEVO: helpers de path ===
function isI18nPath(pathname: string) {
  const first = pathname.split('/').filter(Boolean)[0]
  return (LOCALES as readonly string[]).includes(first ?? '')
}
function isAdminOrWip(pathname: string) {
  const segs = pathname.split('/').filter(Boolean)
  const first = segs[0]
  const second = segs[1] ?? ''
  return (LOCALES as readonly string[]).includes(first ?? '') && (second === 'admin' || second === 'wip')
}
function looksLikeAgentApi(pathname: string) {
  // Cubre /api/ai, /api/assistant, /api/agent, /api/agents, /api/ai-agents, etc.
  if (!pathname.startsWith('/api')) return false
  return /\/api\/(ai(\b|\/)|assistant\b|agent(s)?\b|ai-agents\b)/.test(pathname)
}

// === NUEVO: lectura ligera a Firestore REST ===
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

// Firestore REST -> extrae boolean navegando por fields.mapValue.fields...booleanValue
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
  // Primero intenta faculties.website, luego website (raíz). Fail-open = true
  const v1 = readBool(doc, ['faculties','website'], null)
  const v2 = readBool(doc, ['website'], null)
  const value = v1 ?? v2
  return value !== false
}

async function agentEnabled(): Promise<boolean> {
  const doc = await fetchSettingsDoc()
  // Soporta settings.agentAI (boolean) o settings.agentAI.enabled (nested)
  const v1 = readBool(doc, ['agentAI'], null)
  const v2 = readBool(doc, ['agentAI','enabled'], null)
  const value = v1 ?? v2
  return value !== false
}

export async function middleware(req: NextRequest) {
  const { pathname, search, hash } = req.nextUrl

  // === NUEVO: normalización de prefijos con locales largos → cortos
  // Soporta /en-US/*, /es-MX/*, /fr-CA/* y los redirige a /en/*, /es/*, /fr/*
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

  // === NUEVO: Apagado de endpoints del Agente por settings.agentAI ===
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
    // Resto de /api no se toca
    return NextResponse.next()
  }

  // ignorar rutas públicas/estáticas/especiales
  if (IGNORED_PREFIXES.some(p => pathname.startsWith(p)) || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  // === NUEVO: Kill-switch de sitio (redirige a /{locale}/wip) ===
  if (isI18nPath(pathname)) {
    // Ya trae locale
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
    return NextResponse.next()
  }

  // sin locale: decidir locale y aplicar redirección i18n (y kill-switch si está apagado)
  const locale = pathname === '/' ? pickLocale(req) : DEFAULT_LOCALE

  // Si el sitio está apagado y no es admin/wip, mandar a /{locale}/wip
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

  // redirigir manteniendo query (?...) y hash (#...)
  const url = req.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  url.search = search // conserva ?gtm_debug/&c.
  url.hash = hash     // conserva anclas

  const res = NextResponse.redirect(url)
  res.headers.set('Vary', 'Accept-Language')
  return res
}
