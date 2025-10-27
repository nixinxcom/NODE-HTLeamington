//Placeholders de settings para desarrollo y pruebas
//Ambos seran remplazados despues de la primer carga en la UI de settings para su almacenamiento en la Nube que despues es la unica version alineada y valida
import iSettings from '@/app/lib/settings/interface';
import FM from '@/complements/i18n/FM';

export const baseSettings: iSettings = {
  faculties: {
    adminPanel: false,
    website: true,
    agentAI: true,
    ecommerce: true,
    booking: true,
    socialmedia: true,
    sellsplatforms: true,
    products: true,
    services: true,
    contact: true,
    settings: true,
    branding: true,
    styles: true,
    maps: true,
    notifications: true,
    paypal: true,
    stripe: true,
    adsense: true
  },
  company: {
    legals: {
      Name: 'Example Company LLC SETTINGS TSX',
      TaxId: '123456789',
      BusinessNumber: '987654321',
      Email: 'info@example.com',
      Phone: '+52 55 1234 5678',
      Address: 'Av. Principal 123, City, Country',
      mapLat: 19.4326,
      mapLng: -99.1332,
      placeQuery: 'Example Company, Av. Principal 123, City, Country'
    },
    controller: {
      Name: 'Business Owner Name',
      Email: 'owner@example.com',
      Phone: '+52 55 1234 5678',
      Address: 'Av. Principal 123, City, Country',
    },
  },
  domain: {
    enabled: true,
    url: '*/example.com/*'
  },
  /** =========================
   *  AAI (OpenAI estable)
   *  - apiMode: 'chat' para /v1/chat/completions (usa max_tokens)
   *  - chat.maxTokens: mapeado correctamente a max_tokens
   *  - languages: para la UI si quieres limitar locales
   *  Para usar Gemini, ver ejemplo comentado abajo.
   *  ========================= */
  agentAI: {
    avatar: 'https://example.com/assets/avatartsx.png',
    provider: "openai",
    model: 'gpt-4o-mini',             // modelo real y estable; puedes cambiarlo desde la UI/FS
    apiMode: 'chat',                  // 'auto' | 'chat' | 'responses'
    temperature: 0.7,
    languages: ['es', 'en', 'fr'],
    chat: {                           // parámetros específicos de Chat Completions
      maxTokens: 600,
      top_p: 1
      // frequency_penalty: 0,
      // presence_penalty: 0,
      // stop: []
    },
    indiceAI: {
      Horario: ["schedule"],
      Teléfono: ["company.contact.phone"],
      Redes: ["socials"],
      Dirección: ["company.contact.address"],
      Sitio: ["company.contact.website"],
      Email: ["company.contact.email"],
      Sucursales: ["company.branches"],
      Plataformas: ["platforms"],
      Productos: ["products"],
      Servicios: ["services"],
      FAQ: ["more.FAQ"],
      Eventos: ["more.Events"],
      Ingredientes: ["more.recipeingredients"],
      Festivos: ["holidays"],
      Legales: ["company.terms", "company.privacy"],
      Misión: ["company.mission"],
      Visión: ["company.vision"],
      Valores: ["company.values"],
      Marca: ["company.brandName", "company.logo", "company.tagline", "company.legalName"],
    }
  },
  website: {
    url: 'https://example.com',
    favicon: 'https://example.com/assets/favicon.ico',
    ogDefault: { image: 'https://example.com/assets/og-default.jpg' },
    fonts: { headings: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' },
    theme: {
      aliases: {
        light: 'light',
        dark: 'dark'
      },
      initialSlot: 'dark',
      meta: { themeColor: { light: '#ffffff', dark: '#0b0b0b' } }
    },
    i18n: {
      defaultLocale: ((process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en').toLowerCase().split(/[-_]/)[0]),
      // Opción A: fija por defecto y lista en .env (p.ej. "es,en,fr")
      supported: (
        process.env.NEXT_PUBLIC_SUPPORTED_LOCALES
          ? process.env.NEXT_PUBLIC_SUPPORTED_LOCALES
              .split(',')
              .map(s => s.trim().toLowerCase().split(/[-_]/)[0])
              .filter(Boolean)
          : ['es','en','fr']
      )
    }
  },
  directUrls: {
    home: '/[locale]/(sites)',
    reservas: '/[locale]/(sites)/reservas',
    menus: '/[locale]/(sites)/menus',
    galeria: '/[locale]/(sites)/galeria',
    sobrenosotros: '/[locale]/(sites)/sobrenosotros',
    blog: '/[locale]/(sites)/blog',
    desuscritos: '/[locale]/(sites)/desuscritos',
    land: '/[locale]/(sites)/land',
    landingeng: '/[locale]/(sites)/landingeng',
    landingesp: '/[locale]/(sites)/landingesp',
    landingfra: '/[locale]/(sites)/landingfra',
    emailmarketing: '/[locale]/(sites)/emailmarketing',
    pdf: '/[locale]/(sites)/pdf',
    suscritos: '/[locale]/(sites)/suscritos',
    encuesta: '/[locale]/(kiosk)/encuesta',
    checkout: '/[locale]/(sites)/checkout'
  },
  pwa: {
    name: 'Company Name',
    shortName: 'Company Short Name',
    description: 'PWA…',
    startUrl: '/es',
    scope: '/',
    id: '/es',
    display: 'standalone',
    displayOverride: ['fullscreen', 'minimal-ui'],
    orientation: 'portrait',
    icons: [
      { src: '/Icons/manifest_icons/icon-48x48.png',  sizes: '48x48',  type: 'image/png', purpose: 'any'  },
      { src: '/Icons/manifest_icons/icon-72x72.png',  sizes: '72x72',  type: 'image/png', purpose: 'any'  },
      { src: '/Icons/manifest_icons/icon-96x96.png',  sizes: '96x96',  type: 'image/png', purpose: 'any'  },
      { src: '/Icons/manifest_icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any'  },
      { src: '/Icons/manifest_icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any'  },
      { src: '/Icons/manifest_icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'  },
      { src: '/Icons/manifest_icons/icon-256x256.png', sizes: '256x256', type: 'image/png', purpose: 'any'  },
      { src: '/Icons/manifest_icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any'  },
      { src: '/Icons/manifest_icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'  },
      { src: '/Icons/manifest_icons/icon-192x192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/Icons/manifest_icons/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ],
    screenshots: [
      {
        src: '/manifest/Screenshot1.png', sizes: '1280x536', type: 'image/png',
        label: 'Company Screenshot1', form_factor: 'wide'
      },
      {
        src: '/manifest/Screenshot2.png', sizes: '2285x2286', type: 'image/png',
        label: 'Company Screenshot2', form_factor: 'wide'
      }
    ]
  },
  more: {
    AdSense: [
      {
        client: 'ca-pub-XXXXXXXXXXXXXXXX', // your AdSense client ID
        slot: 'XXXXXXXXXX',                 // your AdSense slot ID
        style: { display: 'block' },
      },
      {
        client: 'ca-pub-XXXXXXXXXXXXXXXX', // your AdSense client ID
        slot: 'XXXXXXXXXX',                 // your AdSense slot ID
        style: { display: 'block' },
        responsive: true,
        format: 'auto',
        layoutKey: '-gw-1+2a-9x+5c'
      },
      {
        client: 'ca-pub-XXXXXXXXXXXXXXXX', // your AdSense client ID
        slot: 'XXXXXXXXXX',                 // your AdSense slot ID
        style: { display: 'block', width: 300, height: 250 },
        format: '300x250' // example of fixed size ad
      },
      {
        client: 'ca-pub-XXXXXXXXXXXXXXXX', // your AdSense client ID
        slot: 'XXXXXXXXXX',                 // your AdSense slot ID
        style: { display: 'block', width: 728, height: 90 },
        format: '728x90' // example of fixed size ad
      },
      {
        client: 'ca-pub-XXXXXXXXXXXXXXXX', // your AdSense client ID
        slot: 'XXXXXXXXXX',                 // your AdSense slot ID
        style: { display: 'block', width: 160, height: 600 },
        format: '160x600' // example of fixed size ad
      },
      {
        client: 'ca-pub-XXXXXXXXXXXXXXXX', // your AdSense client ID
        slot: 'XXXXXXXXXX',                 // your AdSense slot ID
        style: { display: 'block', width: 300, height: 600 },
        format: '300x600' // example of fixed size ad
      },
      {
        client: 'ca-pub-XXXXXXXXXXXXXXXX', // your AdSense client ID
        slot: 'XXXXXXXXXX',                 // your AdSense slot ID
        style: { display: 'block', width: 320, height: 100 },
        format: '320x100' // example of fixed size ad
      },
      {
        client: 'ca-pub-XXXXXXXXXXXXXXXX', // your AdSense client ID
        slot: 'XXXXXXXXXX',                 // your AdSense slot ID
        style: { display: 'block', width: 300, height: 100 },
        format: '300x100' // example of fixed size ad add
      },
      {
        client: 'ca-pub-XXXXXXXXXXXXXXXX', // your AdSense client ID
        slot: 'XXXXXXXXXX',                 // your AdSense slot ID
        style: { display: 'block', width: 468, height: 60 },
        format: '468x60' // example of fixed size ad
      },
    ],
  },
};

export default baseSettings;
