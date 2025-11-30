// app/lib/notifications/hooks.ts
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  type FirestoreError,
} from "firebase/firestore";

import { FbAuth, FbDB } from "@/app/lib/services/firebase";

export type UserNotificationStatus = "unread" | "read";

export type UserNotificationItem = {
  id: string; // id del doc en userNotifications/<uid>/items
  notificationId: string;
  title: string;
  message: string;
  status: UserNotificationStatus;
  createdAt: Date | null;
  category?: string | null;
  priority?: string | null;
  uiType?: string | null;
  deliveryChannel?: string | null;
  /** Si true, requiere que el usuario la marque como leída (sin solo cerrar). */
  requireReadConfirmation?: boolean | null;
};


export type UseNotificationCountResult = {
  count: number;
  loading: boolean;
  error?: string;
  user?: User | null;
};

export type UseUserNotificationsResult = {
  notifications: UserNotificationItem[];
  loading: boolean;
  error?: string;
  user?: User | null;
};

/* ─────────────────────────────────────────────────────────
   Hook: useNotificationCount
   ───────────────────────────────────────────────────────── */

export function useNotificationCount(): UseNotificationCountResult {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!FbAuth || !FbDB) {
      setLoading(false);
      setError("firebase-not-initialized");
      return;
    }

    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(FbAuth, (u) => {
      setUser(u);

      // Si cambia el usuario, limpiamos el listener previo
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }

      if (!u) {
        setCount(0);
        setLoading(false);
        return;
      }

      const baseRef = collection(FbDB, "userNotifications", u.uid, "items");
      const q = query(baseRef, where("status", "==", "unread"));

      unsubscribeNotifications = onSnapshot(
        q,
        (snap) => {
          setCount(snap.size);
          setLoading(false);
          setError(undefined);
        },
        (err: FirestoreError) => {
          console.error("[useNotificationCount] snapshot error", err);
          setError(err.message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, []);

  return { count, loading, error, user };
}

/* ─────────────────────────────────────────────────────────
   Hook: useUserNotifications
   Lista las notificaciones del usuario actual.
   onlyUnread = true → solo "unread"
   onlyUnread = false → todas (ordenadas por fecha desc en cliente)
   ───────────────────────────────────────────────────────── */

export function useUserNotifications(
  onlyUnread: boolean = true,
): UseUserNotificationsResult {
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!FbAuth || !FbDB) {
      setLoading(false);
      setError("firebase-not-initialized");
      return;
    }

    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(FbAuth, (u) => {
      setUser(u);

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }

      if (!u) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Colección base
      const baseRef = collection(FbDB, "userNotifications", u.uid, "items");

      // Si onlyUnread → query; si no, usamos la colección directa
      const qRef = onlyUnread
        ? query(baseRef, where("status", "==", "unread"))
        : baseRef;

      unsubscribeNotifications = onSnapshot(
        qRef,
        (snap) => {
          const next: UserNotificationItem[] = snap.docs.map((docSnap) => {
            const raw = docSnap.data() as any;

            let createdAt: Date | null = null;
            if (
              raw.createdAt &&
              typeof (raw.createdAt as any).toDate === "function"
            ) {
              createdAt = (raw.createdAt as any).toDate();
            }

            const status: UserNotificationStatus =
              raw.status === "read" ? "read" : "unread";

            return {
              id: docSnap.id,
              notificationId: raw.notificationId ?? "",
              title: raw.title ?? "",
              message: raw.message ?? "",
              status,
              createdAt,
              category: raw.category ?? null,
              priority: raw.priority ?? null,
              uiType: raw.uiType ?? null,
              deliveryChannel: raw.deliveryChannel ?? null,
              requireReadConfirmation: raw.requireReadConfirmation ?? null,
            };
          });

          // Ordenar por fecha desc
          next.sort((a, b) => {
            const ta = a.createdAt ? a.createdAt.getTime() : 0;
            const tb = b.createdAt ? b.createdAt.getTime() : 0;
            return tb - ta;
          });

          setNotifications(next);
          setLoading(false);
          setError(undefined);
        },
        (err: FirestoreError) => {
          console.error("[useUserNotifications] snapshot error", err);
          setError(err.message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, [onlyUnread]);

  return { notifications, loading, error, user };
}
