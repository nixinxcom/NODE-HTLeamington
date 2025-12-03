'use client';

import { useSessionBehavior } from '@/app/lib/audiences/useSessionBehavior';
import type {
  SessionEvent,
  SessionEventType,
} from '@/app/lib/audiences/sessionTypes';

/**
 * Props comunes de tracking que pueden usar TODOS los wrappers.
 *
 * - track:        ID del evento (ej: "sales.cta.headphones")
 * - trackCategory:grupo lógico (ej: "sales", "support", "nav")
 * - trigger:      texto/pieza concreta que detonó el click (ej: "Promoción de audífonos")
 * - target:       foco de marca/objetivo (ej: "headphones", "giftcards", "brandAwareness")
 * - trackMeta:    metadatos adicionales (se mezcla con trigger/target)
 */
export type TrackingProps = {
  track?: string;
  trackCategory?: string;
  trackView?: string;
  trackMeta?: Record<string, unknown>;

  /** Texto de la pieza o mensaje que disparó la acción */
  trigger?: string;

  /** Aspecto de marca / objetivo al que apunta esta acción */
  target?: string;
};

export function useTracking(props: TrackingProps) {
  const { track: trackEvent } = useSessionBehavior();

  function emit(type: SessionEventType = 'click') {
    // 1) Tag del evento
    //    - si hay track => tag = track
    //    - si no, pero hay trackCategory => tag = trackCategory
    const tag = props.track ?? props.trackCategory;
    if (!tag) return;

    // 2) Categoría:
    //    - si hay trackCategory => se usa
    //    - si no, pero hay track => se toma el prefijo antes del primer punto
    let category: string | undefined = props.trackCategory;
    if (!category && props.track) {
      category = props.track.split('.')[0] || props.track;
    }

    // 3) Meta: mezclamos trackMeta + trigger + target
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
      category,
      meta,
    };

    trackEvent(evt);
  }

  return { emit };
}

/*
Ejemplo de uso típico en un wrapper (BUTTON, LINK, etc.):

<BUTTON
  // Evento lógico
  track="sales.cta.headphones"
  trackCategory="sales"

  // Texto / pieza específica que detonó la acción
  trigger="Promoción de audífonos 2x1"

  // Foco de marca u objetivo
  target="headphones"

  // Meta extra opcional
  trackMeta={{ campaignId: "spring-2025", variant: "A" }}
>
  Ver audífonos
</BUTTON>

En Firestore (SessionBehavior.events[].meta) verás algo como:

meta: {
  trigger: "Promoción de audífonos 2x1",
  target: "headphones",
  campaignId: "spring-2025",
  variant: "A"
}
*/
