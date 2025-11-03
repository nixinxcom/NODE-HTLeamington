// context/AppContext.tsx
"use client";
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import type iBranding from "@/app/lib/branding/interface";
import type iSettings from "@/app/lib/settings/interface";
import type { StylesDoc } from "@/app/lib/styles/types";
import { toShort } from "@/app/lib/i18n/locale";
import { defaultShort } from "@/app/lib/i18n/adapters";


// Firebase Auth (opcional; usado por SignAuth)
import { FbAuth, ensureAnon, GoogleProvider } from "@/app/lib/services/firebase";
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, type User } from "firebase/auth";

/* ─────────────────────────────────────────────────────────
   Tipos públicos del contexto (API estable)
   ───────────────────────────────────────────────────────── */
export interface AppThemeAPI {
  slot: "light" | "dark";
  aliases: { light: string; dark: string };
  setSlot: (slot: "light" | "dark") => void;
}

type UIString = string | JSX.Element; // acepta <FM /> o string por defecto

export interface iAppContext {
  // Locale global
  Locale: string;
  setLocale: (locale: string) => void;
  // Datos efectivos (única fuente de verdad: loaders FS > JSON > TSX)
  Branding: iBranding<UIString>;
  setBranding: React.Dispatch<React.SetStateAction<iBranding<UIString>>>;
  Settings: iSettings | undefined;
  setSettings: React.Dispatch<React.SetStateAction<iSettings | undefined>>;
  Styles: StylesDoc | undefined;
  setStyles: React.Dispatch<React.SetStateAction<StylesDoc | undefined>>;
  // Tema (derivado de Settings + atributo SSR data-theme)
  Theme: AppThemeAPI;
  // Estado de autenticación “funcional”
  Authenticated: boolean;
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  // UI flags (nombres preservados)
  HideHeaderFooter: boolean;
  setHideHeaderFooter: React.Dispatch<React.SetStateAction<boolean>>;
  ShowFloatingWidget: boolean;
  setShowFloatingWidget: React.Dispatch<React.SetStateAction<boolean>>;
  AiEnabled: boolean;
  setAiEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  AiExpanded: boolean;
  setAiExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  AiInput: string;
  setAiInput: React.Dispatch<React.SetStateAction<string>>;
  // SignAuth + compat formal (no “parche”, API estable)
  User: User | null;
  setUserState: (u: User | null) => void;
  userState: { User: User | null; setUserState: (u: User | null) => void };
  // Helpers de auth integrados
  SignAuth: {
    user: User | null;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    ensureAnon: () => Promise<void>;
  };
}

/* ─────────────────────────────────────────────────────────
   Normalización liviana (para evitar nulls molestos)
   ───────────────────────────────────────────────────────── */
function normalizeBranding(b?: iBranding<UIString> | null): iBranding<UIString> {
  const safe = (b ?? ({} as iBranding<UIString>)) as any;
  if (safe.company) {
    safe.company = { ...safe.company, branches: safe.company.branches ?? [] };
  }
  return safe as iBranding<UIString>;
}

/* ─────────────────────────────────────────────────────────
   Contexto y Provider
   ───────────────────────────────────────────────────────── */
const noop = () => {};

const AppContext = createContext<iAppContext>({
  Locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en",
  setLocale: noop,
  Branding: {} as iBranding<UIString>,
  setBranding: noop as any,
  Settings: undefined,
  setSettings: noop as any,
  Styles: undefined,
  setStyles: noop as any,
  Theme: {
    slot: "light",
    aliases: { light: "light", dark: "dark" },
    setSlot: noop,
  },
  Authenticated: false,
  setAuthenticated: noop as any,
  HideHeaderFooter: false,
  setHideHeaderFooter: noop as any,
  ShowFloatingWidget: false,
  setShowFloatingWidget: noop as any,
  AiEnabled: false,
  setAiEnabled: noop as any,
  AiExpanded: false,
  setAiExpanded: noop as any,
  AiInput: "",
  setAiInput: noop as any,
  User: null,
  setUserState: noop,
  userState: { User: null, setUserState: noop },
  SignAuth: {
    user: null,
    signIn: async () => {},
    signOut: async () => {},
    ensureAnon: async () => {},
  },
});

type ProviderProps = {
  children: React.ReactNode;
  initialLocale?: string;
  initialBranding?: iBranding<UIString>;
  initialSettings?: iSettings;
  initialStyles?: StylesDoc;
  // compat (si alguien te los empaqueta juntos)
  initial?: {
    branding?: iBranding<UIString>;
    settings?: iSettings;
    styles?: StylesDoc;
    locale?: string;
  };
};

export function ContextProvider({
  children,
  initialLocale,
  initialBranding,
  initialSettings,
  initialStyles,
  initial,
}: ProviderProps) {
  /* Locale */
  const [Locale, setLocale] = useState<string>(
    toShort(
      initial?.locale ??
        initialLocale ??
        initialSettings?.website?.i18n?.defaultLocale ??
        defaultShort()
    )
  );


  /* Datos efectivos */
  const [Branding, setBranding] = useState<iBranding<UIString>>(
    normalizeBranding(initial?.branding ?? initialBranding)
  );
  const [Settings, setSettings] = useState<iSettings | undefined>(
    initial?.settings ?? initialSettings
  );
  const [Styles, setStyles] = useState<StylesDoc | undefined>(
    initial?.styles ?? initialStyles
  );

  /* Auth funcional y SignAuth */
  const [Authenticated, setAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!FbAuth) return;
    const unsub = onAuthStateChanged(FbAuth, (u) => {
      setUser(u ?? null);
      setAuthenticated(!!u);
    });
    return () => {
      try { unsub && unsub(); } catch {}
    };
  }, []);

  const signIn = useCallback(async () => {
    if (!FbAuth || !GoogleProvider) return;
    try { await signInWithPopup(FbAuth, GoogleProvider); } catch {}
  }, []);
  const signOut = useCallback(async () => {
    if (!FbAuth) return;
    try { await fbSignOut(FbAuth); } catch {}
  }, []);
  const signEnsureAnon = useCallback(async () => {
    try { await ensureAnon(); } catch {}
  }, []);

  /* UI flags */
  const [HideHeaderFooter, setHideHeaderFooter] = useState(false);
  const [ShowFloatingWidget, setShowFloatingWidget] = useState(false);
  const [AiEnabled, setAiEnabled] = useState(false);
  const [AiExpanded, setAiExpanded] = useState(false);
  const [AiInput, setAiInput] = useState("");

  /* Theme API (única verdad: Settings + data-theme del <html>) */
  const aliases = useMemo(
    () => ({
      light: String(Settings?.website?.theme?.aliases?.light ?? "light"),
      dark: String(Settings?.website?.theme?.aliases?.dark ?? "dark"),
    }),
    [Settings]
  );

  // slot inicial desde atributo SSR; si no existe, usa light
  const initialSlot =
  typeof document !== "undefined"
    ? ((document.documentElement.getAttribute("data-theme") as "light"|"dark"|null) ?? "light")
    : ("light" as const);

  const [slot, setSlotState] = useState<"light" | "dark">(initialSlot);

  const setSlot = useCallback((next: "light" | "dark") => {
    try { localStorage.setItem("theme.slot", next); } catch {}
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.setAttribute("data-theme", next);
      root.classList.toggle("dark", next === "dark");   // ← compat
      try { (root as any).style.colorScheme = next; } catch {}
      document.dispatchEvent(new CustomEvent("theme:slot", { detail: next }));
    }
    setSlotState(next);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme");
    const initial = (cur === "light" || cur === "dark") ? (cur as "light"|"dark") : "light";
    root.classList.toggle("dark", initial === "dark");  // ← asegura clase al montar
    try { (root as any).style.colorScheme = initial; } catch {}
    setSlotState(initial);
  }, []);

  const value = useMemo<iAppContext>(() => ({
    Locale,
    setLocale,
    Branding,
    setBranding,
    Settings,
    setSettings,
    Styles,
    setStyles,
    Theme: { slot, aliases, setSlot },
    Authenticated,
    setAuthenticated,
    HideHeaderFooter,
    setHideHeaderFooter,
    ShowFloatingWidget,
    setShowFloatingWidget,
    AiEnabled,
    setAiEnabled,
    AiExpanded,
    setAiExpanded,
    AiInput,
    setAiInput,
    // Compat formal (consumidores existentes)
    User: user,
    setUserState: setUser,
    userState: { User: user, setUserState: setUser },
    SignAuth: {
      user,
      signIn,
      signOut,
      ensureAnon: signEnsureAnon,
    },
  }), [
    Locale,
    Branding,
    Settings,
    Styles,
    slot,
    aliases,
    setSlot,
    Authenticated,
    HideHeaderFooter,
    ShowFloatingWidget,
    AiEnabled,
    AiExpanded,
    AiInput,
    user,
    signIn,
    signOut,
    signEnsureAnon,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* Hook de consumo */
export function useAppContext(): iAppContext {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within <ContextProvider>");
  return ctx;
}

/* ─────────────────────────────────────────────────────────
   Compat i18n (normaliza locales a los soportados)
   ───────────────────────────────────────────────────────── */
export const SUPPORTED_LOCALES = ["es", "en", "fr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeToSupported(locale?: string): SupportedLocale {
  const v = String(locale || "").trim().toLowerCase();
  const map: Record<string, SupportedLocale> = {
    "es": "es", "es-mx": "es",
    "en": "en", "en-us": "en",
    "fr": "fr", "fr-ca": "fr",
  };
  return map[v] ?? (SUPPORTED_LOCALES.find(l => l.toLowerCase() === v) ?? process.env.NEXT_PUBLIC_DEFAULT_LOCALE);
}