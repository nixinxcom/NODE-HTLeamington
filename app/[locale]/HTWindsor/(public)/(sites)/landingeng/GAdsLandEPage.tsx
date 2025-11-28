'use client'
import { useState } from "react";
import styles from './GoogleAdsLanding.module.css';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Props = { locale: string };

export default function GoogleAdsLandingEngPage({ locale }: Props) {
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
              <H1>🎶 Welcome to El Patrón Bar & Grill!</H1>
              <P>
                We’re a live music bar. We just need to confirm something quickly before we continue:
              </P>
              <P className={styles.joke}>
                Fun fact: Age doesn’t erase your memories—it just makes them dance! 💃🕺
              </P>
              <div className={styles.buttons}>
                <BUTTON className={`${styles.btn} ${styles.yes}`} onClick={() => handleAccess(true)}>
                  Yes, I&lsquo;m over 18
                </BUTTON>
                <BUTTON className={`${styles.btn} ${styles.no}`} onClick={() => handleAccess(false)}>
                  Not yet
                </BUTTON>
              </div>
            </>
          )}

          {isAllowed === false && (
            <>
              <H2>🎸 Thanks for stopping by!</H2>
              <P>
                Our site is for adults only, but we appreciate your interest.
                Come visit us when you&lsquo;re ready to dance legally. 😉
              </P>
              <P className={styles.joke}>
                What&lsquo;s a minor doing in a bar?  
                Showing their student ID when asked for ID! 🎓😄
              </P>
              <P>Redirecting you to Google so you can find us again later...</P>
            </>
          )}
        </div>
      </div>
    </>
  );
}