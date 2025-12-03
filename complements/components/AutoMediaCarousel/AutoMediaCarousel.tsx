"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import css from "./AutoMediaCarousel.module.css";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

/**
 * AutoMediaCarousel
 *
 * Slider/carousel accesible que soporta imágenes, GIFs y videos.
 * - Avanza automáticamente cada `interval` ms, o usando `durationMs` por diapositiva.
 * - Para videos, detecta el final y avanza automáticamente cuando termina.
 * - Para GIFs: los navegadores NO emiten eventos de "ended" para <img>,
 *   por lo que **se recomienda** especificar `durationMs` del GIF.
 * - Dots (puntos) inferiores navegables con click y teclado.
 * - Acciones por diapositiva mediante `href` (ruta interna o URL externa) o `onAction` custom.
 * - Soporta pausar al pasar el mouse, interacción por swipe en móvil, y accesibilidad con teclado.
 *
 * Tailwind CSS requerido para estilos básicos.
 */

export type SlideKind = "image" | "gif" | "video";

export interface MediaSlide {
  id?: string;
  kind: SlideKind;
  src: string; // ruta/URL del recurso
  alt?: string; // texto alternativo (accesibilidad)
  /**
   * Duración preferida para esta diapositiva en ms. Útil/NECESARIO para GIFs si quieres
   * avanzar exactamente al concluir la animación (los <img> no exponen su duración real).
   */
  durationMs?: number;
  /** Si se especifica, al hacer click en la diapositiva se ejecuta esta navegación/acción */
  href?: string; // "/ruta-interna" | "https://externa" | "tel:+1..." | "mailto:..."
  target?: "_self" | "_blank" | "_parent" | "_top";
  /** Etiqueta opcional para tooltip/aria-label del punto */
  label?: string;
  /** Poster/miniatura opcional para videos */
  poster?: string;
  /** Loop del video (si aplica). Por defecto false (queremos detectar ended). */
  videoLoop?: boolean;
  /** Iniciar video en mute (necesario para autoplay en la mayoría de navegadores). */
  videoMuted?: boolean; // default true
}

export interface AutoMediaCarouselProps {
  slides: MediaSlide[];
  interval?: number; // ms por defecto si la slide no define su durationMs
  autoplay?: boolean;
  loop?: boolean; // si false, se detiene al llegar al final
  pauseOnHover?: boolean;
  showDots?: boolean;
  className?: string;
  /**
   * CSS aspect-ratio (por ejemplo "16/9" o "4/3"). Si no se pasa, se ajusta al contenido.
   * Puedes usar utilidades tailwind como "aspect-[16/9]" en className.
   */
  aspectRatio?: string;
  /** callback al cambiar de diapositiva */
  onSlideChange?: (index: number) => void;
  /**
   * Acción custom si se hace click en la diapositiva y no hay `href`,
   * o si quieres interceptar antes de la navegación por `href`.
   * Devuelve true si ya manejaste la acción y NO quieres que el componente
   * haga la navegación por defecto.
   */
  onAction?: (slide: MediaSlide, index: number) => boolean | void;
}

const isExternalUrl = (href: string) => /^(https?:)?\/\//i.test(href);

const isTelOrMail = (href: string) => /^(tel:|mailto:)/i.test(href);

export default function AutoMediaCarousel({
  slides,
  interval = 5000,
  autoplay = true,
  loop = true,
  pauseOnHover = true,
  showDots = true,
  className,
  aspectRatio,
  onSlideChange,
  onAction,
}: AutoMediaCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();

  const total = slides.length;
  const safeIndex = (i: number) => {
    if (i < 0) return loop ? (i + total) % total : 0;
    if (i >= total) return loop ? i % total : total - 1;
    return i;
  };

  const goTo = useCallback(
    (i: number) => {
      const next = safeIndex(i);
      setIndex(next);
      onSlideChange?.(next);
    },
    [onSlideChange, total, loop]
  );

  const next = useCallback(() => {
    if (!loop && index >= total - 1) return; // no avanzar si no hay loop y ya estamos al final
    goTo(index + 1);
  }, [index, total, loop, goTo]);

  const prev = useCallback(() => {
    if (!loop && index <= 0) return; // no retroceder si no hay loop y ya estamos al inicio
    goTo(index - 1);
  }, [index, loop, goTo]);

  // Timer para auto-avance (imágenes y GIFs, o fallback de videos)
  const timerRef = useRef<number | null>(null);
  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const currentSlide = slides[index];
  const currentDuration = currentSlide?.durationMs ?? interval;

  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    clearTimer();
    const shouldRunTimer = autoplay && !isPaused && !prefersReducedMotion;

    // Para videos, intentamos depender de "ended"; de todos modos ponemos fallback por si acaso.
    if (shouldRunTimer && currentSlide && currentSlide.kind !== "video") {
      timerRef.current = window.setTimeout(next, Math.max(800, currentDuration));
    }

    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, autoplay, isPaused, interval, currentDuration, prefersReducedMotion]);

  // refs y handlers para video
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      if (autoplay && !isPaused && !prefersReducedMotion) {
        next();
      }
    };

    // Fallback: por si el navegador bloquea autoplay; usamos un temporizador del durationMs o del video.
    let fallbackTimer: number | null = null;
    const setupFallback = () => {
      const ms = currentSlide?.durationMs || (video.duration && isFinite(video.duration) ? video.duration * 1000 : interval);
      if (autoplay && !isPaused && !prefersReducedMotion) {
        fallbackTimer = window.setTimeout(() => {
          if (!video.ended) {
            next();
          }
        }, Math.max(800, ms));
      }
    };

    video.addEventListener("ended", handleEnded);
    setupFallback();

    return () => {
      video.removeEventListener("ended", handleEnded);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
    };
  }, [index, autoplay, isPaused, prefersReducedMotion, next, interval, currentSlide?.durationMs]);

  // Hover para pausar
  const hoverProps = pauseOnHover
    ? {
        onMouseEnter: () => setIsPaused(true),
        onMouseLeave: () => setIsPaused(false),
      }
    : {};

  // Swipe simple (touch)
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    if (touchStartX.current == null || touchEndX.current == null) return;
    const dx = touchEndX.current - touchStartX.current;
    const THRESH = 40; // px
    if (dx > THRESH) prev();
    else if (dx < -THRESH) next();
    touchStartX.current = touchEndX.current = null;
  };

  // Click/acción de la slide
  const runAction = useCallback(
    (slide: MediaSlide, i: number) => {
      if (!slide) return;
      // Interceptación opcional del usuario
      const intercepted = onAction?.(slide, i);
      if (intercepted) return; // si devuelve true, no continuamos

      if (slide.href) {
        const href = slide.href;
        if (href.startsWith("/")) {
          router.push(href);
          return;
        }
        if (isTelOrMail(href)) {
          window.location.href = href; // tel: o mailto:
          return;
        }
        if (isExternalUrl(href)) {
          window.open(href, slide.target ?? "_self");
          return;
        }
        // fallback genérico
        window.location.href = href;
      }
    },
    [onAction, router]
  );

  // Teclado accesible: ← → para navegar, Enter para activar acción
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Enter") {
        runAction(slides[index], index);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [index, next, prev, runAction, slides]);

  return (
    <div
      ref={containerRef}
      className={[
        "relative w-full select-none", // contenedor
        aspectRatio ? "[aspect-ratio:var(--carousel-ar)]" : "",
        className ?? "",
      ].join(" ")}
      style={aspectRatio ? ({ ['--carousel-ar' as any]: aspectRatio } as React.CSSProperties) : undefined}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Galería de medios"
      tabIndex={0}
      {...hoverProps}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div className={css.frame}>
        {slides.map((slide, i) => {
          const isActive = i === index;
          return (
            <div
              key={slide.id ?? i}
              className={`${css.fadeLayer} ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
              aria-hidden={!isActive}
            >
              {/* Capa clicable para acción */}
              <BUTTON
                type="button"
                className={css.clickLayer}
                onClick={() => runAction(slide, i)}
                aria-label={slide.label ? `Abrir: ${slide.label}` : "Abrir elemento"}
              />

              {/* Media */}
              {slide.kind === "video" ? (
                <video
                  ref={isActive ? videoRef : undefined}
                  className="block h-full w-full object-cover"
                  src={slide.src}
                  poster={slide.poster}
                  muted={slide.videoMuted !== false}
                  playsInline
                  autoPlay={autoplay && !isPaused}
                  controls={false}
                  loop={slide.videoLoop === true}
                />
              ) : (
                <img
                  className="block h-full w-full object-cover"
                  src={slide.src}
                  alt={slide.alt ?? ""}
                  loading="lazy"
                  draggable={false}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Controles izquierda/derecha */}
      <div className={css.controlsBar}>
        <BUTTON
          type="button"
          className={css.arrowBtn}
          aria-label="Anterior"
          onClick={prev}
        >
          {/* Icono simple */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </BUTTON>
        <BUTTON
          type="button"
          className={css.arrowBtn}
          aria-label="Siguiente"
          onClick={next}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </BUTTON>
      </div>

      {/* Dots */}
      {showDots && (
        <div className={css.dotsRow}>
          {slides.map((s, i) => {
            const active = i === index;
            return (
              <BUTTON
                key={s.id ?? i}
                type="button"
                aria-label={s.label ? `Ir a ${s.label}` : `Ir a la diapositiva ${i + 1}`}
                aria-current={active ? "true" : undefined}
                className={`${css.dot} ${
                  active ? "scale-110 bg-white" : "bg-white/50 hover:bg-white/80"
                }`}
                onClick={() => goTo(i)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}