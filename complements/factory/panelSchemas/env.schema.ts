import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const ENV_PANEL_SCHEMA: PanelSchema = {
  id: 'env',
  labelKey: 'panels.env.title',
  iconKey: 'env',
  fsCollection: 'Providers',
  fsDocId: 'EnvVars',
  isProvider: false,
  isAgentFDV: false,
  source: 'core',
  stage: 'published',
  access: {
    allowedRoles: ['superadmin'], // aquí solo superadmin; ajusta si quieres incluir admin
  },
  version: 1,
  fields: [
    // ─────────────────────────────────────
    // TENANT / SITE BASICS
    // ─────────────────────────────────────
    {
      name: 'tenant.id',             // NIXINX_TENANT_ID
      type: 'string',
      required: true,
      groupKey: 'tenant',
    },
    {
      name: 'tenant.prodSiteUrl',    // NEXT_PUBLIC_PROD_SITE_URL
      type: 'string',
      groupKey: 'tenant',
    },
    {
      name: 'tenant.defaultLocale',  // NEXT_PUBLIC_DEFAULT_LOCALE
      type: 'string',
      groupKey: 'tenant',
    },
    {
      name: 'tenant.supportedLocales', // NEXT_PUBLIC_SUPPORTED_LOCALES (comma separated)
      type: 'string',
      groupKey: 'tenant',
    },
    {
      name: 'tenant.authFlow',       // NEXT_PUBLIC_AUTH_FLOW
      type: 'string',
      groupKey: 'tenant',
    },
    {
      name: 'tenant.gtmId',          // NEXT_PUBLIC_GTM_ID
      type: 'string',
      groupKey: 'tenant',
    },
    {
      name: 'tenant.agentId',        // NEXT_PUBLIC_AGENT_ID
      type: 'string',
      groupKey: 'tenant',
    },

    // ─────────────────────────────────────
    // FIREBASE – PUBLIC KEYS / IDS
    // ─────────────────────────────────────
    {
      name: 'firebase.apiKey',       // NEXT_PUBLIC_FIREBASE_API_KEY
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.projectId',    // NEXT_PUBLIC_FIREBASE_PROJECT_ID
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.storageBucket', // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.messagingSenderId', // NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.appId',        // NEXT_PUBLIC_FIREBASE_APP_ID
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.measurementId', // NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
      type: 'string',
      groupKey: 'firebase',
    },

    // FIREBASE – SETTINGS
    {
      name: 'firebase.authDomain',   // NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.defaultTenant', // NEXT_PUBLIC_FIREBASE_DEFAULT_TENANT
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.i18nColl',     // NEXT_PUBLIC_I18N_COLL
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.brandingDocPath', // NEXT_PUBLIC_BRANDING_DOC_PATH
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.settingsDocPath', // NEXT_PUBLIC_SETTINGS_DOC_PATH
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.stylesDocPath',   // NEXT_PUBLIC_STYLES_DOC_PATH
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.gbpLocationName', // NEXT_PUBLIC_GBP_LOCATION_NAME
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.adminSyncKey',    // NEXT_PUBLIC_ADMIN_SYNC_KEY
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.manifestOutputStoragePath', // NEXT_PUBLIC_MANIFEST_OUTPUT_STORAGE_PATH
      type: 'string',
      groupKey: 'firebase',
    },
    {
      name: 'firebase.manifestShotsStoragePath', // NEXT_PUBLIC_MANIFEST_SHOTS_STORAGE_PATH
      type: 'string',
      groupKey: 'firebase',
    },

    // FIREBASE – ADMIN SDK / KEYS
    {
      name: 'firebase.clientEmail',  // FIREBASE_CLIENT_EMAIL
      type: 'string',
      groupKey: 'firebaseKeys',
    },
    {
      name: 'firebase.adminPrivateKey', // FIREBASE_ADMIN_PRIVATE_KEY
      type: 'text',
      widget: 'textarea',           // para pegar el bloque grande con \n
      groupKey: 'firebaseKeys',
    },
    {
      name: 'firebase.fbCloudMessagesVapidKey', // NEXT_PUBLIC_FBCLOUD_MESSAGES_VAPID_KEY
      type: 'string',
      groupKey: 'firebaseKeys',
    },

    // ─────────────────────────────────────
    // GOOGLE
    // ─────────────────────────────────────
    {
      name: 'google.mapsApiKey',     // NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      type: 'string',
      groupKey: 'google',
    },
    {
      name: 'google.unrestrictedKey', // NEXT_PUBLIC_GOOGLE_UNRESTRICTED_KEY
      type: 'string',
      groupKey: 'google',
    },
    {
      name: 'google.businessProfileId', // GOOGLE_BUSINESS_PROFILE_ID
      type: 'string',
      groupKey: 'google',
    },
    {
      name: 'google.adsenseClient',  // NEXT_PUBLIC_ADSENSE_CLIENT
      type: 'string',
      groupKey: 'google',
    },

    // ─────────────────────────────────────
    // BREVO
    // ─────────────────────────────────────
    {
      name: 'brevo.apiKey',          // BREVO_APIKEY
      type: 'string',
      groupKey: 'brevo',
    },
    {
      name: 'brevo.id',              // BREVO_ID
      type: 'string',
      groupKey: 'brevo',
    },

    // ─────────────────────────────────────
    // OPENAI / AAI
    // ─────────────────────────────────────
    {
      name: 'openai.primaryKey',     // OPENAI_API_KEY
      type: 'string',
      groupKey: 'openai',
    },
    {
      name: 'openai.secondaryKey',   // ChatGPT_API_KEY u otro
      type: 'string',
      groupKey: 'openai',
    },
    {
      name: 'openai.model',          // OPENAI_MODEL
      type: 'string',
      groupKey: 'openai',
    },
    {
      name: 'openai.cacheMinutes',   // AI_CACHE_MINUTES
      type: 'number',
      min: 0,
      groupKey: 'openai',
    },

    // ─────────────────────────────────────
    // PAYPAL
    // ─────────────────────────────────────
    {
      name: 'paypal.publicClientId', // NEXT_PUBLIC_PAYPAL_CLIENT_ID
      type: 'string',
      groupKey: 'paypal',
    },
    {
      name: 'paypal.clientId',       // PAYPAL_CLIENT_ID
      type: 'string',
      groupKey: 'paypal',
    },
    {
      name: 'paypal.clientSecret',   // PAYPAL_CLIENT_SECRET
      type: 'string',
      groupKey: 'paypal',
    },
    {
      name: 'paypal.env',            // PAYPAL_ENV / NEXT_PUBLIC_PAYPAL_ENV
      type: 'string',
      groupKey: 'paypal',
    },
    {
      name: 'paypal.webhookId',      // PAYPAL_WEBHOOK_ID
      type: 'string',
      groupKey: 'paypal',
    },
    {
      name: 'paypal.sandboxApiKey',  // PAYPAL_SANDBOX_APIKEY
      type: 'string',
      groupKey: 'paypal',
    },
    {
      name: 'paypal.sandboxSecret',  // PAYPAL_SANDBOX_SECRET
      type: 'string',
      groupKey: 'paypal',
    },
    {
      name: 'paypal.liveApiKey',     // PAYPAL_LIVE_APIKEY
      type: 'string',
      groupKey: 'paypal',
    },
    {
      name: 'paypal.liveSecret',     // PAYPAL_LIVE_SECRET
      type: 'string',
      groupKey: 'paypal',
    },

    // ─────────────────────────────────────
    // STRIPE
    // ─────────────────────────────────────
    {
      name: 'stripe.publishableKey', // NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      type: 'string',
      groupKey: 'stripe',
    },
    {
      name: 'stripe.webhookSecret',  // STRIPE_WEBHOOK_SECRET
      type: 'string',
      groupKey: 'stripe',
    },
    {
      name: 'stripe.secretKey',      // STRIPE_SECRET_KEY
      type: 'string',
      groupKey: 'stripe',
    },
    {
      name: 'stripe.publicKey',      // STRIPE_PUBLIC_KEY
      type: 'string',
      groupKey: 'stripe',
    },
    {
      name: 'stripe.devPublicKey',   // STRIPE_DEV_PUBLIC_KEY
      type: 'string',
      groupKey: 'stripe',
    },
    {
      name: 'stripe.devSecretKey',   // STRIPE_DEV_SECRET_KEY
      type: 'string',
      groupKey: 'stripe',
    },

    // ─────────────────────────────────────
    // ADMIN / EMAILS / SITE
    // ─────────────────────────────────────
    {
      name: 'admin.superadminEmails', // SUPERADMIN_EMAILS
      type: 'string',
      groupKey: 'admin',
    },
    {
      name: 'admin.hardadminEmails',  // HARDADMIN_EMAILS
      type: 'string',
      groupKey: 'admin',
    },
    {
      name: 'admin.adminEmails',      // ADMIN_EMAILS
      type: 'string',
      groupKey: 'admin',
    },
    {
      name: 'admin.adminEmailDomains', // ADMIN_EMAIL_DOMAINS
      type: 'string',
      groupKey: 'admin',
    },
    {
      name: 'admin.siteName',        // SITE_NAME
      type: 'string',
      groupKey: 'admin',
    },

    // ─────────────────────────────────────
    // NODE / RDD CACHE
    // ─────────────────────────────────────
    {
      name: 'rdd.serverCacheMinutes', // SERVER_RDD_CACHE_MIN
      type: 'number',
      min: 0,
      groupKey: 'rdd',
    },
    {
      name: 'rdd.clientCacheMinutes', // CLIENT_RDD_CACHE_MIN
      type: 'number',
      min: 0,
      groupKey: 'rdd',
    },
  ],
};
