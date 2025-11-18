'use client';

import Image from "next/image";
// import Link from "next/link";
import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import styles from "./InterComp.module.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { IntlProvider } from "react-intl";

interface iLanguages {
  language?: string;
  locale: string;   // "es" | "es-MX" | "en-US" | "fr-CA"
  icon?: string;
  country?: string;
  alt?: string;
  prioritario?: boolean;
  width?: number;
  height?: number;
  fill?: boolean;
}

interface iInternational {
  Langs: iLanguages[];
  Position?: "relative" | "absolute" | "fixed";
  BackgroundColor?: string;
  Top?: string;
  Bottom?: string;
  Left?: string;
  Right?: string;
  ShowLangs?: "all" | "oneBYone";
  messages?: Record<string, string>;
  children?: React.ReactNode;
}

type Short = "es" | "en" | "fr";

function shortOf(input?: string): Short {
  if (!input) return "en";
  const v = String(input).toLowerCase();
  if (v.startsWith("es")) return "es";
  if (v.startsWith("fr")) return "fr";
  return "en";
}

export default function InterComp(props: iInternational) {
  const [minimized, setMinimized] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname() || "/";
  const qs = useSearchParams();

  // Auto-minimizar
  useEffect(() => {
    timerRef.current = setTimeout(() => setMinimized(true), 7000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);
  useEffect(() => {
    if (!minimized) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setMinimized(true), 3500);
    }
  }, [minimized]);

  const toggleMinimized = () => setMinimized(prev => !prev);

  if (!props.Langs?.length) {
    // Aún así provee contexto Intl para children
    return (
      <IntlProvider locale={`${process.env.NEXT_PUBLIC_DEFAULT_LOCALE}`} messages={props.messages ?? {}}>
        {props.children ?? null}
      </IntlProvider>
    );
  }

  // Orden normalizado (corto) exactamente según tu array
  const order = useMemo(() => {
    return props.Langs.map((l, idx) => ({ idx, short: shortOf(l.locale) }));
  }, [props.Langs]);

  // Locale actual tomado de la URL (fuente de verdad)
  const firstSeg = (pathname.split("/")[1] || "").toLowerCase(); // "en" o "fr-ca"
  const currentShort = shortOf(firstSeg);

  // Helpers para construir href preservando path + query + hash
  const buildHref = (targetShort: Short) => {
    const first = (pathname.split("/")[1] || "").toLowerCase();
    const firstShort = shortOf(first);
    const hasLocale = !!first && (first === firstShort || first.startsWith(firstShort + "-"));
    const cutLen = hasLocale ? 1 + first.length : 0;               // incluye '/'
    const rest = hasLocale ? (pathname.slice(cutLen) || "/") : pathname;
    const tail = rest === "/" ? "" : rest;
    const query = qs && qs.toString() ? `?${qs}` : "";
    const hash = (typeof window !== "undefined" && window.location.hash) ? window.location.hash : "";
    return `/${targetShort}${tail}${query}${hash}`;
  };

  // Índices deterministas en TU orden
  const currentIdx = useMemo(() => {
    const i = order.findIndex(o => o.short === currentShort);
    return i >= 0 ? i : 0;
  }, [order, currentShort]);

  const nextIdx = useMemo(() => {
    if (!order.length) return 0;
    return (currentIdx + 1) % order.length; // siguiente en tu orden: es→en→fr→es…
  }, [order, currentIdx]);

  return (
    <IntlProvider locale={currentShort} messages={props.messages ?? {}}>
      <div
        className={`${styles.LangsContainer} ${minimized ? styles.minimized : styles.expanded}`}
        style={{
          position: props.Position,
          backgroundColor: props.BackgroundColor,
          top: props.Top,
          bottom: props.Bottom,
          left: props.Left,
          right: props.Right,
        }}
        onClick={toggleMinimized}
      >
        {props.ShowLangs === "oneBYone" ? (
          // Muestra SIEMPRE el “siguiente” respecto al actual → primer clic siempre cambia
          <div className={styles.Lngdiv} key={`one-${nextIdx}`}>
            {props.Langs[nextIdx]?.icon && (
              <LINK
                href={buildHref(order[nextIdx].short)}
                replace
                scroll={false}
                onClick={(e) => e.stopPropagation()}
              >
                <IMAGE
                  src={props.Langs[nextIdx].icon!}
                  width={props.Langs[nextIdx].width ?? 35}
                  height={props.Langs[nextIdx].height ?? 35}
                  priority={props.Langs[nextIdx].prioritario ?? true}
                  alt={props.Langs[nextIdx].alt || ""}
                />
              </LINK>
            )}
            {!minimized && props.Langs[nextIdx]?.language && (
              <P className={styles.LngLgnd}>{props.Langs[nextIdx].language}</P>
            )}
          </div>
        ) : (
          // "all": respeta el orden exactamente como lo envías
          props.Langs.map((lang, index) => (
            <div className={styles.Lngdiv} key={`all-${index}`}>
              {lang.icon && (
                <LINK
                  href={buildHref(shortOf(lang.locale))}
                  replace
                  scroll={false}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IMAGE
                    src={lang.icon}
                    width={lang.width ?? 35}
                    height={lang.height ?? 35}
                    priority={lang.prioritario ?? true}
                    alt={lang.alt || ""}
                  />
                </LINK>
              )}
              {!minimized && lang.language && (
                <P className={styles.LngLgnd}>{lang.language}</P>
              )}
            </div>
          ))
        )}
      </div>
      {props.children ?? null}
    </IntlProvider>
  );
}