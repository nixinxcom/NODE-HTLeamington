"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Props = {
  /** Ruta admin; si no se pasa, infiere /{locale}/admin/agent del pathname */
  adminPath?: string;
  /** Toques necesarios para desbloquear por taps */
  taps?: number;             // default 5
  /** Duración de long-press en ms */
  longPressMs?: number;      // default 800
  /** Ventana temporal para contar taps (ms) */
  windowMs?: number;         // default 3500
  /** Si pasas children, el trigger envuelve ese nodo en vez del hotspot fijo */
  children?: React.ReactNode;
  /** Si quieres ver el hotspot en dev: true lo hace visible con leve overlay */
  debug?: boolean;
};

const KONAMI = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a","Enter",
];

export default function SecretAdminTrigger({
  adminPath,
  taps = 5,
  longPressMs = 800,
  windowMs = 3500,
  children,
  debug = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const locale = pathname.split("/")[1] || "en";
  const target = adminPath ?? `/${locale}/admin`;

  // --- Konami
  const [kIndex, setKIndex] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === KONAMI[kIndex]) {
        const next = kIndex + 1;
        if (next === KONAMI.length) {
          setKIndex(0);
          router.push(target);
        } else {
          setKIndex(next);
        }
      } else {
        // si coincide con inicio de secuencia, reinicia a 1; si no, 0.
        setKIndex(key === KONAMI[0] ? 1 : 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kIndex, router, target]);

  // --- Taps + Long press
  const tapTimes = useRef<number[]>([]);
  const pressTimer = useRef<number | null>(null);

  const registerTap = () => {
    const now = Date.now();
    tapTimes.current = [ ...tapTimes.current.filter(t => now - t <= windowMs), now ];
    if (tapTimes.current.length >= taps) {
      tapTimes.current = [];
      router.push(target);
    }
  };

  const onPointerDown = () => {
    // arrancar long-press
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      router.push(target);
    }, longPressMs);
  };
  const onPointerUpOrCancel = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
      // se considera tap si soltó antes del long-press
      registerTap();
    }
  };

  // --- Wrapper vs Hotspot fijo
  if (children) {
    return (
      <SPAN
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUpOrCancel}
        onPointerCancel={onPointerUpOrCancel}
        onContextMenu={(e:any) => e.preventDefault()}
        className="relative inline-block select-none"
        aria-hidden
      >
        {children}
      </SPAN>
    );
  }

  // Hotspot: esquina inferior derecha (invisible)
  return (
    <BUTTON
      aria-hidden
      title=""
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUpOrCancel}
      onPointerCancel={onPointerUpOrCancel}
      onContextMenu={(e) => e.preventDefault()}
      className={[
        "fixed z-[9999] select-none",
        "right-[max(8px,env(safe-area-inset-right))]",
        "bottom-[max(8px,env(safe-area-inset-bottom))]",
        "h-9 w-9 rounded-md",
        debug ? "bg-black/10 outline outline-1 outline-white/20" : "bg-transparent",
        "opacity-0 focus:opacity-0 active:opacity-0", // siempre invisible
      ].join(" ")}
    />
  );
}
