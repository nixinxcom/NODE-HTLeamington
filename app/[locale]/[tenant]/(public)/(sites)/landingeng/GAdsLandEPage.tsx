'use client'
import { useState } from "react";
import styles from './GoogleAdsLanding.module.css';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";

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
              <h1>🎶 Welcome to El Patrón Bar & Grill!</h1>
              <p>
                We’re a live music bar. We just need to confirm something quickly before we continue:
              </p>
              <p className={styles.joke}>
                Fun fact: Age doesn’t erase your memories—it just makes them dance! 💃🕺
              </p>
              <div className={styles.buttons}>
                <button className={`${styles.btn} ${styles.yes}`} onClick={() => handleAccess(true)}>
                  Yes, I&lsquo;m over 18
                </button>
                <button className={`${styles.btn} ${styles.no}`} onClick={() => handleAccess(false)}>
                  Not yet
                </button>
              </div>
            </>
          )}

          {isAllowed === false && (
            <>
              <h2>🎸 Thanks for stopping by!</h2>
              <p>
                Our site is for adults only, but we appreciate your interest.
                Come visit us when you&lsquo;re ready to dance legally. 😉
              </p>
              <p className={styles.joke}>
                What&lsquo;s a minor doing in a bar?  
                Showing their student ID when asked for ID! 🎓😄
              </p>
              <p>Redirecting you to Google so you can find us again later...</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}