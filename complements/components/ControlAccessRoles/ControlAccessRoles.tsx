// app/[locale]/(private)/CAR/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminGuard from "@/complements/admin/AdminGuard";
import FM from "@/complements/i18n/FM";
import {
  BUTTON,
  H1,
  H2,
  P,
  LABEL,
  INPUT,
  SELECT,
  DIV,
  SPAN,
} from "@/complements/components/ui/wrappers";

import {
  CCT_CAPS_CATALOG,
  CCT_CAPS,
  type CctCap,
} from "@/app/lib/cct/caps.catalog";

import { FbDB } from "@/app/lib/services/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

/** =========================
 *  Firestore paths (Nodo)
 *  ========================= */
const ROLES_COL = ["Providers", "CAR", "Roles"] as const;
const USERS_COL = ["Providers", "CAR", "Users"] as const;

/** =========================
 *  Types
 *  ========================= */
type BuiltInRoleId = "admin" | "team";
type RoleId = BuiltInRoleId | string;

type RoleDoc = {
  roleId: RoleId;
  name: string;
  // solo guardamos caps editables para roles NO-admin
  caps: Partial<Record<CctCap, boolean>>;
  builtIn?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

type UserDoc = {
  userId: string; // docId
  name: string;
  email: string;
  emailLower: string;
  phone?: string | null;
  roleId: RoleId;
  pinHash: string; // hex
  pinSalt: string; // hex
  createdAt?: any;
  updatedAt?: any;
};

/** =========================
 *  Helpers
 *  ========================= */
function normalizeRoleId(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 40);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin.trim());
}

function hexFromBytes(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < u8.length; i++) out += u8[i].toString(16).padStart(2, "0");
  return out;
}

function bytesFromText(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

// Convierte Uint8Array -> ArrayBuffer exacto (sin pelear con ArrayBufferLike/SharedArrayBuffer)
function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const b = bytes.buffer;

  // Caso normal: ArrayBuffer
  if (b instanceof ArrayBuffer) {
    return b.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  // Caso “por tipos” (SharedArrayBuffer): copiamos
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = bytesFromText(input);
  const digest = await crypto.subtle.digest("SHA-256", toExactArrayBuffer(bytes));
  return hexFromBytes(digest);
}

function randomHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);

  let out = "";
  for (let i = 0; i < arr.length; i++) out += arr[i].toString(16).padStart(2, "0");
  return out;
}

/**
 * Intenta extraer caps permitidas desde un token tipo JWT.
 * Soporta payloads comunes:
 * - { caps: string[] }
 * - { entitlements: {cap:{status:"active"}} }
 * - { entitlementsSnapshot: {cap:{status:"active"}} }
 */
function capsFromToken(token: string): CctCap[] {
  const t = (token || "").trim();
  if (!t.includes(".")) return [];

  try {
    const payloadB64 = t.split(".")[1] ?? "";
    const json = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));

    const fromCapsArr = Array.isArray(json?.caps) ? json.caps : null;
    if (fromCapsArr?.length) {
      const allowed = new Set(CCT_CAPS);
      return Array.from(new Set(fromCapsArr.filter((x: any) => allowed.has(x)) as CctCap[]));
    }

    const ent = json?.entitlements ?? json?.entitlementsSnapshot ?? null;
    if (ent && typeof ent === "object") {
      const allowed = new Set<CctCap>();
      for (const k of Object.keys(ent)) {
        const cap = k as CctCap;
        if (!CCT_CAPS.includes(cap)) continue;
        const st = ent[k]?.status ?? ent[k]?.state ?? null;
        if (st === "active" || st === true) allowed.add(cap);
      }
      return Array.from(allowed);
    }

    return [];
  } catch {
    return [];
  }
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/** =========================
 *  Page
 *  ========================= */
type Tab = "roles" | "users";

export default function ControlAccessRoles() {
  const { locale } = useParams<{ locale: string }>();

  const [tab, setTab] = useState<Tab>("roles");

  /** ===== Allowed caps (CCT) ===== */
  const [tokenInput, setTokenInput] = useState("");
  const [tokenStored, setTokenStored] = useState<string>("");

  useEffect(() => {
    const t = localStorage.getItem("cct_token") || "";
    setTokenStored(t);
    setTokenInput(t);
  }, []);

  const allowedCaps = useMemo(() => {
    const t = tokenStored || "";
    return capsFromToken(t);
  }, [tokenStored]);

  const allowedSet = useMemo(() => new Set<CctCap>(allowedCaps), [allowedCaps]);

  function saveTokenToLocal() {
    const t = tokenInput.trim();
    localStorage.setItem("cct_token", t);
    setTokenStored(t);
  }

  function clearTokenLocal() {
    localStorage.removeItem("cct_token");
    setTokenStored("");
    setTokenInput("");
  }

  /** ===== Roles (FS) ===== */
  const [roles, setRoles] = useState<RoleDoc[]>([]);
  const [roleIdSel, setRoleIdSel] = useState<RoleId>("team");
  const [roleNameEdit, setRoleNameEdit] = useState<string>("Team");
  const [roleCapsEdit, setRoleCapsEdit] = useState<Partial<Record<CctCap, boolean>>>({});
  const [status, setStatus] = useState<string>("");

  // Create role
  const [newRoleName, setNewRoleName] = useState<string>("");
  const [newRoleId, setNewRoleId] = useState<string>("");

  useEffect(() => {
    const colRef = collection(FbDB, ...ROLES_COL);
    const unsub = onSnapshot(colRef, (snap) => {
      const list: RoleDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          roleId: (data.roleId || d.id) as RoleId,
          name: String(data.name || d.id),
          caps: (data.caps || {}) as any,
          builtIn: !!data.builtIn,
        });
      });

      // Orden: team primero, luego alfabético
      list.sort((a, b) => {
        if (a.roleId === "team") return -1;
        if (b.roleId === "team") return 1;
        return String(a.name).localeCompare(String(b.name));
      });

      setRoles(list);
    });

    return () => unsub();
  }, []);

  // asegurar role "team" existe
  useEffect(() => {
    const hasTeam = roles.some((r) => r.roleId === "team");
    if (hasTeam) return;

    (async () => {
      try {
        const ref = doc(FbDB, ...ROLES_COL, "team");
        await setDoc(
          ref,
          {
            roleId: "team",
            name: "Team",
            caps: {},
            builtIn: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // ignore
      }
    })();
  }, [roles]);

  // cargar editor cuando cambia selección
  useEffect(() => {
    if (roleIdSel === "admin") {
      setRoleNameEdit("Admin");
      setRoleCapsEdit({});
      return;
    }

    const r = roles.find((x) => x.roleId === roleIdSel);
    setRoleNameEdit(r?.name || String(roleIdSel));
    setRoleCapsEdit({ ...(r?.caps || {}) });
  }, [roleIdSel, roles]);

  const roleOptions = useMemo(() => {
    // admin no vive en FS; es derivado
    const custom = roles
      .filter((r) => r.roleId !== "admin")
      .map((r) => ({ value: r.roleId, label: r.name }));
    return [{ value: "admin", label: "Admin (derivado por CCT)" }, ...custom];
  }, [roles]);

  async function saveRole() {
    try {
      setStatus("Guardando rol...");

      if (roleIdSel === "admin") {
        setStatus("✅ Admin es derivado. No se guarda: siempre = caps permitidas por CCT.");
        return;
      }

      const rid = String(roleIdSel).trim();
      if (!rid) {
        setStatus("⛔ roleId inválido.");
        return;
      }

      // Solo guardamos caps que estén permitidas por CCT; lo demás se ignora.
      const capsToSave: Partial<Record<CctCap, boolean>> = {};
      for (const cap of CCT_CAPS) {
        if (!allowedSet.has(cap)) continue;
        if (roleCapsEdit[cap]) capsToSave[cap] = true;
      }

      const ref = doc(FbDB, ...ROLES_COL, rid);
      await setDoc(
        ref,
        {
          roleId: rid,
          name: roleNameEdit?.trim() || rid,
          caps: capsToSave,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setStatus("✅ Rol guardado.");
    } catch (e: any) {
      setStatus(`⛔ Error: ${e?.message || String(e)}`);
    }
  }

  async function createRole() {
    try {
      setStatus("Creando rol...");

      const rid = normalizeRoleId(newRoleId || newRoleName);
      const name = newRoleName.trim();

      if (!rid) return setStatus("⛔ Define roleId o name.");
      if (!name) return setStatus("⛔ Falta name.");

      if (rid === "admin" || rid === "team") {
        return setStatus("⛔ roleId reservado (admin/team).");
      }

      const ref = doc(FbDB, ...ROLES_COL, rid);
      await setDoc(
        ref,
        {
          roleId: rid,
          name,
          caps: {}, // por default vacío
          builtIn: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: false }
      );

      setNewRoleId("");
      setNewRoleName("");
      setRoleIdSel(rid);
      setStatus("✅ Rol creado (sin caps por default).");
    } catch (e: any) {
      setStatus(`⛔ Error: ${e?.message || String(e)}`);
    }
  }

  async function deleteRole(roleId: string) {
    try {
      if (roleId === "team" || roleId === "admin") return;
      setStatus("Eliminando rol...");
      await deleteDoc(doc(FbDB, ...ROLES_COL, roleId));
      if (roleIdSel === roleId) setRoleIdSel("team");
      setStatus("✅ Rol eliminado.");
    } catch (e: any) {
      setStatus(`⛔ Error: ${e?.message || String(e)}`);
    }
  }

  /** ===== Users (FS) ===== */
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [userSel, setUserSel] = useState<string>("");

  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPhone, setUPhone] = useState("");
  const [uRoleId, setURoleId] = useState<RoleId>("team");
  const [uPin, setUPin] = useState("");

  useEffect(() => {
    const colRef = collection(FbDB, ...USERS_COL);
    const unsub = onSnapshot(colRef, (snap) => {
      const list: UserDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          userId: d.id,
          name: String(data.name || ""),
          email: String(data.email || ""),
          emailLower: String(data.emailLower || "").toLowerCase(),
          phone: data.phone ?? null,
          roleId: (data.roleId || "team") as RoleId,
          pinHash: String(data.pinHash || ""),
          pinSalt: String(data.pinSalt || ""),
        });
      });
      list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
      setUsers(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userSel) return;

    const u = users.find((x) => x.userId === userSel);
    if (!u) return;

    setUName(u.name || "");
    setUEmail(u.email || "");
    setUPhone(u.phone || "");
    setURoleId(u.roleId || "team");
    setUPin(""); // no mostramos pin
  }, [userSel, users]);

  async function upsertUser() {
    try {
      setStatus("Guardando usuario...");

      const name = uName.trim();
      const email = uEmail.trim();
      const emailLower = email.toLowerCase();
      const phone = uPhone.trim() || null;
      const roleId = (uRoleId || "team") as RoleId;

      if (!name) return setStatus("⛔ Falta name.");
      if (!isValidEmail(email)) return setStatus("⛔ Email inválido.");

      // Crear/Actualizar:
      // - si estás editando existente: pin es opcional (si viene vacío, no se cambia)
      // - si es nuevo: pin obligatorio
      const isEditing = !!userSel;
      if (!isEditing && !isValidPin(uPin)) return setStatus("⛔ PIN debe ser 4 dígitos.");
      if (uPin && !isValidPin(uPin)) return setStatus("⛔ PIN debe ser 4 dígitos.");

      const docId = userSel || emailLower; // estable y simple
      const ref = doc(FbDB, ...USERS_COL, docId);

      let pinSalt = "";
      let pinHash = "";

      if (uPin) {
        pinSalt = randomHex(16);
        pinHash = await sha256Hex(`${pinSalt}:${uPin}`);
      }

      const payload: any = {
        userId: docId,
        name,
        email,
        emailLower,
        phone,
        roleId,
        updatedAt: serverTimestamp(),
      };

      if (!isEditing) payload.createdAt = serverTimestamp();
      if (uPin) {
        payload.pinSalt = pinSalt;
        payload.pinHash = pinHash;
      }

      await setDoc(ref, payload, { merge: true });

      setStatus("✅ Usuario guardado.");
      setUserSel(docId);
      setUPin("");
    } catch (e: any) {
      setStatus(`⛔ Error: ${e?.message || String(e)}`);
    }
  }

  async function deleteUser(userId: string) {
    try {
      setStatus("Eliminando usuario...");
      await deleteDoc(doc(FbDB, ...USERS_COL, userId));
      if (userSel === userId) {
        setUserSel("");
        setUName("");
        setUEmail("");
        setUPhone("");
        setURoleId("team");
        setUPin("");
      }
      setStatus("✅ Usuario eliminado.");
    } catch (e: any) {
      setStatus(`⛔ Error: ${e?.message || String(e)}`);
    }
  }

  /** ===== Role caps grid rows ===== */
  const capsRows = useMemo(() => {
    return CCT_CAPS_CATALOG.map((c) => {
      const cap = c.key as CctCap;
      const allowed = allowedSet.has(cap);
      const checked =
        roleIdSel === "admin"
          ? allowed // admin = todo lo permitido
          : !!roleCapsEdit[cap];

      const disabled =
        roleIdSel === "admin" ? true : !allowed || false;

      return {
        cap,
        label: c.labelKey,
        allowed,
        checked,
        disabled,
      };
    });
  }, [allowedSet, roleIdSel, roleCapsEdit]);

  return (
    <AdminGuard agentId="default" showUserChip>
      <DIV className="p-6 max-w-6xl mx-auto">
        <H1 className="text-2xl font-semibold tracking-tight">
          <FM id="car.title" defaultMessage="CAR — Control de Acceso por Roles (Nodo)" />
        </H1>

        <P className="mt-2 text-sm text-white/60">
          CCT (CoreCapsTkns) define qué caps existen para el cliente. CAR define qué caps se asignan a cada rol interno.
        </P>

        {/* Tabs */}
        <DIV className="mt-6 flex items-center gap-2 flex-wrap">
          <BUTTON variant={tab === "roles" ? "default" : "ghost"} onClick={() => setTab("roles")}>
            Roles & Caps
          </BUTTON>
          <BUTTON variant={tab === "users" ? "default" : "ghost"} onClick={() => setTab("users")}>
            Usuarios
          </BUTTON>
          <SPAN className="text-xs text-white/40 ml-2">
            Ruta: /{locale}/(private)/CAR
          </SPAN>
        </DIV>

        {/* Token input (para “entendido básico” sin engancharte a providers todavía) */}
        <DIV className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
          <H2 className="text-lg font-semibold">CCT Token (para detectar caps permitidas)</H2>
          <P className="mt-1 text-xs text-white/50">
            Se lee de <SPAN className="font-mono">localStorage.cct_token</SPAN>. Pega aquí para pruebas rápidas.
          </P>

          <DIV className="mt-3 grid gap-3 md:grid-cols-3 items-end">
            <DIV className="grid gap-2 md:col-span-2">
              <LABEL>token</LABEL>
              <INPUT
                value={tokenInput}
                onChange={(e: any) => setTokenInput(e.target.value)}
                placeholder="(pega aquí tu JWT / token CCT)"
                className="w-full font-mono text-xs"
              />
              <P className="text-xs text-white/50">
                Caps permitidas detectadas:{" "}
                <SPAN className="font-mono">{allowedCaps.length}</SPAN> /{" "}
                <SPAN className="font-mono">{CCT_CAPS.length}</SPAN>
              </P>
            </DIV>

            <DIV className="flex gap-2">
              <BUTTON onClick={saveTokenToLocal}>Guardar token</BUTTON>
              <BUTTON variant="ghost" onClick={clearTokenLocal}>Limpiar</BUTTON>
            </DIV>
          </DIV>
        </DIV>

        {tab === "roles" ? (
          <>
            {/* Roles */}
            <DIV className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-5">
              <H2 className="text-lg font-semibold">Roles</H2>

              <DIV className="grid gap-3 md:grid-cols-3">
                <DIV className="grid gap-2">
                  <LABEL>Seleccionar rol</LABEL>
                  <SELECT
                    value={String(roleIdSel)}
                    onChange={(e: any) => setRoleIdSel(e.target.value)}
                    className="w-full"
                  >
                    {roleOptions.map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </SELECT>
                  <P className="text-xs text-white/50">
                    Admin es derivado: siempre tiene todas las caps permitidas por CCT.
                  </P>
                </DIV>

                <DIV className="grid gap-2">
                  <LABEL>Nombre del rol</LABEL>
                  <INPUT
                    value={roleNameEdit}
                    onChange={(e: any) => setRoleNameEdit(e.target.value)}
                    disabled={roleIdSel === "admin"}
                    className="w-full"
                  />
                </DIV>

                <DIV className="flex items-end gap-2">
                  <BUTTON onClick={saveRole}>Guardar rol</BUTTON>
                  {roleIdSel !== "admin" && roleIdSel !== "team" && (
                    <BUTTON variant="ghost" onClick={() => deleteRole(String(roleIdSel))}>
                      Eliminar rol
                    </BUTTON>
                  )}
                </DIV>
              </DIV>
            </DIV>

            {/* Caps matrix */}
            <DIV className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
              <H2 className="text-lg font-semibold">Caps por rol</H2>

              <P className="mt-2 text-xs text-white/50">
                - Si una cap NO está permitida por CCT, queda bloqueada aquí. <br />
                - Team y roles nuevos nacen sin caps activas.
              </P>

              <DIV className="mt-4 overflow-auto">
                <DIV className="min-w-[860px]">
                  <DIV
                    className="grid text-xs text-white/60 font-semibold"
                    style={{ gridTemplateColumns: "360px 180px 1fr" }}
                  >
                    <DIV className="p-3">Capacidad</DIV>
                    <DIV className="p-3">CCT permite</DIV>
                    <DIV className="p-3">Rol: {String(roleIdSel)}</DIV>
                  </DIV>

                  {capsRows.map((r) => (
                    <DIV
                      key={r.cap}
                      className="grid border-t border-white/10"
                      style={{ gridTemplateColumns: "360px 180px 1fr" }}
                    >
                      <DIV className="p-3 flex items-center gap-2">
                        <SPAN className="font-medium">{r.label}</SPAN>
                        <SPAN className="text-xs text-white/40 font-mono">{r.cap}</SPAN>
                      </DIV>

                      <DIV className="p-3">
                        {r.allowed ? (
                          <SPAN className="text-emerald-300">✅ allowed</SPAN>
                        ) : (
                          <SPAN className="text-rose-300">⛔ locked</SPAN>
                        )}
                      </DIV>

                      <DIV className="p-3 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={r.checked}
                          disabled={r.disabled}
                          onChange={(e) => {
                            const v = e.target.checked;

                            // admin derivado: no permite editar
                            if (roleIdSel === "admin") return;

                            // si CCT no permite, no editas
                            if (!allowedSet.has(r.cap)) return;

                            setRoleCapsEdit((prev) => ({
                              ...prev,
                              [r.cap]: v,
                            }));
                          }}
                        />

                        {r.disabled && roleIdSel !== "admin" && (
                          <SPAN className="text-xs text-white/40">
                            (requiere CCT)
                          </SPAN>
                        )}

                        {roleIdSel === "admin" && (
                          <SPAN className="text-xs text-white/40">
                            (admin = todo lo permitido)
                          </SPAN>
                        )}
                      </DIV>
                    </DIV>
                  ))}
                </DIV>
              </DIV>
            </DIV>

            {/* Create role */}
            <DIV className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
              <H2 className="text-lg font-semibold">Crear nuevo rol</H2>

              <DIV className="mt-3 grid gap-3 md:grid-cols-3 items-end">
                <DIV className="grid gap-2">
                  <LABEL>Nombre</LABEL>
                  <INPUT
                    value={newRoleName}
                    onChange={(e: any) => {
                      setNewRoleName(e.target.value);
                      if (!newRoleId) setNewRoleId(normalizeRoleId(e.target.value));
                    }}
                    placeholder="Ej: Manager"
                    className="w-full"
                  />
                </DIV>

                <DIV className="grid gap-2">
                  <LABEL>roleId</LABEL>
                  <INPUT
                    value={newRoleId}
                    onChange={(e: any) => setNewRoleId(e.target.value)}
                    placeholder="ej: manager"
                    className="w-full font-mono"
                  />
                  <P className="text-xs text-white/50">
                    Por default inicia sin caps activas.
                  </P>
                </DIV>

                <DIV className="flex gap-2">
                  <BUTTON onClick={createRole}>Crear</BUTTON>
                  <BUTTON
                    variant="ghost"
                    onClick={() => {
                      setNewRoleName("");
                      setNewRoleId("");
                    }}
                  >
                    Reset
                  </BUTTON>
                </DIV>
              </DIV>
            </DIV>
          </>
        ) : (
          <>
            {/* Users */}
            <DIV className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
              <H2 className="text-lg font-semibold">Usuarios</H2>

              <DIV className="mt-4 grid gap-4 md:grid-cols-3">
                {/* list */}
                <DIV className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <P className="text-sm text-white/70 font-semibold">Listado</P>

                  <DIV className="mt-3 grid gap-2">
                    <LABEL>Seleccionar</LABEL>
                    <SELECT
                      value={userSel}
                      onChange={(e: any) => setUserSel(e.target.value)}
                      className="w-full"
                    >
                      <option value="">(nuevo usuario)</option>
                      {users.map((u) => (
                        <option key={u.userId} value={u.userId}>
                          {u.name || u.email} — {u.roleId}
                        </option>
                      ))}
                    </SELECT>
                  </DIV>

                  {userSel && (
                    <DIV className="mt-3 flex gap-2">
                      <BUTTON variant="ghost" onClick={() => deleteUser(userSel)}>
                        Eliminar
                      </BUTTON>
                      <BUTTON
                        variant="ghost"
                        onClick={() => {
                          setUserSel("");
                          setUName("");
                          setUEmail("");
                          setUPhone("");
                          setURoleId("team");
                          setUPin("");
                        }}
                      >
                        Nuevo
                      </BUTTON>
                    </DIV>
                  )}
                </DIV>

                {/* form */}
                <DIV className="md:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <P className="text-sm text-white/70 font-semibold">
                    {userSel ? "Editar usuario" : "Alta de usuario"}
                  </P>

                  <DIV className="mt-4 grid gap-3 md:grid-cols-2">
                    <DIV className="grid gap-2">
                      <LABEL>Nombre</LABEL>
                      <INPUT value={uName} onChange={(e: any) => setUName(e.target.value)} />
                    </DIV>

                    <DIV className="grid gap-2">
                      <LABEL>Email</LABEL>
                      <INPUT
                        value={uEmail}
                        onChange={(e: any) => setUEmail(e.target.value)}
                        placeholder="user@domain.com"
                        disabled={!!userSel} // estable si ya existe
                      />
                    </DIV>

                    <DIV className="grid gap-2">
                      <LABEL>Teléfono</LABEL>
                      <INPUT value={uPhone} onChange={(e: any) => setUPhone(e.target.value)} placeholder="+1 ..." />
                    </DIV>

                    <DIV className="grid gap-2">
                      <LABEL>Rol</LABEL>
                      <SELECT value={String(uRoleId)} onChange={(e: any) => setURoleId(e.target.value)} className="w-full">
                        {roleOptions.map((o) => (
                          <option key={String(o.value)} value={String(o.value)}>
                            {o.label}
                          </option>
                        ))}
                      </SELECT>
                    </DIV>

                    <DIV className="grid gap-2">
                      <LABEL>PIN (4 dígitos)</LABEL>
                      <INPUT
                        value={uPin}
                        onChange={(e: any) => setUPin(e.target.value)}
                        placeholder={userSel ? "(opcional para reset)" : "0000"}
                        inputMode="numeric"
                        maxLength={4}
                      />
                      <P className="text-xs text-white/50">
                        Se guarda como <SPAN className="font-mono">hash + salt</SPAN>, no como texto plano.
                      </P>
                    </DIV>
                  </DIV>

                  <DIV className="mt-4 flex gap-2">
                    <BUTTON onClick={upsertUser}>Guardar</BUTTON>
                    <BUTTON
                      variant="ghost"
                      onClick={() => {
                        setUName("");
                        setUEmail("");
                        setUPhone("");
                        setURoleId("team");
                        setUPin("");
                        setUserSel("");
                      }}
                    >
                      Reset
                    </BUTTON>
                  </DIV>
                </DIV>
              </DIV>
            </DIV>
          </>
        )}

        {!!status && (
          <DIV className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
            <P className="text-sm">{status}</P>
          </DIV>
        )}

        <DIV className="mt-8 text-xs text-white/40">
          <P>
            Nota: Admin es derivado por diseño para cumplir: “Admin tiene acceso a todas las caps permitidas por CCT”.
            Si mañana quieres que Admin sea editable, lo hacemos persistente en FS.
          </P>
        </DIV>
      </DIV>
    </AdminGuard>
  );
}
