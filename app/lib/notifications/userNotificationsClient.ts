// app/lib/notifications/userNotificationsClient.ts
"use client";

import {
  doc,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { FbAuth, FbDB } from "@/app/lib/services/firebase";

/**
 * Marca una notificación específica como "read"
 * usando el uid del usuario autenticado.
 */
export async function markNotificationAsRead(
  docId: string,
): Promise<void> {
  if (!FbDB || !FbAuth) {
    throw new Error("firebase-not-initialized");
  }

  const user = FbAuth.currentUser;
  if (!user) {
    throw new Error("no-auth");
  }

  const ref = doc(FbDB, "userNotifications", user.uid, "items", docId);
  await updateDoc(ref, { status: "read" });
}

/**
 * Marca un conjunto de notificaciones como "read".
 * Útil para "Marcar todas como leídas".
 */
export async function markAllNotificationsAsRead(
  docIds: string[],
): Promise<void> {
  if (!FbDB || !FbAuth) {
    throw new Error("firebase-not-initialized");
  }

  const user = FbAuth.currentUser;
  if (!user) {
    throw new Error("no-auth");
  }

  if (!docIds.length) return;

  const batch = writeBatch(FbDB);

  for (const id of docIds) {
    const ref = doc(FbDB, "userNotifications", user.uid, "items", id);
    batch.update(ref, { status: "read" });
  }

  await batch.commit();
}
