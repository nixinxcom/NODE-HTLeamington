// app/[locale]/(sites)/HomePage.tsx
"use client";
import styles from "./page.module.css";
import React, { useEffect, useState } from 'react';
import PlayerComp from "@/complements/components/PlayerComp/PlayerComp";
import { useEvents } from "@/complements/hooks/useEvents";
import { Button, Link, NextImage, Image, Div, A, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import { useAppContext } from "@/context/AppContext";
import FooterComp from "@/complements/components/FooterComp/FooterComp";
import InstallPWAButton from "@/complements/components/InstallPWAComp/InstallPWAComp";
import clsx from 'clsx';
import MapEmbed from '@/complements/components/Maps/MapEmbed/MapEmbed';
import HeroEventsCarousel from "@/complements/components/HeroEventsCarousel/HeroEventsCarousel";
import ReviewsRail from "@/complements/components/ReviewsRail/ReviewsRail";
import { useParams } from 'next/navigation';
import FM from "@/complements/i18n/FM";

interface EventType {
  id: string;
  titulo: string;
  img: string;
  video?: string;
  artista?: string;
  fecha?: string;
  hora?: string;
  descripcion?: string;
}

export default function HomePage() {
  const { Settings, Branding } = useAppContext();
  const { events, loading, error } = useEvents();
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerUrl, setPlayerUrl] = useState("");
  const [activeEvent, setActiveEvent] = useState<EventType | null>(null);
  const { locale } = useParams() as { locale?: string };
  const loc = typeof locale === 'string' ? locale : 'es';

  // ───────────────────── BRANDING DESDE CONTEXT ─────────────────────
  const brand: string | undefined = Branding.company.brandName ? Branding.company.brandName : Branding.company.legalName;
  const maps: boolean = Settings?.faculties?.maps ?? false;

  const phone: string | undefined = Branding.company.phone;
  const telHref = phone ? `tel:${String(phone).replace(/\s+/g, "")}` : undefined;

  const placeQ: string | undefined = Settings?.company?.legals?.placeQuery;
  const lat: number | undefined = Settings?.company?.legals?.mapLat ? Settings.company.legals.mapLat : undefined;
  const lng: number | undefined = Settings?.company?.legals?.mapLng ? Settings.company.legals.mapLng : undefined;
  // ──────────────────────────────────────────────────────────────────

  const onOpenVideo = (url: string) => {
    setPlayerUrl(url);
    setPlayerOpen(true);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', function() {
      const catrina = document.getElementById('catrina');
      const Logo = document.getElementById('HeaderLogo');
      const headerHeight = Logo?.offsetHeight;
      const scrollPosition = window.scrollY;

      if(headerHeight && catrina){
        if (scrollPosition > headerHeight) {
          catrina.style.width = '7vw';
          catrina.style.height = '7vw';
        } else if (scrollPosition <= headerHeight && catrina){
          catrina.style.width = '14vw';
          catrina.style.height = '14vw';
        }
      }
    });
  }

  useEffect(() => {
    function handleScroll() {
      const Logo = document.getElementById('HeaderLogo');
      const headerHeight = Logo?.offsetHeight;
      const _scrollPosition = window.scrollY;
      if (headerHeight) {
        // no-op
      }
    }
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('scroll', handleScroll); };
  }, []);

  return (
    <>
      {/* JSON-LD: inyectarlo en Server Page para mejor SEO */}
      <main className={clsx(styles.pageWrapper, 'min-h-screen bg-white text-black')}>
        {/* Hero */}
        <section className={`relative w-full h-[85vh] flex items-center justify-center text-center ${styles.bgApp}`}>
          <div className={`relative w-full mx-auto max-w-screen-2xl bg-transparent overflow-hidden ${styles.radius2xl}
          min-h-[420px] md:min-h-[560px] lg:min-h-[640px] aspect-[16/9] md:aspect-[2.2]`}>
            <HeroEventsCarousel />
          </div>
        </section>

        <section>
          <div className={`relative z-10 ${styles.padXSm}`}>
            <H1 className={` ${styles.heroTitle} drop-shadow-lg`}>
              <FM id="home.hero.title" defaultMessage="Auténtica experiencia mexicana, sabor que conecta." />
            </H1>
            <P className={styles.heroSubtitle}>
              <FM id="home.hero.subtitle" defaultMessage="Descubre por qué somos el coraz&oacute;n de la fiesta en Windsor y Leamington." />
            </P>
          </div>

          <div className={clsx(styles.linksRow)}>
            <Link href={`/${loc}/menus`}>
              <FM id="home.cta.menu" defaultMessage="Ver Menú" />
            </Link>

            <Link
              href="https://order.tbdine.com/pickup/28824/menu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FM id="home.cta.orderonline" defaultMessage="Ordena en Linea" />
            </Link>

            <Link href={`/${loc}/reservas`}>
              <FM id="home.cta.reservar" defaultMessage="Reserva Ahora" />
            </Link>

            {/* Teléfono: SOLO si viene de Branding */}
            {telHref && (
              <Link href={telHref}>
                <FM id="home.cta.llamar" defaultMessage="Llama Ahora" />
              </Link>
            )}

            {/* Cómo llegar: SOLO si hay placeQuery en Branding */}
            {placeQ && (
              <Link
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQ)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FM id="home.cta.comollegar" defaultMessage="¿Cómo llegar?" />
              </Link>
            )}
          </div>
        </section>

        {/* Sección destacada */}
        <section className={`${styles.sectionPad} ${styles.sectionSurfaceSoft} text-center`}>
          <H2 className="text-3xl font-bold mb-6">
            <FM id="home.section1.title" defaultMessage="Más que un restaurante, una experiencia" />
          </H2>
          <P className="max-w-3xl mx-auto text-lg">
            <FM id="home.section1.text" defaultMessage="Ambiente familiar, música en vivo, y los mejores sabores del sur de México y Centroamérica. Ideal para celebraciones, reuniones o simplemente disfrutar un buen momento." />
          </P>
        </section>

        {/* Próximos Eventos */}
        <section className={styles.eventSection}>
          <H2 className={styles.eventTitle}>
            <FM id="home.events.title" defaultMessage="Próximos eventos" />
          </H2>

          {loading && (
            <P className={styles.eventMeta}>
              <FM id="home.events.loading" defaultMessage="Cargando…" />
            </P>
          )}
          {error && (
            <P className={styles.eventMeta}>
              <FM id="home.events.error" defaultMessage="Error:" />{" "}{error}
            </P>
          )}

          <div className={styles.eventGrid}>
            {events.map((ev) => (
              <div key={ev.id} className={styles.eventCard}>
                <Image
                  src={ev.img}
                  alt={ev.titulo}
                  className={styles.eventImage}
                  width={1200} height={630}
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority
                />
                <div className={styles.eventInfo}>
                  <H3 className={styles.eventName}>{ev.titulo}</H3>
                  {ev.video && (
                    <Button
                      onClick={() => {
                        onOpenVideo(ev.video!);
                        setActiveEvent(ev);
                      }}
                    >
                      <FM id="home.events.viewvideo" defaultMessage="Ver video" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Opiniones */}
        <section className={`${styles.sectionSurfaceLight} text-center`}>
          <ReviewsRail className="w-full" />
        </section>

        {/* CTA final */}
        <section className={`${styles.sectionSurfaceDark} text-center`}>
          <Link
            href="/reservas"
            className={`${styles.ctaWhite} ${styles.btnMd} ${styles.smoothTrans} m-7 font-semibold inline-block mt-4`}
          >
            <span className={`${styles.hoverAccent} ${styles.smoothTrans} cursor-pointer`}>
              <FM id="home.cta.final" defaultMessage="¡Reserva tu mesa!" />
            </span>
          </Link>
          <InstallPWAButton />
        </section>
        {playerOpen && (
          <PlayerComp
            url={playerUrl}
            setState={setPlayerOpen}
            width={1280}
            height={720}
            readOnly={false}
            vertical="Center"
            horizontal="Center"
            position="fixed"
            volume={0.75}
            typeDevice={true}
            controls={true}
            playing={false}
            autoplay={false}
            muted={false}
            loop={false}
            details={
              activeEvent ? (
                <section className={styles.eventDetails}>
                  <H3 className={styles.eventSubtitle}>{activeEvent.titulo}</H3>
                  <P className={styles.eventMeta}>
                    {activeEvent.artista && <strong><FM id="event.artist" defaultMessage="Artista" /></strong>} {activeEvent.artista}
                  </P>
                  <P className={styles.eventMeta}>
                    {activeEvent.fecha && <strong><FM id="event.date" defaultMessage="Fecha" /></strong>} {activeEvent.fecha}
                  </P>
                  <P className={styles.eventMeta}>
                    {activeEvent.hora && <strong><FM id="event.time" defaultMessage="Hora" /></strong>} {activeEvent.hora}
                  </P>
                  {activeEvent.descripcion && (
                    <P className={styles.eventDescription}>{activeEvent.descripcion}</P>
                  )}
                </section>
              ) : null
            }
          />
        )}

        {/* Mapas: SOLO si hay lat/lng en Branding */}
        <div className={`${styles.padXSm} ${styles.gapRow} mx-auto max-w-xl md:max-w-5xl flex flex-col md:flex-row`}>
          {(lat && lng) && (
            <MapEmbed
              mode="streetview"
              lat={Settings?.company.legals.mapLat}
              lng={Settings?.company.legals.mapLng}
              language="es"
              region="CA"
              heading={-2}
              pitch={6}
              fov={28}
              height={360}
              blockInteraction
            />
          )}
          {placeQ && (
            <MapEmbed
              mode="place"
              q={placeQ}
              height={360}
              blockInteraction
            />
          )}
        </div>

        {placeQ && (
          <Link
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeQ)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.ctaWhite} ${styles.btnMd} ${styles.smoothTrans} ${styles.borderSubtle} b-1 font-semibold inline-block mt-4 flex m-auto w-max`}
          >
            <FM id="home.cta.direccion" defaultMessage="Cómo llegar" />
          </Link>
        )}

        <div id={styles.GridCont8}>
          <FooterComp/>
        </div>
      </main>
    </>
  );
}
