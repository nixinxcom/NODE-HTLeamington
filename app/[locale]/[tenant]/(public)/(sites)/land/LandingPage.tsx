// app/[locale]/(sites)/land/LandingPage.tsx
"use client";

import styles from "./Landing.module.css";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";


type Props = { locale: string };

// Normaliza "es-MX" | "en-US" | "fr-CA" → "es" | "en" | "fr"
function shortOf(input?: string): "es" | "en" | "fr" {
  if (!input) return "es";
  const v = String(input).toLowerCase();
  if (v.startsWith("es")) return "es";
  if (v.startsWith("fr")) return "fr";
  return "en";
}

export default function LandingPage({ locale }: Props) {
  const router = useRouter();
  const intl = useIntl();
  const short = useMemo(() => shortOf(locale), [locale]);

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // Persistimos lead básico
      await addDoc(collection(FbDB, "leads"), {
        ...form,
        locale,
        ts: serverTimestamp(),
        page: "landing",
      });
      // Reset y opcionalmente podrías redirigir
      setForm({ name: "", email: "", phone: "" });
      router.replace(`/${short}/emailmarketing`); // si quieres volver al home
    } catch (ex) {
      console.error("[landing] lead error:", ex);
      setErr(intl.formatMessage({
        id: "sites.land.error.generic",
        defaultMessage: "Ocurrió un error. Intenta nuevamente."
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />

      <section className={styles.pageMain}>
        <div className={styles.mainGrid}>
          <header className={styles.head}>
            <h1 className={styles.h1}>
              <FM id="sites.land.h1" defaultMessage="¡Bienvenido a El Patrón!" />
            </h1>
            <p className={styles.subtle}>
              <FM
                id="sites.land.subtitle"
                defaultMessage="Descubre la mejor experiencia en entretenimiento, sabor y ambiente."
              />
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Columna: formulario */}
            <form onSubmit={onSubmit} className={styles.card}>
              <div className={styles.cardGrid}>
                <label className={styles.fieldStack}>
                  <span className={styles.label}>
                    <FM id="sites.land.form.name" defaultMessage="Nombre" />
                  </span>
                  <input
                    type="text"
                    className={styles.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={intl.formatMessage({ id: "sites.land.form.name.ph", defaultMessage: "Tu nombre" })}
                    aria-label={intl.formatMessage({ id: "sites.land.form.name", defaultMessage: "Nombre" })}
                    required
                  />
                </label>

                <label className={styles.fieldStack}>
                  <span className={styles.label}>
                    <FM id="sites.land.form.email" defaultMessage="Correo" />
                  </span>
                  <input
                    type="email"
                    className={styles.input}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={intl.formatMessage({ id: "sites.land.form.email.ph", defaultMessage: "you@example.com" })}
                    aria-label={intl.formatMessage({ id: "sites.land.form.email", defaultMessage: "Correo" })}
                    required
                  />
                </label>

                <label className={styles.fieldStack}>
                  <span className={styles.label}>
                    <FM id="sites.land.form.phone" defaultMessage="Teléfono (opcional)" />
                  </span>
                  <input
                    type="tel"
                    className={styles.input}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder={intl.formatMessage({ id: "sites.land.form.phone.ph", defaultMessage: "Tu teléfono" })}
                    aria-label={intl.formatMessage({ id: "sites.land.form.phone", defaultMessage: "Teléfono (opcional)" })}
                  />
                </label>

                {err && (
                  <p className={styles.hint} role="alert">{err}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.btnPrimary}
                  aria-busy={loading}
                >
                  {loading
                    ? intl.formatMessage({ id: "sites.land.btn.loading", defaultMessage: "Enviando…" })
                    : intl.formatMessage({ id: "sites.land.btn.subscribe", defaultMessage: "Quiero enterarme de eventos y promos" })
                  }
                </button>

                <p className={styles.note}>
                  <FM
                    id="sites.land.disclaimer"
                    defaultMessage="Al registrarte aceptas recibir información ocasional sobre eventos y promociones."
                  />
                </p>
              </div>
            </form>

            {/* Columna: CTA a reservas */}
            <div className={`${styles.card} grid place-items-center`}>
              <div className="max-w-md text-center space-y-4">
                <h2 className="text-xl font-semibold">
                  <FM id="sites.land.cta.title" defaultMessage="¿Listo para vivir la experiencia?" />
                </h2>
                <p className={styles.subtle}>
                  <FM
                    id="sites.land.cta.copy"
                    defaultMessage="Reserva tu mesa y disfruta de nuestra cocina y mixología."
                  />
                </p>

                <div className="mt-2 flex items-center justify-center">
                  <a
                    href={`/${short}/reservas`}
                    className={`${styles.btnGhost} px-4 py-2 border`}
                    title={intl.formatMessage({ id: "sites.land.cta.reserve", defaultMessage: "Haz tu reservación" })}
                  >
                    <FM id="sites.land.cta.reserve" defaultMessage="Haz tu reservación" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Puedes seguir usando estilos del módulo si ya los tienes */}
          <div className={styles?.footer ?? ""} />
        </div>
      </section>
    </>
  );
}