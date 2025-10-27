"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FormattedMessage } from "react-intl";
import FM from "@/complements/i18n/FM";
import { FbStorage } from "@/app/lib/services/firebase";
import {
  ref as storageRef,
  listAll,
  getMetadata,
  getDownloadURL,
  type StorageReference,
} from "firebase/storage";
import styles from "./Gallery.module.css";

type GalleryItem = {
  name: string;
  url: string;
  timeCreated: string; // ISO
  w: number;
  h: number;
};

type Props = {
  locale?: string;
};

const FOLDER = "PWAStorage/Imagenes";
const SIZE_RE = /_(\d{2,4})x(\d{2,4})\.webp$/i;

function parseSize(name: string): { w: number; h: number } | null {
  const m = name.match(SIZE_RE);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

export default function GalleryPage({ locale }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const dirRef = storageRef(FbStorage, FOLDER);
        const res = await listAll(dirRef);

        const entries = await Promise.all(
          res.items.map(async (item: StorageReference) => {
            const [meta, url] = await Promise.all([getMetadata(item), getDownloadURL(item)]);
            const size = parseSize(meta.name || item.name) || { w: 700, h: 700 };
            return {
              name: meta.name || item.name,
              url,
              timeCreated: meta.timeCreated || "",
              w: size.w,
              h: size.h,
            } as GalleryItem;
          })
        );

        const filtered = entries.filter((e) => SIZE_RE.test(e.name));
        filtered.sort((a, b) => new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime());

        if (mounted) setItems(filtered);
      } catch (err) {
        console.error("[Gallery] load error:", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [locale]);

  return (
    <section className={styles.pagePad}>

      {loading && (
        <div className={styles.muted}>
          <FM id="gallery.loading" defaultMessage="Loading images…" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className={styles.muted}>
          <FM id="gallery.empty" defaultMessage="No images available right now." />
        </div>
      )}

      {/* Masonry columns: control del gap y sin cortes dentro de columnas */}
      <div className={styles.masonry}>
        {items.map((img, i) => (
          <figure
            key={img.url}
            className={`
              inline-block align-top
              w-full max-w-full
              overflow-hidden mx-auto
              [break-inside:avoid] [-webkit-column-break-inside:avoid] [-moz-column-break-inside:avoid]
              ${styles.item}
            `}
          >
            <Image
              src={img.url}
              alt={img.name}
              width={img.w}
              height={img.h}
              loading={i < 6 ? "eager" : "lazy"}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="block w-full h-auto object-cover object-center"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}