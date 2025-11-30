"use client";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { FbDB } from "@/app/lib/services/firebase";

/**
 * Asegura que exista un doc Users/<uid> con info básica del usuario.
 * Llamar esto cada vez que haya login / ensureAnon.
 */
export async function ensureUserIndexed(u: User | null) {
  if (!u || !FbDB) return;

  const ref = doc(FbDB, "Users", u.uid);

  await setDoc(
    ref,
    {
      uid: u.uid,
      email: u.email ?? null,
      displayName: u.displayName ?? null,
      lastSeenAt: serverTimestamp(),
      // createdAt sólo se setea la primera vez gracias a merge
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
