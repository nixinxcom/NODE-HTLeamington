/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default;

const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const isProd = process.env.NODE_ENV === 'production';

/* ── Permissions-Policy (ADITIVO: evita ReferenceError y silencia sensores) ── */
const PERMISSIONS_DEV  =
  'accelerometer=(), gyroscope=(), magnetometer=(), camera=(), microphone=(), geolocation=()';
const PERMISSIONS_PROD = PERMISSIONS_DEV;

/* ── CSP ────────────────────────────────────────────────────────── */
const CSP_PROD = [
  "default-src 'self';",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.brevo.com https://sibautomation.com https://conversations-widget.brevo.com https://conversations-widget.sendinblue.com https://www.gstatic.com https://apis.google.com https://accounts.google.com;",
  // ⬇️ AQUI AGREGO fonts.googleapis.com y fonts.gstatic.com
  "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://www.google.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://sibautomation.com https://*.brevo.com https://*.sendinblue.com https://www.gstatic.com https://apis.google.com https://accounts.google.com https://fonts.googleapis.com https://fonts.gstatic.com wss: wss://*.brevo.com wss://*.sendinblue.com https://api.emailjs.com;",
  "img-src 'self' data: blob: https:;",
  "style-src 'self' 'unsafe-inline' https:;",
  "font-src 'self' data: https:;",
  "frame-src 'self' https://www.googletagmanager.com https://www.google.com https://accounts.google.com https://*.google.com https://recaptcha.google.com https://www.gstatic.com https://*.firebaseapp.com https://*.web.app https://conversations-widget.brevo.com https://conversations-widget.sendinblue.com https://www.youtube.com https://player.vimeo.com;",
  "media-src 'self' blob: https://firebasestorage.googleapis.com;",
  "worker-src 'self' blob:;"
].join(' ');

const CSP_DEV = "default-src 'self' data: blob: https: ws: wss: 'unsafe-inline' 'unsafe-eval'";

/* ── PWA / Workbox ─────────────────────────────────────────────── */
const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  fallbacks: { document: '/offline' },
  workboxOptions: {
    ignoreURLParametersMatching: [/^gtm_debug/, /^gtm_preview/, /^gtm_auth/],
    additionalManifestEntries: [],
    exclude: [/\.psd$/i, /\.psb$/i, /\.ai$/i, /\.sketch$/i, /\.fig$/i, /\.zip$/i, /\.rar$/i],
    runtimeCaching: [
      // 🔒 Nunca cachear el manifest
      {
        urlPattern: ({ url }) =>
          /\/manifest\.(?:web)?manifest$/.test(url.pathname) || url.pathname === '/manifest.webmanifest',
        handler: 'NetworkOnly',
      },
      // Widgets Brevo/Sendinblue: no cachear (para evitar estados raros)
      {
        urlPattern: ({ url }) =>
          url.origin === 'https://cdn.brevo.com' ||
          url.origin === 'https://sibautomation.com' ||
          url.origin === 'https://conversations-widget.brevo.com' ||
          url.origin === 'https://conversations-widget.sendinblue.com',
        handler: 'NetworkOnly',
      },
      // Evitar cache en llamadas de GA/Google APIs y cuando hay params de GTM debug
      {
        urlPattern: ({ url }) =>
          url.search.includes('gtm_debug') ||
          url.search.includes('gtm_preview') ||
          url.search.includes('gtm_auth') ||
          url.hostname.endsWith('googleapis.com'),
        handler: 'NetworkOnly',
      },
      // Imágenes del bucket de Firebase: CacheFirst con expiración
      {
        urlPattern: ({ url }) =>
          url.origin === 'https://firebasestorage.googleapis.com' &&
          url.pathname.startsWith(`/v0/b/${BUCKET}/o/`),
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-firebase',
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 600, maxAgeSeconds: 60 * 24 * 60 * 60 },
        },
      },
      // API local: SWR
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'api-swr',
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 200, maxAgeSeconds: 5 * 60 },
        },
      },
    ],
  },
});

/* ── Export ────────────────────────────────────────────────────── */
module.exports = withPWAConfig({
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/v0/b/**/o/**' },
    ],
  },
  transpilePackages: ['mapbox-gl'],
  async headers() {
    return [
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Permissions-Policy', value: 'accelerometer=(), gyroscope=(), magnetometer=()' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: isProd ? CSP_PROD : CSP_DEV },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Permissions-Policy', value: isProd ? PERMISSIONS_PROD : PERMISSIONS_DEV },
        ],
      },
      // Nota: mantengo tu duplicado por compatibilidad
      { source: '/:path*', headers: [{ key: 'Permissions-Policy', value: 'accelerometer=(), gyroscope=(), magnetometer=()' }] },
    ];
  },
});
