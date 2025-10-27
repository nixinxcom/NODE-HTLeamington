'use client'
import { useState } from "react";
import styles from './GoogleAdsLanding.module.css';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";

type Props = { locale: string };

export default function GoogleAdsLandingEspPage({ locale }: Props) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const router = useRouter();

  const handleAccess = (allowed: boolean) => {
    setIsAllowed(allowed);

    if (allowed) {
      setShowWelcome(true);

      setTimeout(() => {
        router.push("/");
      }, 350);
    } else {
      setTimeout(() => {
        window.location.href = "https://www.google.com/search?q=El+Patron+Bar+and+Grill+Leamington";
      }, 3000);
    }
  };

  return (
    <>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />
      <div className={styles.landingOverlay}>
        <div className={styles.modal}>
          <div className={styles.logoContainer}>
            <Image src="/Icons/manifest_icons/icon-512x512-maskable.png" width={120} height={120} alt="El Patrón Bar & Grill" />
          </div>

          {showWelcome ? (
            <h2 className={styles.welcome}>¡Bienvenido a El Patrón! 🎉</h2>
          ) : isAllowed === null ? (
            <>
              <h1>🎶 Bienvenido a El Patrón Bar & Grill</h1>
              <p>
                Somos un bar de música en vivo con buen ambiente.
                Solo necesitamos confirmar algo rápido antes de continuar:
              </p>
              <p className={styles.joke}>
                ¿Sabías que la edad no borra los recuerdos? Solo hace que bailen cumbia. 💃🕺
              </p>
              <div className={styles.buttons}>
                <button className={`${styles.btn} ${styles.yes}`} onClick={() => handleAccess(true)}>
                  Sí, soy mayor de edad
                </button>
                <button className={`${styles.btn} ${styles.no}`} onClick={() => handleAccess(false)}>
                  Aún no
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>🎸 ¡Gracias por visitarnos!</h2>
              <p>
                Este sitio es solo para mayores de edad, pero nos encantará verte cuando llegue tu momento. 😉
              </p>
              <p className={styles.joke}>
                ¿Sabes cuál es el colmo de un menor en un bar?  
                ¡Que le pidan la ID y les enseñe su credencial de estudiante! 🎓😄
              </p>
              <p>Te mandamos a Google para que nos encuentres más adelante...</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}