// app/api/faculties/check/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";
import type iSettings from "@/app/lib/settings/interface";
import { type FacultyKey } from "@/app/lib/faculties";

/**
 * Aquí es donde, en producción real,
 * el Core va a decidir si un Nodo NX tiene permiso.
 *
 * Hoy: lee Providers/Settings (FDV) con cache en memoria.
 * Mañana: puede mirar tenantId / clientId -> Firestore / DB de NIXINX.org.
 */

/* ─────────────────────────────────────────────────────────
   Cache en memoria de Settings (FDV)
   ───────────────────────────────────────────────────────── */

const SETTINGS_TTL_MS = 60_000; // 1 minuto; ajusta a gusto

let cachedSettings: iSettings | undefined;
let cachedSettingsKey: string | null = null;
let cachedSettingsAt = 0;

async function getEffectiveSettingsForClient(
  clientId?: string | null,
): Promise<iSettings | undefined> {
  const now = Date.now();
  const key = clientId ?? "__default__";

  // Cache simple por clientId (hoy en realidad usamos uno global)
  if (
    cachedSettings &&
    cachedSettingsKey === key &&
    now - cachedSettingsAt < SETTINGS_TTL_MS
  ) {
    return cachedSettings;
  }

  const db = getAdminDb();

  // Por ahora: una sola Settings global en Providers/Settings (FDV del NX)
  // Si luego tienes settings por tenant/cliente, aquí cambias la ruta.
  const snap = await db.collection("Providers").doc("Settings").get();

  cachedSettings =
    snap.exists ? (snap.data() as iSettings) : (undefined as iSettings | undefined);
  cachedSettingsKey = key;
  cachedSettingsAt = now;

  return cachedSettings;
}

function hasFaculty(settings: iSettings | undefined, key: FacultyKey): boolean {
  return !!settings?.faculties?.[key];
}

/* ─────────────────────────────────────────────────────────
   POST: body JSON
   { clientId?: string; topics?: FacultyKey[] }
   ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      clientId?: string;     // ID del cliente/Nodo NX
      topics?: FacultyKey[]; // facultades a consultar
    };

    const clientId =
      body.clientId ||
      req.headers.get("x-nixinx-client-id") ||
      req.headers.get("x-nixinx-tenant-id") ||
      null;

    const settings = await getEffectiveSettingsForClient(clientId);

    const allKeys = Object.keys(settings?.faculties || {}) as FacultyKey[];
    const topics =
      body.topics && body.topics.length ? body.topics : allKeys;

    const faculties: Record<FacultyKey, boolean> = {} as any;
    for (const key of topics) {
      faculties[key] = hasFaculty(settings, key);
    }

    return NextResponse.json({
      ok: true,
      clientId,
      faculties,
    });
  } catch (err) {
    console.error("[faculties/check][POST] error", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}

/* ─────────────────────────────────────────────────────────
   GET: /api/faculties/check?clientId=...&keys=notifications,agentAI
   ───────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId =
      url.searchParams.get("clientId") ||
      req.headers.get("x-nixinx-client-id") ||
      req.headers.get("x-nixinx-tenant-id") ||
      null;

    const keysParam = url.searchParams.get("keys") || "";
    const keys = keysParam
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean) as FacultyKey[];

    const settings = await getEffectiveSettingsForClient(clientId);
    const allKeys = Object.keys(settings?.faculties || {}) as FacultyKey[];
    const topics = keys.length ? keys : allKeys;

    const faculties: Record<string, boolean> = {};
    for (const key of topics) {
      faculties[key] = hasFaculty(settings, key as FacultyKey);
    }

    return NextResponse.json({
      ok: true,
      clientId,
      faculties,
    });
  } catch (err) {
    console.error("[faculties/check][GET] error", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
