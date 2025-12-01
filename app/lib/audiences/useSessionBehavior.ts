"use client";

import { useContext } from "react";
import {
  SessionBehaviorContext,
  type SessionBehaviorAPI,
} from "@/app/providers/SessionBehaviorProvider";

export function useSessionBehavior(): SessionBehaviorAPI {
  const ctx = useContext(SessionBehaviorContext);
  if (!ctx) {
    throw new Error(
      "useSessionBehavior debe usarse dentro de un <SessionBehaviorProvider>.",
    );
  }
  return ctx;
}
