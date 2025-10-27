'use client';

import React from "react";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";
import styles from "./EmailmarketingPage.module.css";

type Props = { locale: string };

// Normaliza "es-MX" | "en-US" | "fr-CA" → "es" | "en" | "fr"
function shortOf(input?: string): "es" | "en" | "fr" {
  if (!input) return "es";
  const v = String(input).toLowerCase();
  if (v.startsWith("es")) return "es";
  if (v.startsWith("fr")) return "fr";
  return "en";
}

export default function EmailmarketingPage({ locale }: Props) {
  const intl = useIntl();
  const short = shortOf(locale);

  const hrefSubscribe = `/${short}/suscritos`;     // página de confirmación de suscripción
  const hrefUnsubscribe = `/${short}/desuscritos`; // página de cancelación

  return (
    <>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />

      <main className={styles.pageMain}>
        <section className={styles.card}>
          <div className={styles.iconOk}>
            <span aria-hidden className="text-2xl">✉️</span>
          </div>

          <h1 className={styles.title}>
            <FM id="sites.mail.h1" defaultMessage="Suscripción a correos" />
          </h1>

          <p className={styles.subtitle}>
            <FM
              id="sites.mail.subtitle"
              defaultMessage="Suscríbete para enterarte de eventos, música y promociones."
            />
          </p>

          <div className={styles.actionsGrid}>
            <a
              href={hrefSubscribe}
              className={styles.btnPrimary}
              title={intl.formatMessage({ id: "sites.mail.cta.subscribe", defaultMessage: "Quiero suscribirme" })}
            >
              <FM id="sites.mail.cta.subscribe" defaultMessage="Quiero suscribirme" />
            </a>

            <a
              href={hrefUnsubscribe}
              className={styles.btnGhost}
              title={intl.formatMessage({ id: "sites.mail.cta.unsubscribe", defaultMessage: "Cancelar suscripción" })}
            >
              <FM id="sites.mail.cta.unsubscribe" defaultMessage="Cancelar suscripción" />
            </a>
          </div>

          <p className={styles.note}>
            <FM
              id="sites.mail.privacy"
              defaultMessage="Respetamos tu privacidad. Solo te enviaremos correos relevantes y no compartiremos tus datos."
            />
          </p>
        </section>
      </main>
    </>
  );
}
