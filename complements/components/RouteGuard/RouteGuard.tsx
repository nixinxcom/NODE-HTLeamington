'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/complements/components/AuthenticationComp/AuthContext';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Role = 'anon' | 'user' | 'admin' | 'superadmin';

interface RouteGuardProps {
  children: ReactNode;
  redirectTo?: string;              // p.ej. "/login"
  allowAnonymous?: boolean;         // si true, deja pasar sin login
  autoAnon?: boolean;               // si true y no logueado, intenta anon (lo tienes desactivado en Paso 1)
  requireEmailVerified?: boolean;
  allowedUids?: string[];           // compatibilidad previa
  allowedRoles?: Role[];            // NUEVO: filtra por rol
}

export default function RouteGuard(props: RouteGuardProps) {
  const {
    children,
    redirectTo = '/',
    allowAnonymous = false,
    requireEmailVerified = false,
    allowedUids,
    allowedRoles,
  } = props;

  const router = useRouter();
  const { user, loading, userRole } = useAuthContext();

  useEffect(() => {
    if (loading) return;

    // 1) ¿Anónimo permitido?
    if (!user && allowAnonymous) return;

    // 2) ¿No autenticado?
    if (!user) {
      router.replace(redirectTo);
      return;
    }

    // 3) ¿Verificación de email requerida?
    if (requireEmailVerified && !user.emailVerified) {
      router.replace(redirectTo);
      return;
    }

    // 4) ¿UIDs permitidos explícitos?
    if (Array.isArray(allowedUids) && allowedUids.length > 0) {
      if (!allowedUids.includes(user.uid)) {
        router.replace(redirectTo);
      }
      return;
    }

    // 5) ¿Roles permitidos?
    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userRole)) {
        router.replace(redirectTo);
      }
      return;
    }

    // 6) Sin filtros = cualquier autenticado es válido
  }, [loading, user, userRole, allowAnonymous, requireEmailVerified, allowedUids, allowedRoles, redirectTo, router]);

  if (loading) return null; // o un spinner

  // Render si pasó todas las validaciones
  if (allowAnonymous && !user) return <>{children}</>;
  if (!user) return null; // ya redirigió

  // Si hay filtros y no cumple, habrá redirigido; evita flash
  if (Array.isArray(allowedUids) && allowedUids.length > 0) {
    if (!allowedUids.includes(user!.uid)) return null;
  }
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole)) return null;
  }

  return <>{children}</>;
}


/* ─────────────────────────────────────────────────────────
DOC: RouteGuard — complements/components/RouteGuard/RouteGuard.tsx
QUÉ HACE:
  Protege rutas/components según autenticación y roles. Redirige si no cumple condiciones.

API / EXPORTS / RUTA:
  — export interface RouteGuardProps {
      children: React.ReactNode;
      requireAuth?: boolean;                      // default: true
      allowedRoles?: Array<"user"|"staff"|"admin"> // opcional
      redirectTo?: string                         // default: "/loggin"
    }
  — export default function RouteGuard(p:RouteGuardProps): JSX.Element

USO (ejemplo completo):
  "use client";
  <RouteGuard allowedRoles={["admin"]}><AdminPage/></RouteGuard>

NOTAS CLAVE:
  — Solo cliente (lee AuthContext). Evitar parpadeo mostrando “cargando” mientras valida.
  — Autorización fina debe reforzarse en el servidor.

DEPENDENCIAS:
  AuthContext · next/navigation (redirect) 
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/RouteGuard/RouteGuard.tsx
  "use client";
  import RouteGuard from "@/complements/components/RouteGuard/RouteGuard";

  export default function AdminOnly() {
    return (
      <RouteGuard
        requireAuth                 // boolean | opcional | default: true
        allowedRoles={["admin"]}    // Array<"user"|"staff"|"admin"> | opcional
        redirectTo="/loggin"        // string | opcional | default: "/loggin"
      >
        <section>Panel de administración</section>
      </RouteGuard>
    );
  }
────────────────────────────────────────────────────────── */
