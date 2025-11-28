'use client';

import React from "react";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";
import styles from "./SubscribedPage.module.css";
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

export default function SubscribedPage({ locale }: Props) {
  const intl = useIntl();
  const short = shortOf(locale);

  const hrefHome = `/${short}`;
  const hrefEvents = `/${short}/blog`; // sección de próximos/pasados eventos

  return (
    <>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />

      <main className={styles.pageMain}>
        <section className={styles.card}>
          <div className={styles.iconOk}>
            <SPAN aria-hidden className="text-2xl">✅</SPAN>
          </div>

          <H1 className={styles.title}>
            <FM id="sites.sub.h1" defaultMessage="¡Suscripción confirmada!" />
          </H1>

          <P className={styles.subtitle}>
            <FM
              id="sites.sub.p1"
              defaultMessage="Gracias por unirte. Te enviaremos novedades sobre eventos, música y promociones."
            />
          </P>

          <div className={styles.actions}>
            <a
              href={hrefHome}
              className={styles.btnGhost}
              title={intl.formatMessage({ id: "sites.sub.cta.home", defaultMessage: "Ir al inicio" })}
            >
              <FM id="sites.sub.cta.home" defaultMessage="Ir al inicio" />
            </a>

            <a
              href={hrefEvents}
              className={`${styles.ctaPrimary}`}
              title={intl.formatMessage({ id: "sites.sub.cta.events", defaultMessage: "Ver eventos" })}
            >
              <FM id="sites.sub.cta.events" defaultMessage="Ver eventos" />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}