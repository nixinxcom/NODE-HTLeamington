// app/api/cct/verify/route.ts
export const runtime = "nodejs";

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { verifyCctToken } from "@/app/lib/cct/token";

type Body = {
  token?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    const token =
      (req.headers.get("x-nixinx-cct") || "").trim() ||
      (body.token || "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
    }

    const res = verifyCctToken(token);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: res.error },
        { status: res.error === "expired" ? 401 : 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      payload: res.payload,
    });
  } catch (err) {
    console.error("[cct/verify] error", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
