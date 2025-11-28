'use client'
import { useState } from "react";
import styles from './GoogleAdsLanding.module.css';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Props = { locale: string };

export default function GoogleAdsLandingFraPage({ locale }: Props) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const router = useRouter();

  const handleAccess = (allowed: boolean) => {
    setIsAllowed(allowed);

    if (allowed) {
      setTimeout(() => {
        router.push("/"); // Go to main page
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
          {isAllowed === null && (
            <>
              <H1>🎶 Bienvenue chez El Patrón Bar & Grill !</H1>
              <P>
                Nous sommes un bar avec musique live. Nous devons juste confirmer un petit détail avant de continuer :
              </P>
              <P className={styles.joke}>
                Le saviez-vous ? L’âge n’efface pas les souvenirs… il les fait danser ! 💃🕺
              </P>
              <div className={styles.buttons}>
                <BUTTON className={`${styles.btn} ${styles.yes}`} onClick={() => handleAccess(true)}>
                  Oui, j&apos;ai plus de 18 ans
                </BUTTON>
                <BUTTON className={`${styles.btn} ${styles.no}`} onClick={() => handleAccess(false)}>
                  Pas encore
                </BUTTON>
              </div>
            </>
          )}

          {isAllowed === false && (
            <>
              <H2>🎸 Merci de votre visite !</H2>
              <P>
                Notre site est réservé aux adultes, mais merci de votre intérêt.
                Revenez nous voir quand vous serez prêt(e) à danser légalement. 😉
              </P>
              <P className={styles.joke}>
                Que fait un mineur dans un bar ? Il sort sa carte d’étudiant quand on lui demande une pièce d’identité ! 🎓😄
              </P>
              <P>Redirection vers Google pour que vous puissiez nous retrouver plus tard…</P>
            </>
          )}
        </div>
      </div>
    </>
  );
}