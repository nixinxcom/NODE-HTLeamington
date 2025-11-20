"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./InstallPWAComp.module.css";
import { FormattedMessage } from "react-intl";
import FM from "@/complements/i18n/FM";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

type Outcome = "accepted" | "dismissed";
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: Outcome; platform: string }>;
}

const AUTO_HIDE_MS = 8000; // tiempo visible del popup (ms)

export default function InstallPWAComp() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const isStandalone = useCallback(() => {
    const standaloneDisplay =
      window.matchMedia?.("(display-mode: standalone)").matches ?? false;
    const iosStandalone =
      typeof (navigator as any).standalone !== "undefined" &&
      (navigator as any).standalone;
    return Boolean(standaloneDisplay || iosStandalone);
  }, []);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstallable(false);
      setShowToast(false);
    }

    const onBeforeInstallPrompt = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      if (process.env.NODE_ENV === "production") {
        ev.preventDefault();
      } else {
        try { ev.preventDefault(); } catch {}
      }
      // ev.preventDefault(); // tomamos control del banner nativo
      deferredRef.current = ev;
      setIsInstallable(true);
      setShowToast(true); // mostrar popup fijo por unos segundos
    };



    const onAppInstalled = () => {
      deferredRef.current = null;
      setIsInstallable(false);
      setShowToast(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [isStandalone]);

  // Autocierre del toast después de N segundos
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [showToast]);

  const doInstall = async () => {
    const ev = deferredRef.current;
    if (!ev) return;
    await ev.prompt(); // <- muestra el prompt nativo (requiere gesto del usuario)
    await ev.userChoice; // accepted | dismissed
    // El evento sólo se puede usar una vez:
    deferredRef.current = null;
    setIsInstallable(false);
    setShowToast(false);
  };

  // Si no es instalable aún, no renderizamos nada (mantiene tu UX actual)
  if (!isInstallable) return null;

  return (
    <>
      {/* BOTÓN EXISTENTE: conserva tu estilo/i18n */}
      <BUTTON
        className={styles.InstallPWA}
        role="button"
        onClick={doInstall}
        aria-label="install-app"
      >
        <SPAN>
          <FM id="global.installApp" defaultMessage="Install App" />
        </SPAN>
      </BUTTON>

      {/* POPUP FIJO TEMPORAL (solo cuando se habilita la instalación) */}
      {showToast && (
        <div
          role="dialog"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 9999,
            maxWidth: 560,
            margin: "0 auto",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.1)",
            background: "rgba(255,255,255,0.95)",
            color: "rgba(0,0,0,1)",
            backdropFilter: "saturate(1.1) blur(6px)",
            boxShadow:
              "0 8px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <SPAN style={{ fontSize: 14 }}>
            <FM
              id="global.installAppHint"
              defaultMessage="Add this app to your device for faster access."
            />
          </SPAN>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <BUTTON
              onClick={() => setShowToast(false)}
              aria-label="close-install-hint"
              style={{
                fontSize: 14,
                padding: "6px 10px",
                background: "transparent",
                border: "1px solid rgba(0,0,0,0.15)",
                color: "rgba(0,0,0,1)",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <FM id="global.later" defaultMessage="Later" />
            </BUTTON>

            <BUTTON
              onClick={doInstall}
              aria-label="confirm-install"
              style={{
                fontSize: 14,
                padding: "6px 12px",
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <FM id="global.install" defaultMessage="Install" />
            </BUTTON>
          </div>
        </div>
      )}
    </>
  );
}