'use client'
import { useState } from "react";
import styles from './GoogleAdsLanding.module.css';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

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
            <H2 className={styles.welcome}>¡Bienvenido a El Patrón! 🎉</H2>
          ) : isAllowed === null ? (
            <>
              <H1>🎶 Bienvenido a El Patrón Bar & Grill</H1>
              <P>
                Somos un bar de música en vivo con buen ambiente.
                Solo necesitamos confirmar algo rápido antes de continuar:
              </P>
              <P className={styles.joke}>
                ¿Sabías que la edad no borra los recuerdos? Solo hace que bailen cumbia. 💃🕺
              </P>
              <div className={styles.buttons}>
                <BUTTON className={`${styles.btn} ${styles.yes}`} onClick={() => handleAccess(true)}>
                  Sí, soy mayor de edad
                </BUTTON>
                <BUTTON className={`${styles.btn} ${styles.no}`} onClick={() => handleAccess(false)}>
                  Aún no
                </BUTTON>
              </div>
            </>
          ) : (
            <>
              <H2>🎸 ¡Gracias por visitarnos!</H2>
              <P>
                Este sitio es solo para mayores de edad, pero nos encantará verte cuando llegue tu momento. 😉
              </P>
              <P className={styles.joke}>
                ¿Sabes cuál es el colmo de un menor en un bar?  
                ¡Que le pidan la ID y les enseñe su credencial de estudiante! 🎓😄
              </P>
              <P>Te mandamos a Google para que nos encuentres más adelante...</P>
            </>
          )}
        </div>
      </div>
    </>
  );
}