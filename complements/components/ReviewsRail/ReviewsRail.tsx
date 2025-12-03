"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FbDB } from "@/app/lib/services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as qLimit,
} from "firebase/firestore";
import FM from "@/complements/i18n/FM";
import { useParams } from "next/navigation";
import styles from "./ReviewsRail.module.css";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";


type ReviewDoc = {
  comment?: string | null;
  success?: boolean;
  locale?: string;
  ts?: any;           // Timestamp
  name?: string|null; // opcional (si algún día guardas nombre)
};

type Props = {
  /** Título mostrado arriba del carrusel */
  title?: React.ReactNode;
  /** Cuántas reseñas mostrar (default 20) */
  limit?: number;
  /** Locales aceptados (prioritarios). Si no lo pasas, detecta navigator/localStorage */
  locales?: string[];
  /** Clases extra para el <section> contenedor */
  className?: string;
};

export default function ReviewsRail({
  title = <FM id="ReviewsRail.title" defaultMessage="What our guests say" />,
  limit = 20,
  locales,
  className = "",
}: Props) {
  const [rows, setRows] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Locale actual de la ruta (/[locale]/...); cambia al navegar entre es/en/fr
  const params = useParams() as { locale?: string };
  const routeLocale = (params?.locale as string | undefined) || undefined;
  const activeLocale = useMemo(() => {
    if (locales?.length) return locales[0];           // si te pasan locales por prop, respeta el primero
    const raw =
      routeLocale ||
      (typeof window !== "undefined" &&
        (localStorage.getItem("locale") || navigator.language)) ||
      "en";
    return toShortLocale(String(raw));
  }, [locales, routeLocale]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const col = collection(FbDB, "surveys");

        // 1) Intento óptimo con filtro por locale en servidor
        try {
          const q1 = query(
            col,
            where("success", "==", true),
            where("locale", "==", activeLocale),
            orderBy("ts", "desc"),
            qLimit(limit)
          );
          const snap = await getDocs(q1);
          if (cancelled) return;
          const list: ReviewDoc[] = [];
          snap.forEach((d) => list.push(d.data() as any));
          setRows(list.filter((r) => r.comment));
        } catch (e: any) {
        // 2) Fallback por si falta índice: traemos y filtramos por locale exacto en cliente
          console.warn("[ReviewsRail] locale-index fallback:", e?.message);
          const q2 = query(
            col,
            where("success", "==", true),
            orderBy("ts", "desc"),
            qLimit(100) // traemos un poco más y filtramos
          );
          const snap = await getDocs(q2);
          if (cancelled) return;

          const wanted = String(activeLocale).toLowerCase();
          const list: ReviewDoc[] = [];
          snap.forEach((d) => {
            const r = d.data() as any;
            const loc = (r.locale || "").toLowerCase();
            if (r.comment && (loc === wanted || loc.split("-")[0] === wanted)) {
              list.push(r);
            }
          });
          setRows(list.slice(0, limit));
        }
      } catch (err: any) {
        console.error("[ReviewsRail] read error:", err);
        setError(err?.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit, activeLocale]);

  const authorFor = (r: ReviewDoc) =>
    r.name || (r.locale?.startsWith("es") ? "— Invitado" : "— Guest");

  return (
    <section className={`w-full ${className}`} key={`reviews-${activeLocale}`}>
      <H4 className={`text-center ${styles.title}`}>{title}</H4>

      {loading ? (
        <P className={`text-center ${styles.muted}`}><FM id="ReviewsRail.loading" defaultMessage="Loading…" /></P>
      ) : rows.length === 0 ? (
        <>
        <P className={`text-center ${styles.muted}`}>
          <FM id="ReviewsRail.nocomments" defaultMessage="No Comments at the moment" />
        </P>
        </>
      ) : (
        <div className={styles.railWrap}>
          <div className={styles.rail}>
            {rows.map((r, i) => (
              <div
                key={i}
                className={styles.card}
              >
                <P className="italic">{r.comment}</P>
                <P className={styles.author}>{authorFor(r)}</P>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No mostramos el error al usuario; lo dejamos en consola */}
      {error ? (console.error("[ReviewsRail] error:", error), null) : null}
    </section>
  );
}