'use client';

import { useSessionBehavior } from '@/app/lib/audiences/useSessionBehavior';
import type {
  SessionEvent,
  SessionEventType,
} from '@/app/lib/audiences/sessionTypes';

// Catálogo de tracking compartido con el Campaign Center
import type {
  BehaviorCategory,
  BehaviorDomain,
  BehaviorEventType,
} from '@/app/lib/audiences/behavior.catalog';

/**
 * Props comunes de tracking que pueden usar TODOS los wrappers.
 *
 * Las cuatro etiquetas de SessionBehavior quedan así:
 *
 * - track:         ID lógico libre del evento (ej: "home.hero.cta", "menu.contact")
 * - trackCategory: categoría de negocio (ej: "revenue", "training", "agentAI")
 * - trigger:       tipo de acción (view, click, submit, play, etc.)
 * - target:        dominio / área (navigation, content, commerce, booking, etc.)
 *
 * UTM se adjunta a nivel de sesión en el Provider y NO se configura aquí.
 */
export type TrackingProps = {
  /**
   * Track = bandera / ID lógico del evento.
   * No tiene catálogo fijo: puedes usar el naming que quieras.
   * Si no lo defines, se intentará construir un tag a partir de target+category+trigger.
   */
  track?: string;

  /** Category: categoría de negocio / impacto (revenue, survey, marketing, agentAI, etc.) */
  trackCategory?: BehaviorCategory;

  /**
   * Tag específico opcional para eventos de tipo "view" (impresiones).
   * Si no se usa, las vistas también se registran con `track` o con el tag generado.
   */
  trackView?: string;

  /**
   * Trigger = tipo de acción que detonó el evento.
   * (mismo set que SessionEventType: "view", "click", "submit", "play", etc.)
   */
  trigger?: BehaviorEventType;

  /**
   * Target = dominio / área donde ocurre el evento:
   * navigation, content, commerce, booking, engagement, account, support, system, custom.
   */
  target?: BehaviorDomain;

  /** Metadatos adicionales, se mezclan con trigger/target. */
  trackMeta?: Record<string, unknown>;
};

export function useTracking(props: TrackingProps) {
  const { track: trackEvent } = useSessionBehavior();

  function emit(explicitType?: SessionEventType) {
    // Tipo final del evento:
    // 1) si se pasa explícito al llamar emit(...) => manda
    // 2) si no, usamos props.trigger si viene
    // 3) si tampoco, default "click"
    const type: SessionEventType =
      explicitType || props.trigger || "click";

    // Si no hay ninguna señal de tracking, no hacemos nada
    const hasAnyTag =
      props.track ||
      props.trackView ||
      props.trackCategory ||
      props.target ||
      props.trackMeta;

    if (!hasAnyTag) return;

    // Tag lógico del evento:
    // - si type === "view" y hay trackView => usamos trackView
    // - en otro caso, si viene track => respetamos
    // - si no, armamos algo consistente con target/category/type
    const tag =
      (type === "view" && props.trackView) ||
      props.track ||
      [props.target, props.trackCategory, type].filter(Boolean).join("::");

    // Meta: mezclamos trackMeta + info redundante útil para analytics
    const meta: Record<string, unknown> | undefined = (() => {
      const base = props.trackMeta ? { ...props.trackMeta } : {};

      if (props.trigger) {
        base.trigger = props.trigger;
      }
      if (props.target) {
        base.target = props.target;
      }

      return Object.keys(base).length > 0 ? base : undefined;
    })();

    const evt: SessionEvent = {
      t: Date.now(),
      type,
      tag,
      category: props.trackCategory,
      trigger: props.trigger,
      target: props.target,
      meta,
    };

    trackEvent(evt);
  }

  return { emit };
}

/*
Ejemplos de uso TÍPICOS en wrappers (BUTTON, LINK, etc.)
recuerda: `track` SIEMPRE debe existir en el catálogo TS
(app/lib/audiences/behavior.catalog.ts).

// CTA de hero (ventas)
<BUTTON
  track="cta.hero.primaryClick"
  trackCategory="sales"
  trigger="Hero principal - CTA 'Reservar ahora'"
  target="service:reservation"
  trackMeta={{ campaignId: "spring-2026", variant: "A" }}
>
  Reservar ahora
</BUTTON>

// Link de navegación
<A
  href="/contact"
  track="nav.menu.contactClick"
  trackCategory="nav"
  trigger="Menú principal"
  target="section:contact"
>
  Contacto
</A>

// Juego / engagement
<BUTTON
  track="engagement.game.play"
  trackCategory="engagement"
  trigger="Trivia inicial"
  target="widget:trivia"
>
  Jugar trivia
</BUTTON>
*/
