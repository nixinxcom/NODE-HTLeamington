// app/api/push/subscribe/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebaseAdmin";
import type iSettings from "@/app/lib/settings/interface";
import { hasNotificationsFaculty } from "@/app/lib/notifications/config";
import { getTenantIdFromRequest } from "@/app/lib/notifications/tenant";

type Body = {
  token?: string;
  platform?: "web" | "ios" | "android";
};

/* ─────────────────────────────────────────────────────────
   Cache de Settings desde FDV (Providers/Settings)
   ───────────────────────────────────────────────────────── */

const SETTINGS_TTL_MS = 60_000; // 1 minuto; ajusta si quieres

let cachedSettings: iSettings | undefined;
let cachedSettingsAt = 0;

async function getSettingsCached(): Promise<iSettings | undefined> {
  const now = Date.now();
  if (cachedSettings && now - cachedSettingsAt < SETTINGS_TTL_MS) {
    return cachedSettings;
  }

  const db = getAdminDb();
  const snap = await db.collection("Providers").doc("Settings").get();

  cachedSettings = snap.exists ? (snap.data() as iSettings) : undefined;
  cachedSettingsAt = now;

  return cachedSettings;
}

/* ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const token = (body.token || "").trim();
    const platform = body.platform || "web";

    if (!token) {
      return NextResponse.json({ error: "missing_token" }, { status: 400 });
    }

    // Settings desde FDV + cache
    const settings = await getSettingsCached();

    if (!hasNotificationsFaculty(settings)) {
      return NextResponse.json(
        { error: "notifications_disabled" },
        { status: 403 },
      );
    }

    const tenantId = getTenantIdFromRequest(req);
    const db = getAdminDb();
    const now = new Date();

    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("notificationTokens")
      .doc(token) // puedes cambiar a hash(token) luego si quieres
      .set(
        {
          token,
          platform,
          active: true,
          updatedAt: now,
          createdAt: now,
        },
        { merge: true },
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe] error", err);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
