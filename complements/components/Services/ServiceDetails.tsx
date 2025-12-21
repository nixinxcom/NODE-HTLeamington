'use client';

import React, { useMemo } from 'react';
import AutoMediaCarousel from '@/complements/components/AutoMediaCarousel/AutoMediaCarousel';
import { DIV, H2, H3, P, SPAN, BUTTON, IMAGE } from '@/complements/components/ui/wrappers';
import { useStorageUrl } from '@/complements/components/Storage/useStorageUrl';
import type { Service } from './service.types';
import { formatMoney, pickT } from './service.utils';

export type ServiceDetailsProps = {
  locale: string;
  service: Service;
  isFavorite?: boolean;
  onToggleFavorite?: (serviceId: string) => void;
  onPrimaryCta?: (serviceId: string) => void;
  onAddToCart?: (serviceId: string) => void;
};

function compactAvailability(service: Service, locale: string) {
  const a = service.availability;
  if (!a) return '';
  const mode = a.bookingMode ?? 'none';
  const modeText =
    mode === 'instant'
      ? 'Reserva instantánea'
      : mode === 'request'
      ? 'Bajo solicitud'
      : '';
  const tz = a.timezone ? ` · ${a.timezone}` : '';
  const lead = typeof a.leadTimeHours === 'number' ? ` · ${a.leadTimeHours}h anticipación` : '';
  const advance = typeof a.maxAdvanceDays === 'number' ? ` · hasta ${a.maxAdvanceDays} días` : '';
  const cap = typeof a.capacityPerSlot === 'number' ? ` · cupo ${a.capacityPerSlot}` : '';
  return `${modeText}${tz}${lead}${advance}${cap}`.trim();
}

export default function ServiceDetails({
  locale,
  service,
  isFavorite,
  onToggleFavorite,
  onPrimaryCta,
  onAddToCart,
}: ServiceDetailsProps) {
  const name = pickT(service.name, locale, service.serviceId);
  const summary = pickT(service.summary, locale, '');
  const description = pickT(service.description, locale, '');
  const currency = service.pricing?.currency ?? 'CAD';

  const priceLabel = useMemo(() => {
    const p = service.pricing;
    if (!p) return '';
    if (p.priceType === 'free') return 'Gratis';
    if (p.priceType === 'quote') return 'Cotizar';
    if (typeof p.basePrice !== 'number') return '';
    const money = formatMoney(p.basePrice, currency, locale);
    if (p.priceType === 'startingAt') return `Desde ${money}`;
    return money;
  }, [service.pricing, currency, locale]);

  const coverPath = service.media?.cover || service.media?.slider?.[0]?.src || '';
  const { url: coverUrl } = useStorageUrl(coverPath);

  const hasSlider = !!service.media?.slider && service.media!.slider!.length > 0;
  const primaryLabel = pickT(service.cta?.primaryLabel, locale, 'Reservar');

  const avail = useMemo(() => compactAvailability(service, locale), [service, locale]);

  return (
    <DIV className="w-full flex flex-col gap-6">
      <DIV className="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
        {hasSlider ? (
          <AutoMediaCarousel
            slides={service.media!.slider!}
            autoplay
            loop
            showDots
            className="w-full"
            aspectRatio="16/9"
          />
        ) : coverUrl ? (
          <IMAGE src={coverUrl} alt={name} className="w-full h-72 object-cover" />
        ) : (
          <DIV className="w-full h-72 bg-white/5" />
        )}
      </DIV>

      <DIV className="flex flex-col gap-2">
        <DIV className="flex flex-wrap items-end justify-between gap-3">
          <DIV className="flex flex-col gap-1">
            <H2 className="text-xl font-bold leading-tight">{name}</H2>
            {summary && <P className="text-sm opacity-80">{summary}</P>}
          </DIV>
          {priceLabel && (
            <SPAN className="text-sm opacity-90 whitespace-nowrap">{priceLabel}</SPAN>
          )}
        </DIV>

        {avail && <P className="text-xs opacity-70">{avail}</P>}

        <DIV className="mt-2 flex flex-wrap gap-2">
          <BUTTON type="button" onClick={() => onPrimaryCta?.(service.serviceId)}>
            {primaryLabel}
          </BUTTON>

          {service.flags?.allowCart && (
            <BUTTON type="button" onClick={() => onAddToCart?.(service.serviceId)}>
              Agregar
            </BUTTON>
          )}

          {service.flags?.allowFavorites && (
            <BUTTON type="button" onClick={() => onToggleFavorite?.(service.serviceId)}>
              {isFavorite ? '★ Favorito' : '☆ Favorito'}
            </BUTTON>
          )}
        </DIV>
      </DIV>

      {description && (
        <DIV className="border border-white/10 rounded-2xl bg-black/40 p-4">
          <H3 className="text-base font-semibold mb-2">Descripción</H3>
          <P className="text-sm opacity-85 whitespace-pre-line">{description}</P>
        </DIV>
      )}

      {!!service.packages?.length && (
        <DIV className="border border-white/10 rounded-2xl bg-black/40 p-4">
          <H3 className="text-base font-semibold mb-3">Paquetes</H3>
          <DIV className="flex flex-col gap-3">
            {service.packages!.map((p) => {
              const pName = pickT(p.name, locale, p.packageId);
              const pDesc = pickT(p.description, locale, '');
              const pPrice =
                typeof p.price === 'number'
                  ? formatMoney(p.price, currency, locale)
                  : '';
              return (
                <DIV
                  key={p.packageId}
                  className="border border-white/10 rounded-xl p-3"
                >
                  <DIV className="flex items-start justify-between gap-3">
                    <DIV className="flex flex-col gap-1">
                      <P className="text-sm font-semibold">{pName}</P>
                      {pDesc && <P className="text-xs opacity-80">{pDesc}</P>}
                      {typeof p.durationMinutes === 'number' && (
                        <P className="text-xs opacity-70">{p.durationMinutes} min</P>
                      )}
                    </DIV>
                    {pPrice && <SPAN className="text-xs opacity-90">{pPrice}</SPAN>}
                  </DIV>
                </DIV>
              );
            })}
          </DIV>
        </DIV>
      )}
    </DIV>
  );
}
