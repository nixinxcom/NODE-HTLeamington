import type { iEnvVars } from './schema';


type Meta = { label: string; placeholder?: string; doc?: string; secret?: boolean; serverOnly?: boolean; readOnly?: boolean };
export const envMeta: Partial<Record<keyof iEnvVars, Meta>> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: { label: 'Firebase API Key', placeholder: 'AIzaSyA...abcd', doc: 'https://firebase.google.com/docs/web/setup' },
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: { label: 'Auth Domain', placeholder: 'acme.web.app' },
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: { label: 'Project ID', placeholder: 'acme-prod' },
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: { label: 'Storage Bucket', placeholder: 'acme-prod.appspot.com' },
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: { label: 'Sender ID', placeholder: '123456789012' },
    NEXT_PUBLIC_FIREBASE_APP_ID: { label: 'App ID', placeholder: '1:123...:web:abc' },
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: { label: 'Measurement ID', placeholder: 'G-XXXXXXX' },
    NEXT_PUBLIC_PROD_SITE_URL: { label: 'Site URL', placeholder: 'https://cliente.com' },
    NEXT_PUBLIC_I18N_COLL: { label: 'I18N collection', placeholder: 'i18n_global', readOnly: true },
    NEXT_PUBLIC_BRANDING_DOC_PATH: { label: 'Branding doc path', placeholder: 'branding/default', readOnly: true },
    NEXT_PUBLIC_SETTINGS_DOC_PATH: { label: 'Settings doc path', placeholder: 'settings/default', readOnly: true },
    NEXT_PUBLIC_STYLES_DOC_PATH: { label: 'Styles doc path', placeholder: 'styles/default', readOnly: true },
    NEXT_PUBLIC_MANIFEST_OUTPUT_STORAGE_PATH: { label: 'Manifest icons path', placeholder: 'manifest/icons', readOnly: true },
    NEXT_PUBLIC_MANIFEST_SHOTS_STORAGE_PATH: { label: 'Manifest screenshots path', placeholder: 'manifest/screenshots', readOnly: true },
    NEXT_PUBLIC_DEFAULT_LOCALE: { label: 'Default locale', placeholder: 'es' },
    NEXT_PUBLIC_SUPPORTED_LOCALES: { label: 'Supported locales', placeholder: 'en,es,fr' },
    NEXT_PUBLIC_AUTH_FLOW: { label: 'Auth flow', placeholder: 'redirect', readOnly: true },NEXT_PUBLIC_GTM_ID: { label: 'GTM ID', placeholder: 'GTM-XXXXXXX' },
    NEXT_PUBLIC_AGENT_ID: { label: 'Agent ID', placeholder: 'default', readOnly: true },
    NEXT_PUBLIC_ADSENSE_CLIENT: { label: 'Adsense client' },
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: { label: 'Stripe publishable key' },
    NEXT_PUBLIC_GOOGLE_MAPS_JS_API_KEY: { label: 'Google Maps JS key' },
    NEXT_PUBLIC_FCM_VAPID_KEY: { label: 'FCM VAPID public key', doc: 'https://console.firebase.google.com/ → Cloud Messaging → Web Push' },


    FIREBASE_PRIVATE_KEY: { label: 'Firebase Admin Private Key', secret: true, serverOnly: true, doc: 'https://firebase.google.com/docs/admin/setup' },
    FIREBASE_CLIENT_EMAIL: { label: 'Firebase Admin Client Email', serverOnly: true },
    OPENAI_API_KEY: { label: 'OpenAI API Key', secret: true, serverOnly: true, doc: 'https://platform.openai.com/api-keys' },
    STRIPE_SECRET_KEY: { label: 'Stripe secret', secret: true, serverOnly: true },
    STRIPE_WEBHOOK_SECRET: { label: 'Stripe webhook secret', secret: true, serverOnly: true },
    PAYPAL_LIVE_SECRET: { label: 'PayPal live secret', secret: true, serverOnly: true },
};