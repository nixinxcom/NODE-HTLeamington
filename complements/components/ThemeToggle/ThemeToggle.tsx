'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import s from "./ThemeToggle.module.css";
import { useAppContext } from "@/context/AppContext";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Theme = "light" | "dark";

type Props = {
  /** Añade clases extra (opcional). Si no pasas nada, usa 'btn' por defecto. */
  className?: string;
  /** Botón flotante en esquina inferior derecha (default: false) */
  floating?: boolean;
  /** Etiquetas accesibles (opcional) */
  labels?: { toDark?: string; toLight?: string };
  /**
   * @deprecated El almacenamiento lo maneja AppContext (key "theme.slot").
   * Se mantiene por compatibilidad pero no se usa.
   */
  storageKey?: string;
};

export default function ThemeToggle({
  className,
  floating = false,
  labels = {
    toDark: "Cambiar a modo oscuro",
    toLight: "Cambiar a modo claro",
  },
}: Props) {
  const { Theme } = useAppContext();
  const [mounted, setMounted] = useState(false);

  // Evita flicker y evita renderizar props dinámicas en SSR
  useEffect(() => { setMounted(true); }, []);

  // Slot efectivo: antes de mounted no dependemos de estado; usamos el atributo actual del DOM si existe
  const effectiveSlot: Theme = useMemo(() => {
    if (mounted && (Theme.slot === "light" || Theme.slot === "dark")) return Theme.slot;
    if (typeof document !== "undefined") {
      const ds = document.documentElement.getAttribute("data-theme");
      if (ds === "light" || ds === "dark") return ds as Theme;
    }
    return "light";
  }, [mounted, Theme.slot]);

  const toggle = useCallback(() => {
    const next: Theme = effectiveSlot === "dark" ? "light" : "dark";
    Theme.setSlot(next); // persiste y sincroniza data-theme + class 'dark'
  }, [Theme, effectiveSlot]);

  // Para SSR: no emitas aria dinámicos; tras mounted sí.
  const ariaPressed = mounted ? effectiveSlot === "dark" : undefined;
  const ariaLabel = mounted
    ? (effectiveSlot === "dark" ? labels.toLight : labels.toDark)
    : undefined;

  // Usa 'btn' por defecto si no te pasan className
  const cls = [s.btn, floating && s.floating, className || "btn"]
    .filter(Boolean)
    .join(" ");

  return (
    <BUTTON
      type="button"
      onClick={toggle}
      className={cls}
      // Evita warnings si el DOM cambió antes de hidratar (por script de slot)
      suppressHydrationWarning
      aria-pressed={ariaPressed}
      aria-label={ariaLabel}
      title={ariaLabel}
      // Suaviza la aparición tras mounted
      style={{ opacity: mounted ? 1 : 0 }}
    >
      <Image
        src="/Icons/DayNightIcon.png"
        alt=""
        width={28}
        height={28}
        className={s.icon}
        priority
      />
    </BUTTON>
  );
}
