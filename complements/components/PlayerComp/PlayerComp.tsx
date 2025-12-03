"use client";
import React, { useEffect, useRef, useCallback } from "react";
import styles from "./PlayerComp.module.css";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

export interface IPlayer {
  url: string;
  setState: (open: boolean) => void;
  width: number;
  height: number;
  readOnly: boolean;
  vertical: "Top" | "Bottom" | "Center";
  horizontal: "Left" | "Right" | "Center";
  position?: "relative" | "fixed" | "absolute" | "static" | "sticky";
  volume?: 0.01 | 0.25 | 0.5 | 0.75 | 1;
  typeDevice?: boolean;
  controls?: boolean;
  playing?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  details?: React.ReactNode;
}

function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

function youtubeEmbed(url: string) {
  // convierte a embed si es posible
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      // fallback
      return url;
    }
  } catch (e) {
    return url;
  }
  return url;
}

export default function PlayerComp(props: IPlayer) {
  const {
    url,
    setState,
    width,
    height,
    readOnly,
    volume = 1,
    controls = true,
    playing = false,
    autoplay = false,
    muted = false,
    loop = false,
    position = "fixed",
    details,
  } = props;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusableRef = useRef<HTMLButtonElement | null>(null);

  // Cerrar y pausar video
  const handleClose = useCallback(() => {
    // pausa video si existe
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (e) {}
    }
    setState(false);
  }, [setState]);

  // Esc para cerrar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      // simple focus trap: ciclo con Tab
      if (e.key === "Tab" && wrapperRef.current) {
        const focusable = wrapperRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          (first as HTMLElement).focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          (last as HTMLElement).focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // Al abrir, ajustar volume/autoplay y foco
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = Number(volume);
      if (autoplay) {
        // intento de autoplay; muchos navegadores bloquean si no está muted
        if (muted) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.play().catch(() => {});
        }
      } else if (playing) {
        videoRef.current.play().catch(() => {});
      }
    }
    // focus en primer botón (cerrar)
    setTimeout(() => firstFocusableRef.current?.focus(), 50);
  }, [autoplay, muted, playing, volume, url]);

  // clic en backdrop cierra
  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  // Render del reproductor: video nativo o iframe (YouTube/Vimeo)
  const renderPlayer = () => {
    if (isVideoFile(url)) {
      return (
        <video
          ref={videoRef}
          src={url}
          width={width}
          height={height}
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          className={styles.video}
        />
      );
    }

    if (isYouTube(url)) {
      const embed = youtubeEmbed(url);
      return (
        <iframe
          src={`${embed}?rel=0&showinfo=0&autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}`}
          title="Video"
          width={width}
          height={height}
          allow="autoplay; encrypted-media"
          className={styles.iframe}
        />
      );
    }

    // fallback: iframe general
    return (
      <iframe
        src={url}
        title="Video"
        width={width}
        height={height}
        allow="autoplay; encrypted-media"
        className={styles.iframe}
      />
    );
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={onBackdropClick}
      ref={wrapperRef}
      style={{ position }}
    >
      <div
        className={`${styles.panel} ${styles.panelFit}`}
        role="document"
        aria-label="Video player"
        /* movido a CSS: .panelFit (—> PlayerComp.module.css) */
      >
        <div className={styles.header}>
          <BUTTON
            aria-label="Cerrar"
            onClick={handleClose}
            className={styles.closeBtn}
            ref={firstFocusableRef}
          >
            ✕
          </BUTTON>
        </div>

        <div className={styles.content}>
          {renderPlayer()}

          {/* Renderizar detalles si existen */}
          {details && <div className={styles.detailsContainer}>{details}</div>}
        </div>

        {/* botón oculto al final para ayudar al focus trap */}
        <BUTTON
          className={styles.hiddenFocus}
          aria-hidden
          ref={lastFocusableRef}
          onClick={() => {
            /* noop */
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
DOC: PlayerComp — complements/components/PlayerComp/PlayerComp.tsx
QUÉ HACE:
  Reproductor de media (audio/video) con controles, poster, autoplay y eventos (onPlay/onPause).

API / EXPORTS / RUTA:
  — export interface PlayerProps {
      type: "audio"|"video"; src: string; poster?: string; autoPlay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean; className?: string
    }
  — export default function PlayerComp(p:PlayerProps): JSX.Element

USO (ejemplo completo):
  <PlayerComp type="video" src="/promo.mp4" poster="/promo.jpg" autoPlay muted loop controls />

NOTAS CLAVE:
  — Accesibilidad: captions/subtítulos si aplica.
  — Datos: respetar ahorro de datos y autoplay policies (muted).

DEPENDENCIAS:
  HTMLMediaElement APIs
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO — complements/components/PlayerComp/PlayerComp.tsx
  "use client";
  import PlayerComp from "@/complements/components/PlayerComp/PlayerComp";

  export default function Promo() {
    return (
      <>
        <PlayerComp
          type="video"                 // "audio"|"video" | requerido
          src="/media/promo.mp4"       // string | requerido
          poster="/media/promo.jpg"    // string | opcional
          autoPlay muted loop          // boolean | opcional
          controls                     // boolean | opcional
          className="rounded-xl w-full"
        />
        <PlayerComp type="audio" src="/media/track.mp3" controls className="mt-4 w-full" />
      </>
    );
  }
────────────────────────────────────────────────────────── */
