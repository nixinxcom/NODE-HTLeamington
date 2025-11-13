/*---------------------------------------------------------
 * File: functionalities/CommonFunctions/CreateIDFunc.ts
 *
 * QUÉ HACE:
 *  - CreateIDFunc:
 *      Genera IDs tipo prefix_timestamp_random.
 *
 *  - generateClientID / decodeClientID:
 *      Generan y revierten un ClientID basado en una clave
 *      de cliente textual (3–7 chars 0-9/A-Z), con patrón:
 *
 *        KEY-ACCOUNT14-TOKEN
 *
 *      Ejemplo:
 *        "EPBG" →
 *        key      = "EPBG"
 *        account  = "00000014251116"
 *        token    = "6UMU7G"
 *        id       = "EPBG-00000014251116-6UMU7G"
 *
 * Import típico:
 *   import CreateIDFunc, {
 *     ICreateIDs,
 *     IClientID,
 *     generateClientID,
 *     decodeClientID,
 *   } from '@/functionalities/CommonFunctions/CreateIDFunc';
 *
 * NOTAS:
 *  - Evitar meter PII en IDs / tokens.
 *  - ClientID es reversible solo con el token.
 *---------------------------------------------------------*/

/* ─────────────────────────────────────────────────────────
 * ID GENÉRICO: prefix_timestamp_random
 *─────────────────────────────────────────────────────────*/

export interface ICreateIDs {
  InitialLetters?: string;
  EncryptionLevel?: number; // Between 2 and 36 (radix)
  Complexity?: number;      // Random upper bound (>1)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function sanitizePrefix(s?: string) {
  if (!s) return "_";
  // permite letras/números/guiones/underscore; evita espacios y raros
  return s.toString().trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

/**
 * ID genérico: prefix_timestamp_random (base radix)
 *
 * Ejemplo:
 *   const id = CreateIDFunc({
 *     InitialLetters: "usr",
 *     EncryptionLevel: 36,
 *     Complexity: 1_000_000,
 *   });
 *   // "usr_lrb3h7pc4l0_1k"
 */
export default function CreateIDFunc(props: ICreateIDs = {}): string {
  const prefix = sanitizePrefix(props.InitialLetters);
  const radix = clamp(
    Math.floor(Math.abs(props.EncryptionLevel ?? 36) || 36),
    2,
    36
  );

  // tiempo: ms + high-res si existe para reducir colisiones
  const ts = Date.now().toString(radix);
  const hires =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? Math.floor(performance.now() * 1000).toString(radix)
      : "";

  // random con crypto si hay; fallback a Math.random
  const upper = Math.max(2, Math.floor(Math.abs(props.Complexity ?? 0) || 0));
  let randNum: number;
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    randNum = buf[0] % upper;
  } else {
    randNum = Math.floor(Math.random() * upper);
  }
  const rand = randNum.toString(radix);

  return `${prefix}_${ts}${hires ? hires : ""}_${rand}`;
}

/* ─────────────────────────────────────────────────────────
 * CLIENT ID REVERSIBLE
 *
 * Esquema:
 *   clientKey: string 3..7 chars [0-9A-Za-z]
 *
 *   1) Normaliza a MAYÚSCULAS.
 *   2) Cada carácter → valor 0..35:
 *        - '0'..'9' → 0..9  → "00".."09"
 *        - 'A'..'Z' → 10..35 → "10".."35"
 *      Se concatena a "codes" (2 dígitos por char).
 *
 *   3) account14 = codes.padStart(14, "0").
 *
 *   4) encodedDecimal = [N][codes]
 *      donde N = length(clientKey) (3..7).
 *
 *   5) token = base36(encodedDecimal).toUpperCase().
 *
 *   6) ClientID textual:
 *        id = `${key}-${account14}-${token}`
 *
 * Reversión SOLO con el token:
 *   - token → base36 → decimal → string dec.
 *   - N = dec[0] (longitud original del clientKey).
 *   - codes = dec.slice(1) (2*N dígitos).
 *   - codes → pares "00".."35" → valores 0..35 → chars 0-9/A-Z.
 *   - account14 = codes.padStart(14, "0").
 *─────────────────────────────────────────────────────────*/

export interface IClientID {
  key: string;      // Clave de cliente normalizada (MAYÚSCULAS)
  account: string;  // Cuenta derivada (14 dígitos)
  token: string;    // Token base36 reversible
  id: string;       // "key-account-token"
}

const CODE_0 = "0".charCodeAt(0); // 48
const CODE_A = "A".charCodeAt(0); // 65

/**
 * Normaliza y valida la clave de cliente:
 * - Mayúsculas
 * - Longitud 3..7
 * - Solo [0-9A-Z]
 */
function normalizeClientKey(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (!/^[0-9A-Z]{3,7}$/.test(upper)) {
    throw new Error("clientKey debe tener entre 3 y 7 caracteres 0-9/A-Z");
  }
  return upper;
}

function charToVal(ch: string): number {
  const code = ch.charCodeAt(0);
  if (ch >= "0" && ch <= "9") {
    return code - CODE_0; // 0..9
  }
  if (ch >= "A" && ch <= "Z") {
    return code - CODE_A + 10; // 10..35
  }
  throw new Error(`Carácter inválido en clientKey: '${ch}'`);
}

function valToChar(val: number): string {
  if (val >= 0 && val <= 9) {
    return String.fromCharCode(CODE_0 + val);
  }
  if (val >= 10 && val <= 35) {
    return String.fromCharCode(CODE_A + (val - 10));
  }
  throw new Error(`Valor inválido en decodificación: ${val}`);
}

/**
 * Convierte la key ("EPBG") a dígitos:
 *   EPBG → [14,25,11,16] → "14251116"
 */
function keyToDigitCodes(clientKey: string): string {
  let out = "";
  for (const ch of clientKey) {
    const val = charToVal(ch);
    out += val.toString().padStart(2, "0"); // "00".."35"
  }
  return out; // longitud = 2 * length(clientKey)
}

/**
 * Genera un ClientID reversible a partir de la clave textual.
 *
 * Ejemplo:
 *   const CID = generateClientID("EPBG");
 *
 *   CID.key     = "EPBG"
 *   CID.account = "00000014251116"
 *   CID.token   = "6UMU7G"
 *   CID.id      = "EPBG-00000014251116-6UMU7G"
 */
export function generateClientID(rawClientKey: string): IClientID {
  // 1) Normalizar y validar
  const clientKey = normalizeClientKey(rawClientKey); // "EPBG"

  // 2) chars → dígitos (A=10..Z=35, 0..9=00..09)
  const codes = keyToDigitCodes(clientKey); // ej. "14251116"

  // 3) Longitud N (3..7)
  const N = clientKey.length;
  if (N < 3 || N > 7) {
    throw new Error("clientKey debe tener longitud entre 3 y 7");
  }

  // 4) Construir decimal: [N][codes]
  const encodedDecimal = `${N}${codes}`; // ej. "414251116" para "EPBG"

  const num = Number(encodedDecimal);
  if (
    !Number.isFinite(num) ||
    !Number.isInteger(num) ||
    !Number.isSafeInteger(num)
  ) {
    throw new Error("Valor decimal fuera de rango para Number");
  }

  // 5) base36 como token
  const token = num.toString(36).toUpperCase(); // ej. "6UMU7G"

  // 6) Cuenta de 14 dígitos (derivada de codes)
  const account14 = codes.padStart(14, "0"); // ej. "00000014251116"

  const id = `${clientKey}-${account14}-${token}`;

  return {
    key: clientKey,
    account: account14,
    token,
    id,
  };
}

/**
 * Revierte un token generado por generateClientID y devuelve
 * el mismo esquema IClientID.
 *
 * Ejemplo:
 *   const CID = decodeClientID("6UMU7G");
 *   // CID.id      = "EPBG-00000014251116-6UMU7G"
 *   // CID.key     = "EPBG"
 *   // CID.account = "00000014251116"
 *   // CID.token   = "6UMU7G"
 */
export function decodeClientID(token: string): IClientID {
  if (!token || typeof token !== "string") {
    throw new Error("Token inválido");
  }

  const num = parseInt(token.toLowerCase(), 36);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    throw new Error("Token no se puede interpretar en base 36");
  }

  const dec = num.toString(10); // ej. "414251116"

  if (dec.length < 1) {
    throw new Error("Token decodificado vacío");
  }

  // 1er dígito = N (longitud original del clientKey: 3..7)
  const firstChar = dec[0];
  const N = parseInt(firstChar, 10);
  if (!Number.isFinite(N) || N < 3 || N > 7) {
    throw new Error("Longitud de clientKey inválida en token");
  }

  const codes = dec.slice(1); // resto, ej. "14251116"
  if (codes.length !== 2 * N) {
    throw new Error("Longitud de códigos inconsistente con N");
  }

  // Reconstruir clientKey a partir de pares 00..35
  let clientKey = "";
  for (let i = 0; i < codes.length; i += 2) {
    const pair = codes.slice(i, i + 2);
    const val = parseInt(pair, 10);
    if (Number.isNaN(val) || val < 0 || val > 35) {
      throw new Error(`Par de dígitos inválido en token: '${pair}'`);
    }
    clientKey += valToChar(val);
  }

  const account14 = codes.padStart(14, "0");
  const normalizedToken = token.toUpperCase();
  const id = `${clientKey}-${account14}-${normalizedToken}`;

  return {
    key: clientKey,
    account: account14,
    token: normalizedToken,
    id,
  };
}

/* ─────────────────────────────────────────────────────────
 * DOC RESUMIDO:
 *
 *  ► ID genérico
 *    - default export CreateIDFunc(props?: ICreateIDs): string
 *      Ej:
 *        const id = CreateIDFunc({
 *          InitialLetters: "usr",
 *          EncryptionLevel: 36,
 *          Complexity: 1_000_000,
 *        });
 *
 *  ► ClientID reversible (KEY-ACCOUNT-TOKEN)
 *    - generateClientID(rawClientKey: string): IClientID
 *    - decodeClientID(token: string): IClientID
 *
 *    Ejemplo:
 *      const CID = generateClientID("EPBG");
 *      // CID.id      = "EPBG-00000014251116-6UMU7G"
 *      // CID.key     = "EPBG"
 *      // CID.account = "00000014251116"
 *      // CID.token   = "6UMU7G"
 *
 *      const CID2 = decodeClientID(CID.token);
 *      // mismo resultado que CID
 *─────────────────────────────────────────────────────────*/
