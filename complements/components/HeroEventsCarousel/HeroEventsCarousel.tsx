"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { FbDB } from "@/app/lib/services/firebase";
import { collection, getDocs, query, where, orderBy, limit as qLimit } from "firebase/firestore";
import style from "./HeroEventsCarousel.module.css";
import { useIntl, FormattedMessage } from "react-intl";
import FM from "@/complements/i18n/FM";
import BackgroundMedia from "@/complements/components/BackgroundMediaComp/BackgroundMediaComp";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";


/* ===== Tipos ===== */
type CtaType = "none" | "url" | "pdf" | "phone" | "mailto";
type CtaRender = "button" | "link";
type Cta = { type: CtaType; label: string; url: string | null; as?: CtaRender };
type MediaVariant = { size: string; path: string; url: string };
type MediaItem = {
  name: string;
  path: string;
  url: string;
  contentType: string;
  resized?: MediaVariant[];
};
type EventDoc = {
  id?: string;
  title: string;
  slug: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string | null;
  location?: string | null;
  description?: string | null;
  artist?: string | null;
  externalVideoUrl?: string | null;
  mediaStorageBase?: string;
  coverUrl?: string | null;
  media?: MediaItem[];
  ctas?: Cta[];
  status?: "draft" | "published";
};
type Slide = {
  kind: "image" | "video";
  url: string;
  originalUrl: string;
  contentType: string;
  name?: string;
};

type Props = {
  limit?: number;
  slideMs?: number;
  maxVideoMs?: number;
  onlyPublished?: boolean;
  dotsPosition?: "top" | "bottom";
  ctaPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** ej. "h-[calc(100svh-var(--nav-h))]" o "aspect-[16/9] min-h-[420px]" */
  heightClass?: string;
  className?: string;
};

/* ===== Helpers ===== */
const isImage = (ct: string) => ct?.startsWith("image/");
const isVideo = (ct: string) => ct?.startsWith("video/");
const hasVisual = (ev: EventDoc) =>
  Array.isArray(ev.media) &&
  ev.media.some((m) => m && (isImage(m.contentType) || isVideo(m.contentType)));

function eventTime(ev: EventDoc): number {
  if (ev.date) {
    const hhmm = (ev.startTime ?? "00:00").padStart(5, "0");
    return new Date(`${ev.date}T${hhmm}:00`).getTime();
  }
  if (ev.startAt) return new Date(ev.startAt).getTime();
  return 0;
}
function todayInTZ(tz = "America/Toronto") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((a, p) => ((a[p.type] = p.value), a), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function pickBestUrl(m: MediaItem) {
  if (m?.resized?.length) {
    const w = m.resized.find((v) => v.url?.endsWith(".webp"));
    return (w?.url || m.resized[0].url) as string;
  }
  return m.url;
}
function toHumanDate(dateStr: string, start?: string | null, end?: string | null) {
  const d = new Date(`${dateStr}T00:00:00`);
  const fmt = d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return `${fmt}${start ? ` • ${start}${end ? ` – ${end}` : ""}` : ""}`;
}
function ctaHref(cta: Cta): string | null {
  if (!cta?.url) return null;
  if (cta.type === "phone") {
    const cleaned = cta.url.replace(/[^\d+]/g, "");
    return cleaned.startsWith("tel:") ? cleaned : `tel:${cleaned}`;
  }
  if (cta.type === "mailto") {
    return cta.url.startsWith("mailto:") ? cta.url : `mailto:${cta.url}`;
  }
  return cta.url;
}

/* ===== Componente ===== */
export default function HeroEventsCarousel({
  limit = 10,
  slideMs = 7000,
  maxVideoMs = 70000,
  onlyPublished = false,
  dotsPosition = "bottom",
  ctaPosition = "bottom-right",
  heightClass = "",
  className = "",
}: Props) {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventIdx, setEventIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [descOpen, setDescOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [Background, setBackground] = useState(true);
  
  const intl = useIntl();

  // Animación entre eventos (salida izquierda / entrada derecha)
  const [anim, setAnim] = useState<{ from: number; to: number } | null>(null);
  const animTimerRef = useRef<number | null>(null);

  // timeouts auto-slide
  const timerRef = useRef<number | null>(null);
  const videoForceRef = useRef<number | null>(null);

  // gesto táctil (solo una vez)
  const touchStartXRef = useRef<number | null>(null);

  const clearSlideTimers = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (videoForceRef.current) {
      window.clearTimeout(videoForceRef.current);
      videoForceRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load(tz = "America/Toronto"): Promise<EventDoc[]> {
      const col = collection(FbDB, "events");
      const todayStr = todayInTZ(tz);
      let rows: EventDoc[] = [];
      try {
        const q1 = query(col, where("date", ">=", todayStr), orderBy("date"), qLimit(25));
        const s1 = await getDocs(q1);
        s1.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      } catch (e) {
        console.warn("[HeroEvents] by date failed; falling back:", e);
      }
      if (rows.length === 0) {
        const s2 = await getDocs(col);
        s2.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
      }
      rows = rows.filter(
        (ev) =>
          hasVisual(ev) &&
          ((typeof ev.date === "string" && ev.date >= todayStr) || eventTime(ev) >= Date.now())
      );
      rows.sort((a, b) => {
        const cmp = (a.date || "").localeCompare(b.date || "");
        return cmp !== 0 ? cmp : eventTime(a) - eventTime(b);
      });
      if (onlyPublished) rows = rows.filter((ev) => ev.status !== "draft");
      return rows;
    }

    (async () => {
      setLoading(true);
      try {
        const rows = await load();
        if (!mounted) return;
        setEvents(rows.slice(0, limit));
        setEventIdx(0);
        setSlideIdx(0);
      } catch {
        if (mounted) setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      clearSlideTimers();
      if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
    };
  }, [limit, onlyPublished, clearSlideTimers]);

  // Slides del evento activo
  const slideItems: Slide[] = useMemo(() => {
    const ev = events[eventIdx];
    if (!ev?.media) return [];
    return ev.media
      .map((m) => {
        const url = pickBestUrl(m);
        if (!url) return null;
        if (isVideo(m.contentType)) {
          return { kind: "video" as const, url, originalUrl: m.url, contentType: m.contentType, name: m.name };
        }
        return { kind: "image" as const, url, originalUrl: m.url, contentType: m.contentType, name: m.name };
      })
      .filter(Boolean) as Slide[];
  }, [events, eventIdx]);

  const activeEvent = events[eventIdx];
  const activeSlide = slideItems[slideIdx];

  // Primer slide del evento entrante (para la animación)
  const incomingSlide: Slide | null = useMemo(() => {
    if (!anim) return null;
    const ev = events[anim.to];
    if (!ev?.media?.length) return null;
    const first = ev.media.find((m) => isImage(m.contentType) || isVideo(m.contentType));
    if (!first) return null;
    const url = pickBestUrl(first);
    return {
      kind: first.contentType.startsWith("video") ? "video" : "image",
      url,
      originalUrl: first.url,
      contentType: first.contentType,
      name: first.name,
    };
  }, [anim, events]);

  // Auto-avance (pausado durante animación)
  useEffect(() => {
    if (!activeSlide || paused || anim) return;
    clearSlideTimers();
    if (activeSlide.kind === "image") {
      timerRef.current = window.setTimeout(() => goNextSlide(), slideMs);
    } else {
      videoForceRef.current = window.setTimeout(() => goNextSlide(), maxVideoMs);
    }
    return clearSlideTimers;
  }, [activeSlide, slideMs, paused, eventIdx, slideIdx, maxVideoMs, anim, clearSlideTimers]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* ===== EVENTOS: con animación ===== */
  const goToEvent = useCallback(
    (target: number) => {
      if (!events.length || target === eventIdx || anim) return; // evita dobles
      clearSlideTimers(); // mata timers para que no se dispare auto justo después
      setAnim({ from: eventIdx, to: target });
      setDescOpen(false);
      if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
      animTimerRef.current = window.setTimeout(() => {
        setEventIdx(target);
        setSlideIdx(0);
        setAnim(null);
      }, 520); // coincide con CSS .5s
    },
    [events.length, eventIdx, anim, clearSlideTimers]
  );

  const goNextEvent = useCallback(() => {
    if (events.length) goToEvent((eventIdx + 1) % events.length);
  }, [events.length, eventIdx, goToEvent]);

  const goPrevEvent = useCallback(() => {
    if (events.length) goToEvent((eventIdx - 1 + events.length) % events.length);
  }, [events.length, eventIdx, goToEvent]);

  /* ===== SLIDES del evento ===== */
  const goNextSlide = useCallback(() => {
    if (!slideItems.length || anim) return;
    if (slideIdx + 1 < slideItems.length) setSlideIdx((s) => s + 1);
    else goNextEvent();
  }, [slideIdx, slideItems.length, goNextEvent, anim]);

  const goPrevSlide = useCallback(() => {
    if (!slideItems.length || anim) return;
    if (slideIdx - 1 >= 0) setSlideIdx((s) => s - 1);
    else goPrevEvent();
  }, [slideIdx, slideItems.length, goPrevEvent, anim]);

  /* Gestos táctiles para slides (ignora si hay animación de evento) */
  const onTouchStart = (e: React.TouchEvent) => {
    if (!anim) touchStartXRef.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (anim) return;
    const start = touchStartXRef.current;
    touchStartXRef.current = null;
    if (start == null) return;
    const endX = e.changedTouches[0].clientX;
    const delta = endX - start;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goNextSlide();
    else goPrevSlide();
  };

  // Placeholders (misma caja)
  if (loading || !events.length) {
    return (
      <section className={`${style.hero} ${className}`}>
        <div className={`${style.frame} ${heightClass || ""}`}>
          <div className={style.skeleton}>
            {loading ? (
              <P className={style.muted}><FM id="hero.loading" defaultMessage="Cargando eventos…" /></P>
            ) : (
              <>
                {Background &&
                    <BackgroundMedia
                    // type={'image'}
                      // url={'https://firebasestorage.googleapis.com/v0/b/nixinx-canada.appspot.com/o/nixinx%2Ficons%2FNixinNLogo_210x210.webp?alt=media&token=bd5aa679-fbf5-456a-8e4b-9345ac5b03c3'}
                      type={'video'}
                      // url={'https://www.youtube.com/watch?v=rqKSFu6ehd0&list=RDrqKSFu6ehd0&start_radio=1'}
                      // url={'https://www.youtube.com/watch?v=KxcHGYL9pFo&list=RDKxcHGYL9pFo&start_radio=1'}
                      url={'https://www.youtube.com/watch?v=Cl1SNTTwZtg'}
                      MuteButton={false}
                    />
                }
                <div className={style.empty}>
                  <H3><FM id="hero.comingSoon" defaultMessage="Próximamente" /></H3>
                  <P className={style.muted}><FM id="hero.noMedia" defaultMessage="No hay eventos multimedia programados." /></P>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  const dotsWrapPos = dotsPosition === "top" ? style.dotsTop : style.dotsBottom;
  const ctaPosClass =
    ctaPosition === "bottom-right"
      ? `${style.cta} ${style.br}`
      : ctaPosition === "bottom-left"
      ? `${style.cta} ${style.bl}`
      : ctaPosition === "top-right"
      ? `${style.cta} ${style.tr}`
      : `${style.cta} ${style.tl}`;

  return (
    <section className={`${style.hero} ${className}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className={`${style.frame} ${anim ? style.isAnimating : ""} ${heightClass || ""}`}>
        {/* EVENTO con transición (2 capas) */}
        {anim ? (
          <>
            <div className={`${style.layer} ${style.exitLeft}`}>
              {activeSlide?.kind === "image" ? (
                <img
                  src={activeSlide.url}
                  alt={activeSlide?.name ?? activeEvent?.title ?? intl.formatMessage({ id: "hero.slideAlt", defaultMessage: "slide" })}
                  className={`${style.media} ${style.contain}`}
                  draggable={false}
                />
              ) : (
                <video
                  key={`out-${eventIdx}-${slideIdx}`}
                  src={activeSlide.url}
                  className={`${style.media} ${style.contain}`}
                  muted
                  playsInline
                  autoPlay
                  controls={false}
                />
              )}
            </div>
            {incomingSlide && (
              <div className={`${style.layer} ${style.enterRight}`}>
                {incomingSlide.kind === "image" ? (
                  <img
                    src={incomingSlide.url}
                    alt={incomingSlide?.name ?? "slide"}
                    className={`${style.media} ${style.contain}`}
                    draggable={false}
                  />
                ) : (
                  <video
                    key={`in-${anim.to}-0`}
                    src={incomingSlide.url}
                    className={`${style.media} ${style.contain}`}
                    muted
                    playsInline
                    autoPlay
                    controls={false}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          // Estado normal: un solo slide
          <>
            {activeSlide?.kind === "image" && (
              <img
                src={activeSlide.url}
                alt={activeSlide.name ?? activeEvent?.title ?? "slide"}
                className={`${style.media} ${style.contain}`}
                loading={slideIdx === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            )}
            {activeSlide?.kind === "video" && (
              <video
                key={`${eventIdx}-${slideIdx}-${activeSlide.url}`}
                src={activeSlide.url}
                className={`${style.media} ${style.contain}`}
                muted
                playsInline
                autoPlay
                controls={false}
                onEnded={goNextSlide}
              />
            )}
          </>
        )}

        {/* Gradiente inferior */}
        <div className={style.gradient} />

        {/* Dots del SLIDE */}
        {slideItems.length > 1 && (
          <div className={`${dotsWrapPos} ${style.dotsWrap}`}>
            {slideItems.map((_, i) => (
              <BUTTON
                key={`dot-${i}`}
                aria-label={intl.formatMessage({ id: "hero.nav.gotoSlide", defaultMessage: "Ir al slide {n}" }, { n: i + 1 })}
                className={`${style.dot} ${i === slideIdx ? style.dotActive : ""}`}
                onClick={() => setSlideIdx(i)}
              />
            ))}
          </div>
        )}

        {/* Flechas (desktop) */}
        {slideItems.length > 1 && (
          <>
            <div className={`${style.arrowWrap} ${style.left}`}>
              <BUTTON aria-label="Slide anterior" onClick={goPrevSlide} className={style.arrow}>
                ‹
              </BUTTON>
            </div>
            <div className={`${style.arrowWrap} ${style.right}`}>
              <BUTTON aria-label="Slide siguiente" onClick={goNextSlide} className={style.arrow}>
                ›
              </BUTTON>
            </div>
          </>
        )}

        {/* CTAs */}
        {activeEvent?.ctas?.length ? (
          <div className={ctaPosClass}>
            {activeEvent.ctas
              .filter((c) => c.type !== "none" && ctaHref(c))
              .slice(0, 2)
              .map((c, i) => {
                const href = ctaHref(c)!;
                const asBtn = (c.as ?? "button") === "button";
                return (
                  <a
                    key={`cta-${i}`}
                    href={href}
                    target={c.type === "url" || c.type === "pdf" ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className={asBtn ? style.ctaBtn : style.ctaLink}
                  >
                    {c.label}
                  </a>
                );
              })}
          </div>
        ) : null}

        {/* Info / título / fecha + toggle debajo */}
        <div className={style.infoWrap}>
          <div className={style.infoInner}>
            <div className={style.infoTop}>
              <div className={style.titleBox}>
                <H2 className={style.title}>{activeEvent?.title}</H2>
                <P className={style.meta}>
                  {toHumanDate(
                    activeEvent.date,
                    activeEvent.startTime ?? undefined,
                    activeEvent.endTime ?? undefined
                  )}
                  {activeEvent.location ? ` • ${activeEvent.location}` : ""}
                </P>
              </div>

              {/* (opcional) navegación por botones en desktop */}
              <div className={style.eventNav}>
                <BUTTON onClick={goPrevEvent} className={style.evBtn}
                  aria-label={intl.formatMessage({ id: "hero.nav.prev", defaultMessage: "Evento anterior" })}>
                  ←
                </BUTTON>
                <BUTTON onClick={goNextEvent} className={style.evBtn}
                  aria-label={intl.formatMessage({ id: "hero.nav.next", defaultMessage: "Siguiente evento" })}>
                  →
                </BUTTON>
              </div>
            </div>

            {activeEvent?.description ? (
              <div className={style.descBlock}>
                <BUTTON className={style.descToggle} onClick={() => setDescOpen((v) => !v)}>
                  {descOpen
                    ? intl.formatMessage({ id: "hero.desc.hide", defaultMessage: "Ocultar descripción" })
                    : intl.formatMessage({ id: "hero.desc.show", defaultMessage: "Mostrar descripción" })
                  }
                </BUTTON>
                <div className={`${style.descPanel} ${descOpen ? style.open : ""}`}>
                  <P className={style.descText}>{activeEvent.description}</P>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Chips por EVENTO (Firestore) — arriba-centro */}
      {events.length > 1 && (
        <div className={style.eventChips}>
          {events.map((_, i) => (
            <BUTTON
              key={`ev-${i}`}
              aria-label={`Ir al evento ${i + 1}`}
              className={`${style.evDot} ${i === eventIdx ? style.evDotActive : ""}`}
              onClick={() => goToEvent(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: HeroEventsCarousel — complements/components/HeroEventsCarousel/HeroEventsCarousel.tsx
QUÉ HACE:
  Hero slider para próximos eventos: fondo (imagen/video), título/fecha/CTA y autoplay.
  Integra datos de `useEvents` o props directas.

API / EXPORTS / RUTA:
  — export interface HeroEvent { id:string; title:string; date:string; ctaHref?:string; media:{type:"image"|"video";src:string;poster?:string} }
  — export interface HeroEventsCarouselProps { events: HeroEvent[]; intervalMs?: number; showDots?: boolean; className?: string }
  — export default function HeroEventsCarousel(p:HeroEventsCarouselProps): JSX.Element

USO (ejemplo completo):
  <HeroEventsCarousel events={[{id:"1",title:"Banda en vivo",date:"2025-09-01",media:{type:"image",src:"/e1.jpg"}}]} />

NOTAS CLAVE:
  — LCP: primer slide optimizado (<Image priority>).
  — CLS: reservar altura; pausar en hover/visibilitychange.
  — i18n: formatear fechas por locale.

DEPENDENCIAS:
  Next/Image · useEvents (opcional)
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/HeroEventsCarousel/HeroEventsCarousel.tsx
  import HeroEventsCarousel from "@/complements/components/HeroEventsCarousel/HeroEventsCarousel";

  const events = [
    { id:"1", title:"Banda en vivo", date:"2025-09-01", ctaHref:"/eventos/1", media:{ type:"image", src:"/e1.jpg" } },
    { id:"2", title:"DJ Night", date:"2025-09-07", media:{ type:"video", src:"/e2.mp4", poster:"/e2.jpg" } }
  ];

  export default function Hero() {
    return (
      <HeroEventsCarousel
        events={events}                    // HeroEvent[] | requerido
        intervalMs={6000}                  // number | opcional
        showDots                           // boolean | opcional
        className="rounded-2xl overflow-hidden"
      />
    );
  }
────────────────────────────────────────────────────────── */
