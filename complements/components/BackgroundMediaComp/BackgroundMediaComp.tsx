import React, { useState, useRef, useEffect } from 'react';
import styles from './BackgroundMediaComp.module.css';
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

interface BackgroundMediaProps {
    url: string;
    type: 'image' | 'video';
    MuteButton?: boolean; // Propiedad opcional para mostrar el botón de mute
}

const BackgroundMedia: React.FC<BackgroundMediaProps> = ({ url, type, MuteButton = true }) => {
    const [isMuted, setIsMuted] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const intl = useIntl();

    // Función para alternar el mute en el iframe de YouTube
    const toggleMute = () => {
        if (iframeRef.current) {
            const player = iframeRef.current;
            const isMuted = !iframeRef.current?.src.includes('mute=1');
            setIsMuted(isMuted);
            player.contentWindow?.postMessage(
                JSON.stringify({
                    event: 'command',
                    func: isMuted ? 'unMute' : 'mute',
                    args: [],
                }),
                '*'
            );
        }
    };

    const getYouTubeEmbedUrl = (videoUrl: string) => {
        const videoId = videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('/').pop();
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&playsinline=1&enablejsapi=1`;
    };

    useEffect(() => {
        // Esto se usa para manejar el mute inicial
        if (iframeRef.current) {
            const player = iframeRef.current;
            player.contentWindow?.postMessage(
                JSON.stringify({
                    event: 'command',
                    func: isMuted ? 'mute' : 'unMute',
                    args: [],
                }),
                '*'
            );
        }
    }, [isMuted]);

    return (
        <div className={styles.backgroundContainer}>
            {type === 'video' && url.includes('youtube.com') ? (
                <>
                    <iframe
                        ref={iframeRef}
                        className={styles.backgroundMedia}
                        src={getYouTubeEmbedUrl(url)}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title={intl.formatMessage({ id: "bgmedia.iframeTitle", defaultMessage: "Background Video" })}
                    />
                    <div className={styles.blocker} />
                    {MuteButton && (
                        <BUTTON className={styles.muteButton} onClick={toggleMute}>
                            {isMuted
                                ? intl.formatMessage({ id: "bgmedia.unmute", defaultMessage: "Unmute" })
                                : intl.formatMessage({ id: "bgmedia.mute", defaultMessage: "Mute" })
                            }
                        </BUTTON>
                    )}
                </>
            ) : type === 'image' ? (
                <div 
                    className={styles.backgroundMedia} 
                    style={{ backgroundImage: `url(${url})` }} 
                />
            ) : (
                <video
                    autoPlay
                    loop
                    muted={isMuted}
                    className={styles.backgroundMedia}
                    src={url}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                >
                    <FM id="bgmedia.noVideoSupport" defaultMessage="Your browser does not support the video tag." />
                </video>
            )}
        </div>
    );
};

export default BackgroundMedia;

/* ─────────────────────────────────────────────────────────
DOC: BackgroundMediaComp — complements/components/BackgroundMediaComp/BackgroundMediaComp.tsx
QUÉ HACE:
  Renderiza una imagen o video a pantalla completa como fondo (cover), con overlay opcional
  y slot para contenido superpuesto (children).

API / EXPORTS / RUTA:
  — export interface BackgroundMediaProps {
      type: "image"|"video"                      // requerido
      src: string                                // requerido
      poster?: string                            // opcional (video)
      overlay?: string | React.ReactNode         // opcional | color/gradiente o nodo
      blur?: number                              // opcional | px
      className?: string
      children?: React.ReactNode
    }
  — export default function BackgroundMediaComp(p:BackgroundMediaProps): JSX.Element

USO (ejemplo completo):
  <BackgroundMediaComp type="image" src="/hero.jpg" overlay="linear-gradient(#0006,#0006)">
    <H1 className="text-white">Bienvenidos</H1>
  </BackgroundMediaComp>

NOTAS CLAVE:
  — Usar object-fit: cover; reservar altura mínima (vh).
  — Video: autoplay muted loop playsInline; fallback a imagen si ahorro de datos.
  — Asegurar contraste de texto (overlay/blur).

DEPENDENCIAS:
  Next/Image (para imágenes) · HTMLVideoElement API
────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
DOC: USO (ejemplo completo) — complements/components/BackgroundMediaComp/BackgroundMediaComp.tsx
  "use client";
  import BackgroundMediaComp from "@/complements/components/BackgroundMediaComp/BackgroundMediaComp";

  export default function Hero() {
    return (
      <BackgroundMediaComp
        type="image"                                // "image"|"video" | requerido
        src="/banners/hero.jpg"                     // string | requerido
        overlay="linear-gradient(#0008,#0008)"      // string|ReactNode | opcional
        blur={0}                                    // number | opcional
        className="h-[60vh]"
      >
        <div className="h-full flex items-center justify-center text-white">
          <H1 className="text-4xl font-bold">El Patrón Bar & Grill</H1>
        </div>
      </BackgroundMediaComp>
    );
  }
  // Para video:
  // <BackgroundMediaComp type="video" src="/hero.mp4" poster="/hero.jpg" />
────────────────────────────────────────────────────────── */
