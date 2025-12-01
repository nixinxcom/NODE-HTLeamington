// app/lib/notifications/config.ts
import type iSettings from "@/app/lib/settings/interface";
import { hasFaculty } from "@/app/lib/faculties";

/**
 * Devuelve true si el tenant tiene habilitadas las notificaciones
 * en settings.faculties.notifications === true.
 */
export function hasNotificationsFaculty(
  settings: iSettings | null | undefined,
): boolean {
  return hasFaculty(settings, "notifications");
}
