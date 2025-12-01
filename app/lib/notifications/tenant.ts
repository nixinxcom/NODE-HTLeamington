// app/lib/notifications/tenant.ts
import type { NextRequest } from "next/server";

/**
 * Resuelve el tenantId a partir del request.
 *
 * Hoy:
 *  - Primero intenta header "x-tenant-id".
 *  - Si no, intenta query ?tenantId=...
 *  - Si no, usa "__default__".
 *
 * Si mañana tienes multi-tenant real con subdominios,
 * aquí es donde harás el parse del host.
 */
export function getTenantIdFromRequest(req: NextRequest): string {
  const header = req.headers.get("x-tenant-id")?.trim();
  if (header) return header;

  const url = new URL(req.url);
  const qsTenant = url.searchParams.get("tenantId")?.trim();
  if (qsTenant) return qsTenant;

  return "__default__";
}
