"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import styles from "./Menu.module.css";
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
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

type MenuKey = "dishes" | "liquor" | "cocktail";

const MENU_FILES: Record<MenuKey, string> = {
  dishes: "/media/Menus/Menu Alimentos.png",
  liquor: "/media/Menus/Menu Licor.png",
  cocktail: "/media/Menus/Menu Coctel y Michelada.png",
};

const MENU_MSG: Record<MenuKey, { id: string; defaultMessage: string }> = {
  dishes:   { id: "sites.menu.tab.dishes",   defaultMessage: "Menú Alimentos" },
  liquor:   { id: "sites.menu.tab.liquor",   defaultMessage: "Menú Licor" },
  cocktail: { id: "sites.menu.tab.cocktail", defaultMessage: "Menú Coctel y Michelada" },
};

export default function MenuPage({ locale }: Props) {
  const intl = useIntl();
  const short = useMemo(() => shortOf(locale), [locale]);

  const order: MenuKey[] = useMemo(() => ["dishes", "liquor", "cocktail"], []);
  const [active, setActive] = useState<MenuKey>("dishes");

  const activeFile = MENU_FILES[active];
  const activeLabel = intl.formatMessage(MENU_MSG[active]);

  return (
    <>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />

      <section className={styles.pagePadLg}>
        <header className={styles.headStack}>
          <H1 className={styles.title}>
            <FM id="sites.menu.h1" defaultMessage="Menú" />
          </H1>
          <P className={styles.muted80}>
            <FM
              id="sites.menu.subtitle"
              defaultMessage="Explora nuestros menús de alimentos, licores y cocteles."
            />
          </P>
        </header>

        {/* Pestañas */}
        <div className={styles.chipsRow}>
          {order.map((k) => {
            const isActive = k === active;
            const label = intl.formatMessage(MENU_MSG[k]);
            return (
              <BUTTON
                key={k}
                type="button"
                onClick={() => setActive(k)}
                className={`${styles.chipBtn} ${isActive ? "bg-black text-white border-black" : "hover:bg-white/10"}`}
                aria-pressed={isActive}
                aria-label={label}
                title={label}
              >
                {label}
              </BUTTON>
            );
          })}
        </div>

        {/* Imagen */}
        <div className="flex justify-center">
          <Image
            src={activeFile}
            alt={activeLabel}
            width={1200}
            height={1600}
            className={`w-full max-w-4xl h-auto ${styles.frameBorder}`}
            priority
          />
        </div>

        {/* (Opcional) leyenda bajo la imagen */}
        <P className={styles.caption}>
          {activeLabel}
        </P>
      </section>

      {/* Si ya usas estilos locales, esto mantiene compatibilidad */}
      <div className={styles?.footer ?? ""} />
    </>
  );
}