// app/api/admin/sync-gprofile/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { syncBrandingFromGoogleProfile } from "@/app/lib/googleProfileSync";

// GET: para comprobar que la ruta existe
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/admin/sync-gprofile",
  });
}

// POST: dispara la sincronización, protegido con NEXT_PUBLIC_GBP_LOCATION_NAME
export async function POST(req: Request) {
  const headerKey = req.headers.get("x-admin-key") ?? "";

  // usamos la misma variable que usa googleProfileSync
  const bizKey = process.env.NEXT_PUBLIC_GBP_LOCATION_NAME ?? "";

  if (!bizKey) {
    console.error(
      '[sync-gprofile] Falta NEXT_PUBLIC_GBP_LOCATION_NAME (formato "locations/{location_id}")'
    );
    return new NextResponse("Misconfigured", { status: 500 });
  }

  if (headerKey !== bizKey) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    await syncBrandingFromGoogleProfile();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[sync-gprofile] error:", err);
    return new NextResponse("Error syncing", { status: 500 });
  }
}
