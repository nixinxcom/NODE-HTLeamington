'use client';

import React, { useMemo } from "react";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import { FormattedMessage } from "react-intl";
import FM from "@/complements/i18n/FM";
import styles from "./UnsubscribedPage.module.css";
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Props = { locale: string };

// Normaliza "es-MX" | "en-US" | "fr-CA" → "es" | "en" | "fr"
function shortOf(input?: string): "es" | "en" | "fr" {
  if (!input) return "es";
  const v = String(input).toLowerCase();
  if (v.startsWith("es")) return "es";
  if (v.startsWith("fr")) return "fr";
  return "en";
}

export default function UnsubscribedPage({ locale }: Props) {
  const short = useMemo(() => shortOf(locale), [locale]);

  const hrefResub = `/${short}/land`;
  const hrefHome  = `/${short}`;

  return (
    <>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />

      <main className={styles.pageMain}>
        <section className={styles.card}>
          <div className={styles.iconDanger}>
            <SPAN aria-hidden className="text-2xl">🚫</SPAN>
          </div>

          <H1 className={styles.title}>
            <FM
              id="sites.unsub.h1"
              defaultMessage="Has cancelado tu suscripción"
            />
          </H1>

          <P className={styles.subtitle}>
            <FM
              id="sites.unsub.p1"
              defaultMessage="Lamentamos verte partir. Si cambias de opinión, puedes volver a suscribirte cuando quieras."
            />
          </P>

          <div className="mt-8 flex items-center justify-center gap-3">
            <a href={hrefResub} className={styles.btnPrimary}>
              <FM
                id="sites.unsub.cta.resub"
                defaultMessage="Volver a suscribirme"
              />
            </a>
            <a href={hrefHome} className={styles.btnGhost}>
              <FM
                id="sites.unsub.cta.home"
                defaultMessage="Ir al inicio"
              />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}