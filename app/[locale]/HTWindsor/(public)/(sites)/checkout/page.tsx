'use client';
import PayPalButtonsComp from '@/complements/components/PayPal/PayPalButtonsComp';
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

export default function CheckoutPage() {
  return (
    <main>
      <H1>Checkout de prueba</H1>
      <PayPalButtonsComp
        amount="12.34"
        currency="CAD"
        createOrderUrl="/api/paypal/create-order"
        captureOrderUrl="/api/paypal/capture-order"
        onApproved={(d) => console.log('Aprobado:', d)}
        onError={(e) => console.error('Error PayPal:', e)}
      />
    </main>
  );
}

/* 
NOTAS:
- Se eliminó únicamente el style inline (padding: 24) y se movió a checkout.module.css.
- Resto intacto: JSX, lógica y textos.
*/
  

/* ─────────────────────────────────────────────────────────
DOC: Checkout Page (app/\[locale]/(sites)/checkout/page.tsx)
QUÉ HACE:
Página de checkout del sitio. Muestra o inicia el flujo de pago y responde
al retorno del proveedor (p. ej., Stripe). Lee parámetros de URL para
identificar carrito, sesión y estado, y renderiza resumen, estado final
o errores.

RUTAS RESULTANTES:
/es/checkout   /en/checkout   /fr/checkout   (segmento (sites))

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'es' | 'en' | 'fr' }         // opcional
searchParams?: Record\<string, string | string\[] | undefined> // opcional
}
export default function Page(props: Props): JSX.Element

SEARCH PARAMS COMUNES (ajusta a tu implementación real):
cartId=string                  // opcional | id del carrito o pedido
session\_id=string              // opcional | id de sesión de pago (retorno del PSP)
status=success|canceled|error  // opcional | estado post pago
step=review|pay|result         // opcional | etapa de UI
return\_url=string              // opcional | adonde volver después del pago

USO (conceptual):

* Enlaces típicos:
  /es/checkout?cartId=abc123
  /es/checkout?status=success\&session\_id=cs\_test\_xxx
* Invocación conceptual:
  Page({
  params: { locale: 'es' },
  searchParams: {
  cartId: 'abc123',         // opcional
  session\_id: 'cs\_test...', // opcional
  status: 'success'         // opcional
  }
  })

FLUJO SUGERIDO:

1. Review: muestra resumen de carrito usando cartId.
2. Pay: crea sesión de pago en el servidor y redirige al PSP o usa client SDK.
3. Return: lee session\_id y status; verifica en el servidor y muestra resultado
   final (recibo, número de orden, instrucciones).

NOTAS:

* Page es Server Component por defecto; evita usar Web APIs del navegador aquí.
* Si necesitas Stripe.js u otro SDK en el cliente, delega a un componente con 'use client'.
* Valida siempre searchParams (tipos, presencia) y maneja estados ausentes o inválidos.
* Considera revalidate 0 si el contenido cambia por usuario y estado de pago.
* Maneja idempotencia al crear sesiones para evitar duplicados.

DEPENDENCIAS (posibles):

* Next.js App Router (params, searchParams, redirect).
* Proveedor de pago (p. ej., Stripe) vía server actions o API routes.
  ────────────────────────────────────────────────────────── */
