'use client';

import React, { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import styles from "./PDFs.module.css";

type Props = { locale: string };

// Normaliza "es-MX" | "en-US" | "fr-CA" → "es" | "en" | "fr" (por si lo necesitas luego)
function shortOf(input?: string): "es" | "en" | "fr" {
  if (!input) return "es";
  const v = String(input).toLowerCase();
  if (v.startsWith("es")) return "es";
  if (v.startsWith("fr")) return "fr";
  return "en";
}

type MenuKey = "food" | "liquor" | "cocktail";

const MENU_FILES: Record<MenuKey, string> = {
  food: "/pdfs/El Patron menu de alimentos.pdf",
  // ojo al nombre de archivo; dejé tal cual aparece en el repo
  liquor: "/pdfs/Menu lLicores Eventos EL PATRON.pdf",
  cocktail: "/pdfs/Menu Cocteles y Micheladas Eventos EL PATRON.pdf",
};

const MENU_MSG: Record<MenuKey, { id: string; defaultMessage: string }> = {
  food:     { id: "sites.pdfs.tab.food",     defaultMessage: "Alimentos" },
  liquor:   { id: "sites.pdfs.tab.liquor",   defaultMessage: "Licores" },
  cocktail: { id: "sites.pdfs.tab.cocktail", defaultMessage: "Cocteles y Micheladas" },
};

export default function PDFsPage({ locale }: Props) {
  const intl = useIntl();
  const short = useMemo(() => shortOf(locale), [locale]);

  const order: MenuKey[] = ["food", "liquor", "cocktail"];
  const [active, setActive] = useState<MenuKey>("food");

  const activeFile = MENU_FILES[active];
  const activeLabel = intl.formatMessage(MENU_MSG[active]);

  return (
    <>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />

      <section className={styles.pagePad}>
        <header className={`text-center ${styles.headerWrap}`}>
          <h1 className={styles.h1}>
            <FM id="sites.pdfs.h1" defaultMessage="Menús en PDF" />
          </h1>
          <p className={styles.subtitle}>
            <FM
              id="sites.pdfs.subtitle"
              defaultMessage="Visualiza o descarga nuestros menús en formato PDF."
            />
          </p>
        </header>

        {/* Pestañas */}
        <div className={`flex flex-wrap items-center justify-center ${styles.tabsRow}`}>
          {order.map((k) => {
            const isActive = k === active;
            const label = intl.formatMessage(MENU_MSG[k]);
            return (
              <button
                key={k}
                type="button"
                onClick={() => setActive(k)}
                className={`px-4 py-2 rounded-xl border transition ${isActive ? "bg-black text-white border-black" : "hover:bg-white/10"}`}
                aria-pressed={isActive}
                aria-label={label}
                title={label}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Acciones del PDF activo */}
        <div className={`flex items-center justify-center ${styles.actionsRow}`}>
          <a
            href={activeFile}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionBtn}
            title={intl.formatMessage({ id: "sites.pdfs.open", defaultMessage: "Abrir en pestaña nueva" })}
          >
            <FM id="sites.pdfs.open" defaultMessage="Abrir en pestaña nueva" />
          </a>
          <a
            href={activeFile}
            download
            className={styles.actionBtn}
            title={intl.formatMessage({ id: "sites.pdfs.download", defaultMessage: "Descargar PDF" })}
          >
            <FM id="sites.pdfs.download" defaultMessage="Descargar PDF" />
          </a>
        </div>

        {/* Visor */}
        <div className="flex justify-center">
          <iframe
            src={activeFile}
            className="w-full max-w-4xl h-[90vh] border"
            title={intl.formatMessage({ id: "sites.pdfs.viewer.title", defaultMessage: "Visor de menús PDF" })}
          />
        </div>
      </section>
    </>
  );
}