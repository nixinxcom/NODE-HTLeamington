"use client";

import React, { useEffect, useMemo, useState } from "react";
import AutoMediaCarousel, { type MediaSlide } from "@/complements/components/AutoMediaCarousel/AutoMediaCarousel";
import { BUTTON, DIV, H2, P, SELECT, SPAN } from "@/complements/components/ui/wrappers";
import { GetURLSingle } from "@/functionalities/CommonFunctions/UseCloudStorageFunc";
import type { Product, ProductVariant } from "./product.types";

type Props = {
  product: Product;
  /** Si no hay sistema de carrito aún, pasa un callback y listo. */
  onAddToCart?: (input: { productId: string; variantId?: string; qty: number }) => void;
  onBuyNow?: (input: { productId: string; variantId?: string; qty: number }) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: boolean;
  initialQty?: number;
};

function isProbablyUrl(v: string) {
  return /^(https?:)?\/\//i.test(v) || v.startsWith("/") || v.startsWith("data:");
}

function pickVariantLabel(v: ProductVariant) {
  const pairs = v.optionValues ?? [];
  if (pairs.length === 0) return v.variantId;
  return `${v.variantId} — ${pairs.map((p) => `${p.name}:${p.value}`).join(" · ")}`;
}

export default function ProductDetails({
  product,
  onAddToCart,
  onBuyNow,
  onToggleFavorite,
  isFavorite = false,
  initialQty = 1,
}: Props) {
  const variants = product.variants?.filter((v) => v?.variantId) ?? [];
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null;
  const [variantId, setVariantId] = useState<string>(defaultVariant?.variantId ?? "");
  const [qty, setQty] = useState<number>(Math.max(1, Math.floor(initialQty || 1)));

  const selectedVariant = useMemo(() => {
    if (!variantId) return defaultVariant;
    return variants.find((v) => v.variantId === variantId) ?? defaultVariant;
  }, [variantId, variants, defaultVariant]);

  // ─────────────────────────────
  // Resolver rutas de Storage a URLs (solo para mostrar media)
  // ─────────────────────────────
  const [resolved, setResolved] = useState<Record<string, string>>({});

  const wantedPaths = useMemo(() => {
    const paths = new Set<string>();

    (product.slider ?? []).forEach((s) => {
      if (s?.storagePath && !isProbablyUrl(s.storagePath)) paths.add(s.storagePath);
      if (s?.posterStoragePath && !isProbablyUrl(s.posterStoragePath)) paths.add(s.posterStoragePath);
    });

    (product.gallery ?? []).forEach((g) => {
      if (typeof g === "string" && g && !isProbablyUrl(g)) paths.add(g);
    });

    (product.videos ?? []).forEach((v) => {
      if (v?.storagePath && !isProbablyUrl(v.storagePath)) paths.add(v.storagePath);
    });

    if (selectedVariant?.image && !isProbablyUrl(selectedVariant.image)) {
      paths.add(selectedVariant.image);
    }

    return Array.from(paths);
  }, [product.slider, product.gallery, product.videos, selectedVariant?.image]);

  useEffect(() => {
    let cancelled = false;

    const missing = wantedPaths.filter((p) => !resolved[p]);
    if (missing.length === 0) return;

    (async () => {
      const updates: Record<string, string> = {};
      await Promise.all(
        missing.map(async (p) => {
          try {
            const url = await GetURLSingle({ filePath: p, wait: false });
            if (url) updates[p] = url;
          } catch {
            // No bloquees la UI por esto.
          }
        })
      );

      if (cancelled) return;
      if (Object.keys(updates).length > 0) {
        setResolved((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wantedPaths, resolved]);

  const slides: MediaSlide[] = useMemo(() => {
    const out: MediaSlide[] = [];

    const base = (product.slider ?? []).length
      ? product.slider ?? []
      : (product.gallery ?? []).map((g) => ({ kind: "image" as const, src: g }));

    for (const s of base as any[]) {
      const kind = (s.kind ?? "image") as MediaSlide["kind"];

      const raw = (s.src || s.storagePath || "") as string;
      if (!raw) continue;

      const src = isProbablyUrl(raw) ? raw : (resolved[raw] ?? "");
      if (!src) continue;

      const rawPoster = (s.poster || s.posterStoragePath || "") as string;
      const poster = rawPoster
        ? isProbablyUrl(rawPoster)
          ? rawPoster
          : resolved[rawPoster]
        : undefined;

      out.push({
        kind,
        src,
        alt: s.alt,
        durationMs: s.durationMs,
        href: s.href,
        target: s.target,
        poster,
      });
    }

    return out;
  }, [product.slider, product.gallery, resolved]);

  const pricing = product.pricing ?? {};
  const effPrice = selectedVariant?.salePrice ?? selectedVariant?.price ?? pricing.salePrice ?? pricing.price;
  const basePrice = selectedVariant?.price ?? pricing.price;
  const currency = pricing.currency ?? "";

  const canCart = product.ui?.allowCart !== false;
  const canFav = product.ui?.allowFavorites !== false;

  return (
    <DIV className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DIV className="rounded-xl border border-white/10 bg-black/20 p-3">
        {slides.length > 0 ? (
          <AutoMediaCarousel
            slides={slides}
            autoplay={product.ui?.sliderAutoplay ?? true}
            interval={product.ui?.sliderIntervalMs ?? 5000}
            showDots
            pauseOnHover
            className="rounded-xl overflow-hidden"
            aspectRatio="4/3"
          />
        ) : (
          <DIV className="aspect-[4/3] flex items-center justify-center opacity-60">
            Sin media
          </DIV>
        )}
      </DIV>

      <DIV className="flex flex-col gap-3">
        <DIV>
          <H2 className="text-2xl font-semibold">{product.title}</H2>
          {product.subtitle && (
            <P className="opacity-75 mt-1">{product.subtitle}</P>
          )}
        </DIV>

        {(effPrice != null || basePrice != null) && (
          <DIV className="flex items-end gap-3">
            {effPrice != null && (
              <SPAN className="text-2xl font-bold">
                {currency} {Number(effPrice).toFixed(2)}
              </SPAN>
            )}
            {basePrice != null && effPrice != null && basePrice !== effPrice && (
              <SPAN className="line-through opacity-60">
                {currency} {Number(basePrice).toFixed(2)}
              </SPAN>
            )}
          </DIV>
        )}

        {product.shortDescription && (
          <P className="text-sm opacity-80">{product.shortDescription}</P>
        )}

        {variants.length > 0 && (
          <DIV className="flex flex-col gap-1">
            <SPAN className="text-xs font-semibold opacity-70">
              Variante
            </SPAN>
            <SELECT value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              {variants.map((v) => (
                <option key={v.variantId} value={v.variantId}>
                  {pickVariantLabel(v)}
                </option>
              ))}
            </SELECT>
          </DIV>
        )}

        <DIV className="flex items-center gap-3">
          <SPAN className="text-xs font-semibold opacity-70">Qty</SPAN>
          <DIV className="flex items-center gap-2">
            <BUTTON type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              -
            </BUTTON>
            <SPAN className="min-w-[2ch] text-center">{qty}</SPAN>
            <BUTTON type="button" onClick={() => setQty((q) => q + 1)}>
              +
            </BUTTON>
          </DIV>
        </DIV>

        <DIV className="flex flex-wrap gap-2">
          {canCart && (
            <BUTTON
              type="button"
              onClick={() =>
                onAddToCart?.({ productId: product.productId, variantId: selectedVariant?.variantId, qty })
              }
            >
              Agregar al carrito
            </BUTTON>
          )}
          {canCart && (
            <BUTTON
              type="button"
              onClick={() =>
                onBuyNow?.({ productId: product.productId, variantId: selectedVariant?.variantId, qty })
              }
            >
              Comprar ahora
            </BUTTON>
          )}
          {canFav && (
            <BUTTON type="button" onClick={() => onToggleFavorite?.(product.productId)}>
              {isFavorite ? "★ Favorito" : "☆ Favorito"}
            </BUTTON>
          )}
        </DIV>

        {(product.features?.length ?? 0) > 0 && (
          <DIV className="rounded-xl border border-white/10 p-3 bg-black/20">
            <SPAN className="text-xs font-semibold opacity-70">Características</SPAN>
            <ul className="list-disc pl-5 mt-2 text-sm opacity-80">
              {product.features!.slice(0, 8).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </DIV>
        )}

        {(product.specs?.length ?? 0) > 0 && (
          <DIV className="rounded-xl border border-white/10 p-3 bg-black/20">
            <SPAN className="text-xs font-semibold opacity-70">Especificaciones</SPAN>
            <DIV className="mt-2 flex flex-col gap-1 text-sm opacity-80">
              {product.specs!
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .slice(0, 10)
                .map((s, i) => (
                  <DIV key={i} className="flex justify-between gap-3">
                    <SPAN className="opacity-70">{s.key}</SPAN>
                    <SPAN className="text-right">
                      {s.value}
                      {s.unit ? ` ${s.unit}` : ""}
                    </SPAN>
                  </DIV>
                ))}
            </DIV>
          </DIV>
        )}
      </DIV>
    </DIV>
  );
}
