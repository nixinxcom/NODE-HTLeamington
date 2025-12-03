// app/login/page.tsx
'use client';
import AuthenticationComp from '@/complements/components/AuthenticationComp/AuthenticationComp';
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <H1 className="text-2xl font-semibold mb-6">
        <FM id="login.title" defaultMessage="Iniciar sesión" />
      </H1>
      <AuthenticationComp />
    </main>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: Login Page (app/loggin/page.tsx)
QUÉ HACE:
  Renderiza la pantalla de inicio de sesión global (sin segmento [locale]).
  Suele delegar la UI a un componente cliente (p. ej., <LoginForm/>) y coordinar:
  - Lectura de searchParams (callbackUrl, provider, error, redirect).
  - Flujo con proveedor de auth (NextAuth, propio o externo).
  - Redirección tras login correcto.

RUTA RESULTANTE:
  /loggin   (nota: si el nombre pretendido era "login", estandariza rutas y enlaces)

API / PROPS QUE NEXT INYECTA:
type Props = {
  searchParams?: {
    callbackUrl?: string                                  // opcional | a dónde redirigir tras login
    provider?: 'credentials'|'google'|'facebook'|'apple'|'github' // opcional | proveedor sugerido
    redirect?: '1'|'0'                                    // opcional | default '1' (redirigir automáticamente)
    error?: 'CredentialsSignin'|'OAuthAccountNotLinked'|'AccessDenied'|'Verification'|'Configuration'|'Default'|string // opcional | código de error
    otp?: '1'|'0'                                         // opcional | si la UI debe pedir OTP 2FA
    lang?: 'es'|'en'|'fr'                                 // opcional | forzar idioma en UI
    ref?: string                                          // opcional | fuente interna (footer, modal, gads)
  }
}
export default function Page(props: Props): JSX.Element

USO (patrón recomendado con un presentacional <LoginPage/> o <LoginForm/>):
// import LoginPage from './LoginPage' // si tienes un presentacional cliente
//
// export default async function Page({ searchParams }: Props) {
//   const callbackUrl = searchParams?.callbackUrl ?? '/'                           // opcional | string | default '/'
//   const provider    = (searchParams?.provider as 'credentials'|'google'|'github'|'facebook'|'apple'|undefined) // opcional
//   const redirect    = searchParams?.redirect !== '0'                              // opcional | boolean | default true
//   const error       = searchParams?.error ?? ''                                   // opcional | string
//   const lang        = (searchParams?.lang as 'es'|'en'|'fr') ?? 'es'              // opcional | 'es'|'en'|'fr' | default 'es'
//
//   return (
//     <LoginPage
//       lang={lang}                                    // opcional | 'es'|'en'|'fr' | default 'es'
//       errorCode={error}                              // opcional | string (mapea a mensajes legibles)
//       defaultProvider={provider}                     // opcional | 'credentials'|'google'|'github'|'facebook'|'apple'
//       callbackUrl={callbackUrl}                      // opcional | string | default '/'
//       autoRedirect={redirect}                        // opcional | boolean | default true
//       showOTP={searchParams?.otp === '1'}            // opcional | boolean | default false
//       className="mx-auto max-w-md p-6"               // opcional | string
//     />
//   )
// }

SEARCH PARAMS TÍPICOS (ejemplos de URL):
  /loggin?callbackUrl=%2Fes%2Freservas&provider=credentials
  /loggin?provider=google&redirect=1
  /loggin?error=CredentialsSignin
  /loggin?otp=1

INTEGRACIÓN CON NEXTAUTH (opcional, si usas @auth/nextjs):
  - Inicia sesión con signIn(provider, { callbackUrl, redirect }) desde el componente cliente.
  - Para credentials:
      await signIn('credentials', { email, password, callbackUrl, redirect: true })
  - Para OAuth (Google, etc.):
      await signIn('google', { callbackUrl })
  - Muestra mensajes según searchParams.error (p. ej., 'CredentialsSignin' → "Usuario o contraseña incorrectos").

SEGURIDAD:
  - Esta page es Server Component por defecto; el formulario de login debe ser Client Component ("use client").
  - Implementa rate limiting y/o reCAPTCHA en credenciales para evitar abuso.
  - No loguees contraseñas ni errores sensibles. Mapea códigos a mensajes genéricos.
  - Si usas CSRF, incluye el token (p. ej., getCsrfToken en NextAuth) en el form.
  - Usa HTTPS siempre; marca cookies como Secure/HttpOnly y SameSite apropiado.
  - Considera 2FA/OTP (email/app) si otp=1 u otra señal.

ACCESIBILIDAD:
  - Un único <H1>, labels asociadas a inputs, descripciones de error con aria-live="polite".
  - Soporte de teclado y foco claro para botones sociales.

REDIRECCIONES:
  - callbackUrl debe validarse (mismo origen) antes de redirigir para evitar open redirects.
  - Si redirect=0, devuelve estado visual de "sesión iniciada" y un botón para continuar.

DEPENDENCIAS (posibles):
  - next-auth u otro proveedor de auth.
  - Un componente cliente de formulario (LoginPage/LoginForm).
  - Librerías de UI/validación (zod/react-hook-form) si deseas.
────────────────────────────────────────────────────────── */
