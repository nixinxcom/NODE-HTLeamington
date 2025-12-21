'use client';

import React, { useMemo } from 'react';
import AutoMediaCarousel from '@/complements/components/AutoMediaCarousel/AutoMediaCarousel';
import { DIV, H3, P, BUTTON, SPAN, LINK, IMAGE } from '@/complements/components/ui/wrappers';
import { useStorageUrl } from '@/complements/components/Storage/useStorageUrl';
import type { Service } from './service.types';
import { formatMoney, pickT } from './service.utils';

export type ServiceCardProps = {
  locale: string;
  service: Service;
  href?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (serviceId: string) => void;
  onPrimaryCta?: (serviceId: string) => void;
  onAddToCart?: (serviceId: string) => void;
};

export default function ServiceCard({
  locale,
  service,
  href,
  isFavorite,
  onToggleFavorite,
  onPrimaryCta,
  onAddToCart,
}: ServiceCardProps) {
  const name = pickT(service.name, locale, service.serviceId);
  const summary = pickT(service.summary, locale, '');
  const currency = service.pricing?.currency ?? 'CAD';

  const hasSlider = !!service.media?.slider && service.media!.slider!.length > 0;
  const coverPath = service.media?.cover || service.media?.slider?.[0]?.src || '';
  const { url: coverUrl } = useStorageUrl(coverPath);

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

  const primaryLabel = pickT(service.cta?.primaryLabel, locale, 'Reservar');

  return (
    <DIV className="border border-white/10 rounded-xl overflow-hidden bg-black/40 flex flex-col">
      <DIV className="relative w-full">
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
          <IMAGE
            src={coverUrl}
            alt={name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <DIV className="w-full h-48 bg-white/5" />
        )}
      </DIV>

      <DIV className="p-4 flex flex-col gap-2">
        <DIV className="flex items-start justify-between gap-3">
          <H3 className="text-base font-semibold leading-snug">
            {href ? <LINK href={href}>{name}</LINK> : name}
          </H3>
          {priceLabel && (
            <SPAN className="text-xs opacity-80 whitespace-nowrap">{priceLabel}</SPAN>
          )}
        </DIV>

        {summary && <P className="text-sm opacity-80">{summary}</P>}

        <DIV className="mt-2 flex flex-wrap gap-2">
          <BUTTON
            type="button"
            onClick={() => onPrimaryCta?.(service.serviceId)}
          >
            {primaryLabel}
          </BUTTON>

          {service.flags?.allowCart && (
            <BUTTON
              type="button"
              onClick={() => onAddToCart?.(service.serviceId)}
            >
              Agregar
            </BUTTON>
          )}

          {service.flags?.allowFavorites && (
            <BUTTON
              type="button"
              onClick={() => onToggleFavorite?.(service.serviceId)}
            >
              {isFavorite ? '★ Favorito' : '☆ Favorito'}
            </BUTTON>
          )}
        </DIV>
      </DIV>
    </DIV>
  );
}
