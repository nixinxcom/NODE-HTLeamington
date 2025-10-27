// app/[locale]/(public)/plantilla/HelloBlock.tsx
"use client";

import FM from "@/complements/i18n/FM";
import styles from "./page.module.css";

export default function HomePublicPage({
  ssrTime,
  locale,
}: { ssrTime: string; locale: string }) {
  return (
    <div className={styles.New}>
      <h1><FM id="NuevaPlantilla" defaultMessage="Esta Plantilla ya puede conectarse con Firebase" /></h1>
      <p className={styles.note}>
        <FM id="plantilla.locale" defaultMessage="Locale:" /> {locale} ·{" "}
        <FM id="plantilla.ssrTime" defaultMessage="SSR time:" /> {ssrTime}
      </p>
    </div>
  );
}
