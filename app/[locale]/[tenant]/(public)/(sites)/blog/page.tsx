"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FbDB } from "@/app/lib/services/firebase";
import { collection, getDocs, orderBy, query, limit as qLimit } from "firebase/firestore";
import BlogCard, { EventDoc } from "@/complements/components/BlogCardComp/BlogCardComp";
import styles from "./blog.module.css";
import { FormattedMessage } from "react-intl";
import FM from "@/complements/i18n/FM";
import { withPageMetadata } from "@/app/lib/seo/withPageMetadata";

/* Utilidades de fecha */
function todayInTZ(tz = "America/Toronto"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date())
   .reduce<Record<string,string>>((a,p)=>((a[p.type]=p.value),a),{});
  const yyyy = parts.year ?? "1970";
  const mm = parts.month ?? "01";
  const dd = parts.day ?? "01";
  return `${yyyy}-${mm}-${dd}`;
}
function eventTime(ev: EventDoc): number {
  if (ev?.date) { const hhmm = (ev.startTime ?? "00:00").padStart(5,"0"); return new Date(`${ev.date}T${hhmm}:00`).getTime(); }
  if (ev.startAt) return new Date(ev.startAt).getTime();
  return 0;
}

export default function BlogPage() {
  const { locale: pLocale } = useParams<{ locale?: string }>();
  const locale = (typeof pLocale === "string" && pLocale) || "es";

  const [rows, setRows] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const col = collection(FbDB, "events");
        // Traemos bastantes y luego partimos en próximos/pasados
        const q1 = query(col, orderBy("date", "desc"), qLimit(200));
        const snap = await getDocs(q1);
        const list: EventDoc[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        if (mounted) setRows(list);
      } catch (e) {
        console.error("[blog] load events error:", e);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const { upcoming, past } = useMemo(() => {
    const up: EventDoc[] = [];
    const pa: EventDoc[] = [];
    const todayStr = todayInTZ();

    rows.forEach((ev) => {
      const future = (typeof ev.date === "string" && ev.date >= todayStr) || eventTime(ev) >= Date.now();
      if (future) up.push(ev); else pa.push(ev);
    });

    // próximos ASC, pasados DESC
    up.sort((a,b) => eventTime(a) - eventTime(b));
    pa.sort((a,b) => eventTime(b) - eventTime(a));

    return { upcoming: up, past: pa };
  }, [rows]);

  return (
    <main>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            <FM id="sites.blog.h1" defaultMessage="Eventos" />
          </h1>
          <p className={styles.subtitle}>
            <FM
              id="sites.blog.subtitle"
              defaultMessage="Explora nuestros próximos y pasados eventos."
            />
          </p>
        </header>

        {loading ? (
          <div className={styles.loading}>
            <span>
              <FM id="sites.blog.loading" defaultMessage="Cargando..." />
            </span>
          </div>
        ) : (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <FM id="sites.blog.upcoming.title" defaultMessage="Próximos" />
              </h2>
              {upcoming.length ? (
                <div className={styles.masonry}>
                  {upcoming.map((ev) => (
                    <BlogCard key={ev.id || ev.slug} event={ev} locale={locale} variant="upcoming" />
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>
                  <FM
                    id="sites.blog.upcoming.empty"
                    defaultMessage="Aún no hay próximos eventos."
                  />
                </p>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <FM id="sites.blog.past.title" defaultMessage="Eventos pasados" />
              </h2>
              {past.length ? (
                <div className={styles.masonry}>
                  {past.map((ev) => (
                    <BlogCard key={ev.id || ev.slug} event={ev} locale={locale} variant="past" />
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>
                  <FM
                    id="sites.blog.past.empty"
                    defaultMessage="Aún no hay eventos pasados."
                  />
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}