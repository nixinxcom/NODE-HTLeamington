// app/lib/notifications/provider.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FbAuth } from "@/app/lib/services/firebase";
import { useProvider } from "@/app/providers/FdvProvider";
import type iSettings from "@/app/lib/settings/interface";

type PermissionState = NotificationPermission | "unsupported" | "error";

export type NotificationsContextValue = {
  supported: boolean;
  permission: PermissionState;
  loading: boolean;
  token: string | null;
  error?: string;
  /** Forzar el flujo de pedir permiso + obtener token */
  requestPermissionAndToken: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue>({
  supported: false,
  permission: "default",
  loading: false,
  token: null,
  error: undefined,
  requestPermissionAndToken: async () => {},
});

/** Hook público */
export function useNotifications(): NotificationsContextValue {
  return useContext(NotificationsContext);
}

/* ─────────────────────────────────────────────────────────
   Provider
   ───────────────────────────────────────────────────────── */

type Props = { children: React.ReactNode };

export const NotificationsProvider: React.FC<Props> = ({ children }) => {
  const { value: settings } = useProvider<iSettings>("settings");

  const [supported, setSupported] = useState(false);
  const [permission, setPermission] =
    useState<PermissionState>(
      typeof Notification !== "undefined" ? Notification.permission : "default",
    );
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  // Habilitado desde Settings (faculties / flag específica) → FDV
  const notificationsEnabled = useMemo(() => {
    if (!settings) return false;
    const anySettings: any = settings;
    if (anySettings?.faculties?.notifications === true) return true;
    if (anySettings?.notifications?.enabled === true) return true;
    return false;
  }, [settings]);

  const requestPermissionAndToken = useCallback(async () => {
    if (typeof window === "undefined") return;
    setError(undefined);

    try {
      setLoading(true);

      // Cargamos firebase/messaging SOLO en cliente para evitar problemas en SSR
      const { getMessaging, getToken, isSupported, onMessage } =
        await import("firebase/messaging");

      const isSup = await isSupported().catch(() => false);
      setSupported(isSup);
      if (!isSup) {
        setPermission("unsupported");
        setLoading(false);
        return;
      }

      // Permisos del navegador
      let perm: NotificationPermission;
      if (Notification.permission === "default") {
        perm = await Notification.requestPermission();
      } else {
        perm = Notification.permission;
      }
      setPermission(perm);

      if (perm !== "granted") {
        setLoading(false);
        return;
      }

      // Obtener token de FCM
      const messaging = getMessaging();
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.error("[Notifications] Falta NEXT_PUBLIC_FIREBASE_VAPID_KEY");
        setError("missing-vapid");
        setLoading(false);
        return;
      }

      const t = await getToken(messaging, { vapidKey });
      if (!t) {
        setError("no-token");
        setLoading(false);
        return;
      }

      setToken(t);

      // Listener opcional para mensajes en foreground
      onMessage(messaging, (payload) => {
        console.log("[Notifications] mensaje en foreground", payload);
      });

      // Registrar token en el backend (un solo modelo: /api/push/subscribe)
      try {
        const user = FbAuth?.currentUser ?? null;
        const idToken = user ? await user.getIdToken().catch(() => null) : null;

        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({
            token: t,
            platform: "web",
          }),
        });

        if (!res.ok) {
          console.warn(
            "[Notifications] Error en /api/push/subscribe",
            await res.text(),
          );
        } else {
          console.log(
            "[Notifications] Token registrado vía /api/push/subscribe",
          );
        }
      } catch (err) {
        console.warn("[Notifications] Error registrando token", err);
      }

      setLoading(false);
    } catch (e: any) {
      console.error("[Notifications] error general", e);
      setError(String(e?.message || e));
      setLoading(false);
    }
  }, []);

  // Auto-registro cuando:
  //  - hay Settings (FDV)
  //  - notificationsEnabled = true
  //  - todavía no tenemos token
  useEffect(() => {
    if (!notificationsEnabled) return;
    if (token) return;
    if (permission === "denied" || permission === "unsupported") return;
    // no bloqueamos el render, solo disparamos en background
    void requestPermissionAndToken();
  }, [notificationsEnabled, token, permission, requestPermissionAndToken]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      supported,
      permission,
      loading,
      token,
      error,
      requestPermissionAndToken,
    }),
    [supported, permission, loading, token, error, requestPermissionAndToken],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
