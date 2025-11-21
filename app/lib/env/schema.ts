import { z } from 'zod';

export const envSchema = z.object({
    // ===== Firebase Web (cliente) =====
    NEXT_PUBLIC_FIREBASE_DEFAULT_TENANT: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.union([z.string().min(1), z.number()]).transform(String),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),

    // ===== Preferencias/i18n en público =====
    NEXT_PUBLIC_PROD_SITE_URL: z.string().url(),
    NEXT_PUBLIC_I18N_COLL: z.literal('i18n_global'),
    NEXT_PUBLIC_BRANDING_DOC_PATH: z.literal('branding/default'),
    NEXT_PUBLIC_SETTINGS_DOC_PATH: z.literal('settings/default'),
    NEXT_PUBLIC_STYLES_DOC_PATH: z.literal('styles/default'),
    NEXT_PUBLIC_MANIFEST_OUTPUT_STORAGE_PATH: z.literal('manifest/icons'),
    NEXT_PUBLIC_MANIFEST_SHOTS_STORAGE_PATH: z.literal('manifest/screenshots'),
    NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['es','en','fr']),
    NEXT_PUBLIC_SUPPORTED_LOCALES: z.enum(['en','es','fr','en,es','en,fr','es,fr','en,es,fr']),
    NEXT_PUBLIC_AUTH_FLOW: z.literal('redirect'),

    // ===== Integraciones públicas =====
    NEXT_PUBLIC_GTM_ID: z.string().min(1),
    NEXT_PUBLIC_AGENT_ID: z.literal('default'),
    NEXT_PUBLIC_ADSENSE_CLIENT: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID_POINTS: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID_PREPAID: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID_PROMISE: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
    NEXT_PUBLIC_GOOGLE_UNRESTRICTED_KEY: z.string().optional(),
    NEXT_PUBLIC_FBCLOUD_MESSAGES_VAPID_KEY: z.string().optional(),
    NEXT_PUBLIC_PAYPAL_ENV: z.literal('sandbox').default('sandbox'),
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().optional(),

    // ===== Server-only (no exponer en cliente) =====
    AGENT_ALLOW_ADMIN_FALLBACK: z.boolean().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
    FIREBASE_PRIVATE_KEY: z.string().min(10),
    GOOGLE_BUSINESS_PROFILE_ID: z.union([z.string(), z.number()]).transform(String).optional(),
    BREVO_ID: z.string().optional(),
    BREVO_APIKEY: z.string().optional(),
    SUPERADMIN_EMAILS: z.string().optional(),
    HARDADMIN_EMAILS: z.string().optional(),
    ADMIN_EMAILS: z.string().optional(),
    ADMIN_EMAIL_DOMAINS: z.string().optional(),
    SITE_NAME: z.string().min(1),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.literal('gpt-5-nano').default('gpt-5-nano'),
    AI_CACHE_MINUTES: z.coerce.number().default(0),
    SERVER_RDD_CACHE_MIN: z.coerce.number().default(0),
    CLIENT_RDD_CACHE_MIN: z.coerce.number().default(0),
    PAYPAL_SANDBOX_APIKEY: z.string().optional(),
    PAYPAL_SANDBOX_SECRET: z.string().optional(),
    PAYPAL_LIVE_APIKEY: z.string().optional(),
    PAYPAL_LIVE_SECRET: z.string().optional(),
    PAYPAL_CLIENT_ID: z.string().optional(),
    PAYPAL_CLIENT_SECRET: z.string().optional(),
    PAYPAL_ENV: z.literal('sandbox').default('sandbox').optional(),
    PAYPAL_WEBHOOK_ID: z.string().optional(),
    STRIPE_PUBLIC_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_DEV_PUBLIC_KEY: z.string().optional(),
    STRIPE_DEV_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
});


export type iEnvVars = z.infer<typeof envSchema>;