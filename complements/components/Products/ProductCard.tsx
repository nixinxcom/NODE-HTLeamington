"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BUTTON, DIV, H3, P, SPAN } from "@/complements/components/ui/wrappers";
import { GetURLSingle } from "@/functionalities/CommonFunctions/UseCloudStorageFunc";
import type { Product } from "./product.types";

type Props = {
  product: Product;
  onOpen?: (productId: string) => void;
  onAddToCart?: (input: { productId: string; qty: number }) => void;
  onToggleFavorite?: (productId: string) => void;
  isFavorite?: boolean;
};

function isProbablyUrl(v: string) {
  return /^(https?:)?\/\//i.test(v) || v.startsWith("/") || v.startsWith("data:");
}

export default function ProductCard({
  product,
  onOpen,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
}: Props) {
  const [thumbUrl, setThumbUrl] = useState<string>("");

  const rawThumb = useMemo(() => {
    const first = product.slider?.[0];
    const fromSlider = first?.src || first?.storagePath;
    const fromGallery = product.gallery?.[0];
    return (fromSlider || fromGallery || "") as string;
  }, [product.slider, product.gallery]);

  useEffect(() => {
    let cancelled = false;
    if (!rawThumb) {
      setThumbUrl("");
      return;
    }
    if (isProbablyUrl(rawThumb)) {
      setThumbUrl(rawThumb);
      return;
    }
    (async () => {
      try {
        const url = await GetURLSingle({ filePath: rawThumb, wait: false });
        if (!cancelled) setThumbUrl(url || "");
      } catch {
        if (!cancelled) setThumbUrl("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rawThumb]);

  const pricing = product.pricing ?? {};
  const price = pricing.salePrice ?? pricing.price;
  const currency = pricing.currency ?? "";

  return (
    <DIV className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
      <DIV
        className="aspect-[4/3] bg-black/30 cursor-pointer"
        onClick={() => onOpen?.(product.productId)}
      >
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <DIV className="w-full h-full flex items-center justify-center opacity-60">
            Sin imagen
          </DIV>
        )}
      </DIV>

      <DIV className="p-3 flex flex-col gap-2">
        <DIV className="flex items-start justify-between gap-2">
          <H3 className="text-base font-semibold leading-tight">
            {product.title}
          </H3>
          <BUTTON type="button" onClick={() => onToggleFavorite?.(product.productId)}>
            {isFavorite ? "★" : "☆"}
          </BUTTON>
        </DIV>

        {product.shortDescription && (
          <P className="text-sm opacity-75 line-clamp-2">{product.shortDescription}</P>
        )}

        {price != null && (
          <SPAN className="text-sm font-bold">
            {currency} {Number(price).toFixed(2)}
          </SPAN>
        )}

        <DIV className="flex gap-2">
          <BUTTON type="button" onClick={() => onOpen?.(product.productId)}>
            Ver
          </BUTTON>
          {product.ui?.allowCart !== false && (
            <BUTTON type="button" onClick={() => onAddToCart?.({ productId: product.productId, qty: 1 })}>
              Carrito
            </BUTTON>
          )}
        </DIV>
      </DIV>
    </DIV>
  );
}
