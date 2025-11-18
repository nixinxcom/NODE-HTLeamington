"use client";

import styles from "./AboutUs.module.css";
import { FormattedMessage } from "react-intl";
import FM from "@/complements/i18n/FM";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";
import { useAppContext } from '@/context/AppContext';
import { useI18nHref } from '@/app/lib/useI18nHref';
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Props = { locale: string };

export default function AboutUsPage({ locale }: Props) {
  const _i18nHref = useI18nHref();
  const i18nHref = _i18nHref ?? ((p: string) => p);
  const { Settings } = useAppContext();

  return (
    <>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />
      <main className={styles.aboutMain}>
        <section className={styles.section}>
          <div className={styles.text}>
            <H2>
              <FM
                id="aboutUs.welcome"
                defaultMessage="Welcome to El Patrón Bar & Grill"
              />
            </H2>
            <P>
              <FM
                id="aboutUs.opening"
                defaultMessage="El Patrón Bar & Grill opened its doors in 2022 in the heart of Leamington, Ontario, at 205 Talbot St W. Since then, it has become the go-to spot for those who love music, Latin culture, and great food."
              />
            </P>
          </div>
          <div className={styles.imageContainer}>
            <IMAGE
              src="https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/PWAStorage%2FWebContent%2Frestaurant_700x700.webp?alt=media&token=04a86a24-78ae-4e55-8f1b-403e971affb6"
              alt="El Patrón Interior"
              fill
              className={styles.image}
            />
          </div>
        </section>

        <section className={`${styles.section} ${styles.reverse}`}>
          <div className={styles.text}>
            <H3>
              <FM
                id="aboutUs.identityTitle"
                defaultMessage="Our Identity"
              />
            </H3>
            <P>
              <FM
                id="aboutUs.identity"
                defaultMessage="We are a Mexican restaurant-bar that blends tradition with entertainment. Our dance floor has hosted DJs, renowned artists like El Comander, RAP groups, and a wide variety of Mexican, Colombian, Latin, and rumba bands."
              />
            </P>
          </div>
          <div className={styles.imageContainer}>
            <IMAGE
              src="https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/PWAStorage%2FWebContent%2Fdancefloor_700x700.webp?alt=media&token=67552274-6889-4154-97b2-7b4c559b2223"
              alt="Dance floor"
              fill
              className={styles.image}
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.text}>
            <H3>
              <FM
                id="aboutUs.eventsTitle"
                defaultMessage="Events & Community"
              />
            </H3>
            <P>
              <FM
                id="aboutUs.karaokeAndEvents"
                defaultMessage="We organize live karaoke competitions and have even hosted professional wrestling events, always committed to supporting and engaging with the local community."
              />
            </P>
          </div>
          <div className={styles.imageContainer}>
            <IMAGE
              src="https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/PWAStorage%2FWebContent%2Fkaraoke_700x700.webp?alt=media&token=cc7dc974-1246-418f-bb24-b812f5bd61a6"
              alt="Karaoke night"
              fill
              className={styles.image}
            />
          </div>
        </section>

        <section className={`${styles.section} ${styles.reverse}`}>
          <div className={styles.text}>
            <H3>
              <FM
                id="aboutUs.renovationsTitle"
                defaultMessage="Our Renovations"
              />
            </H3>
            <P>
              <FM
                id="aboutUs.renovations"
                defaultMessage="Since opening, we've undergone three renovations to evolve and provide a modern, warm, and welcoming space."
              />
            </P>
            <P>
              <FM
                id="aboutUs.reinvention"
                defaultMessage="Today, we’re entering a new phase of reinvention to deliver a fresh, exciting experience in the Essex region."
              />
            </P>
          </div>
          <div className={styles.imageContainer}>
            <IMAGE
              src="https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/PWAStorage%2FWebContent%2Frenovation_700x700.webp?alt=media&token=27ab6500-c1e1-4702-8c10-855eebf656ac"
              alt="Renovations"
              fill
              className={styles.image}
            />
          </div>
        </section>

        <section className={styles.finalSection}>
          <H2 className={styles.Closure}>
            <FM
              id="aboutUs.closing"
              defaultMessage="The flavor, music, and spirit of Latin culture at its finest."
            />
          </H2>
          <P className={styles.Closure}>
            <FM
              id="aboutUs.cta"
              defaultMessage="Come and experience El Patrón Bar & Grill."
            />
          </P>
        </section>
        <H6 
          className={styles.credits}
          onClick={() => { 
            Settings?.faculties?.adminPanel ? (
              window.location.href = i18nHref('/admin')
            ) : (
              window.open(i18nHref('https://www.nixinx.com/'), '_blank', 'noopener,noreferrer')
            )
          }}
          style={{ cursor: 'pointer' }}
        >
          <FM id="footer.credits" defaultMessage="Creado por NIXINX" />
        </H6>
      </main>
    </>
  );
}