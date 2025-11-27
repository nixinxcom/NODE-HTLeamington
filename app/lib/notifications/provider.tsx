// app/lib/notifications/provider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAppContext } from "@/context/AppContext";
import { hasNotificationsFaculty } from "./config";
import { Firebase } from "@/app/lib/services/firebase";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

type NotificationItem = {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
};

type NotificationsContextValue = {
  enabled: boolean;
  permission: NotificationPermission;
  token?: string;
  unread: number;
  notifications: NotificationItem[];
  requestPermission: () => Promise<void>;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue>({
  enabled: false,
  permission: "default",
  token: undefined,
  unread: 0,
  notifications: [],
  requestPermission: async () => {},
  markAllRead: () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { Settings } = useAppContext();

  // Faculties solo desde FDV (Providers/Settings vía ContextProvider)
  const enabled = useMemo(
    () => hasNotificationsFaculty(Settings),
    [Settings],
  );

  if (typeof window !== "undefined") {
    console.log("[NIXINX][Notifications] faculties (FDV):", Settings?.faculties);
    console.log("[NIXINX][Notifications] enabled =", enabled);
  }

  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [token, setToken] = useState<string>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    let cancelled = false;

    // Sincronizar permiso real del navegador al montar
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    (async () => {
      try {
        const supported = await isSupported().catch(() => false);
        if (!supported) {
          console.warn("[nixinx:push] FCM no soportado en este navegador");
          return;
        }

        const swReg = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/fcm/" },
        );

        if (Notification.permission === "granted") {
          await obtainAndSendToken(swReg);
        }

        const messaging = getMessaging(Firebase);
        onMessage(messaging, (payload) => {
          if (cancelled) return;
          const n: NotificationItem = {
            title: payload.notification?.title || "",
            body: payload.notification?.body || "",
            icon: payload.notification?.icon,
            data: (payload.data as any) || undefined,
          };
          setNotifications((prev) => [n, ...prev]);
          setUnread((prev) => prev + 1);
        });
      } catch (err) {
        console.warn(
          "[nixinx:push] error inicializando notificaciones",
          err,
        );
      }
    })();

    async function obtainAndSendToken(swReg: ServiceWorkerRegistration) {
      try {
        const vapidKey = process.env.NEXT_PUBLIC_FBCLOUD_MESSAGES_VAPID_KEY;
        if (!vapidKey) {
          console.warn(
            "[nixinx:push] Falta NEXT_PUBLIC_FBCLOUD_MESSAGES_VAPID_KEY",
          );
          return;
        }
        const messaging = getMessaging(Firebase);
        const t = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swReg,
        });
        if (!t || cancelled) return;
        setToken(t);
        console.log("[nixinx:push] token FCM obtenido", t);

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: t, platform: "web" }),
        });
      } catch (err) {
        console.warn("[nixinx:push] getToken/subscribe error", err);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const requestPermission = async () => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const res = await Notification.requestPermission();
    setPermission(res);
  };

  const markAllRead = () => setUnread(0);

  const value: NotificationsContextValue = {
    enabled,
    permission,
    token,
    unread,
    notifications,
    requestPermission,
    markAllRead,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
