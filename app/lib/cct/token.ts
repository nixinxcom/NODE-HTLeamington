// app/lib/cct/token.ts
import "server-only";
import crypto from "crypto";

export type CctPayloadV1 = {
  v: 1;
  cid: string;       // tenant/client id
  caps: string[];    // capabilities habilitadas
  iat: number;       // unix seconds
  exp: number;       // unix seconds
  rev: number;       // state revision

  // opcional: ciclo de billing (solo-fechas, NO dinero)
  ps?: number;       // periodStart unix seconds
  pe?: number;       // periodEnd unix seconds
};

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecodeToBuffer(s: string): Buffer {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(base64, "base64");
}

function asSafeInt(v: any): number | null {
  if (typeof v !== "number") return null;
  if (!Number.isFinite(v)) return null;
  const n = Math.trunc(v);
  if (n < 0) return null;
  return n;
}

function getSecret(): string {
  const s = process.env.NIXINX_CCT_SECRET;
  if (!s) throw new Error("Missing env NIXINX_CCT_SECRET");
  return s;
}

export function issueCctToken(args: {
  clientId: string;
  caps: string[];
  ttlSec: number;
  rev: number;

  // opcional: fechas del ciclo
  periodStartSec?: number | null;
  periodEndSec?: number | null;

  // opcional: para tokens deterministas por “bucket”
  nowSec?: number;
}): string {
  const nowSec = typeof args.nowSec === "number" ? Math.trunc(args.nowSec) : Math.floor(Date.now() / 1000);
  const ttlSec = Math.max(1, Math.trunc(args.ttlSec));
  const exp = nowSec + ttlSec;

  const payload: CctPayloadV1 = {
    v: 1,
    cid: args.clientId,
    caps: Array.isArray(args.caps) ? args.caps : [],
    iat: nowSec,
    exp,
    rev: Math.trunc(args.rev || 0),
  };

  const ps = asSafeInt(args.periodStartSec);
  const pe = asSafeInt(args.periodEndSec);
  if (ps !== null) payload.ps = ps;
  if (pe !== null) payload.pe = pe;

  const header = { alg: "HS256", typ: "CCT", v: 1 };
  const headerB64 = b64urlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload)));

  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(data).digest();
  const sigB64 = b64urlEncode(sig);

  return `${data}.${sigB64}`;
}

export function verifyCctToken(token: string): { ok: true; payload: CctPayloadV1 } | { ok: false; error: string } {
  try {
    if (!token || typeof token !== "string") return { ok: false, error: "missing_token" };

    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false, error: "bad_format" };

    const [hB64, pB64, sigB64] = parts;
    const data = `${hB64}.${pB64}`;

    const expected = crypto.createHmac("sha256", getSecret()).update(data).digest();
    const got = b64urlDecodeToBuffer(sigB64);

    // timing safe
    if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) {
      return { ok: false, error: "bad_signature" };
    }

    const payloadRaw = JSON.parse(b64urlDecodeToBuffer(pB64).toString("utf8")) as any;

    if (payloadRaw?.v !== 1) return { ok: false, error: "bad_version" };
    if (typeof payloadRaw?.cid !== "string" || !payloadRaw.cid.trim()) return { ok: false, error: "bad_cid" };
    if (!Array.isArray(payloadRaw?.caps)) return { ok: false, error: "bad_caps" };

    const iat = asSafeInt(payloadRaw?.iat);
    const exp = asSafeInt(payloadRaw?.exp);
    const rev = asSafeInt(payloadRaw?.rev);

    if (iat === null || exp === null || rev === null) return { ok: false, error: "bad_times" };
    if (exp <= iat) return { ok: false, error: "bad_exp" };

    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec >= exp) return { ok: false, error: "expired" };

    const ps = asSafeInt(payloadRaw?.ps);
    const pe = asSafeInt(payloadRaw?.pe);

    const payload: CctPayloadV1 = {
      v: 1,
      cid: payloadRaw.cid,
      caps: payloadRaw.caps.filter((x: any) => typeof x === "string" && x.trim()).map((s: string) => s.trim()),
      iat,
      exp,
      rev,
    };

    if (ps !== null) payload.ps = ps;
    if (pe !== null) payload.pe = pe;

    return { ok: true, payload };
  } catch {
    return { ok: false, error: "bad_payload" };
  }
}
