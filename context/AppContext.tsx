// context/AppContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useFdvData } from "@/app/providers/FdvProvider";

import type iBranding from "@/app/lib/branding/interface";
import type iSettings from "@/app/lib/settings/interface";
import type { StylesDoc } from "@/app/lib/styles/types";

import { toShort } from "@/app/lib/i18n/locale";
import { defaultShort } from "@/app/lib/i18n/adapters";

import {
  FbAuth,
  ensureAnon,
  GoogleProvider,
} from "@/app/lib/services/firebase";

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";

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
  Locale: string;
  setLocale: (locale: string) => void;

  Branding: iBranding<UIString>;
  setBranding: React.Dispatch<React.SetStateAction<iBranding<UIString>>>;

  Settings: iSettings | undefined;
  setSettings: React.Dispatch<React.SetStateAction<iSettings | undefined>>;

  Styles: StylesDoc | undefined;
  setStyles: React.Dispatch<React.SetStateAction<StylesDoc | undefined>>;

  Theme: AppThemeAPI;

  Authenticated: boolean;
  setAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;

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

  User: User | null;
  setUserState: (u: User | null) => void;
  userState: { User: User | null; setUserState: (u: User | null) => void };

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

function normalizeBranding(
  b?: iBranding<UIString> | null,
): iBranding<UIString> {
  const src: any = b ?? {};

  const company = src.company ?? {};

  const normalized: any = {
    ...src,
    company: {
      // defaults seguros
      logo: "",
      ...company,
      branches: Array.isArray(company.branches) ? company.branches : [],
    },
  };

  return normalized as iBranding<UIString>;
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
  /* 1) Leer FDV (cliente) */
  const fdv = useFdvData(); // viene de FdvProvider
  const fdvBranding = fdv?.data?.branding as iBranding<UIString> | undefined;
  const fdvSettings = fdv?.data?.settings as iSettings | undefined;
  const fdvStyles = fdv?.data?.styles as StylesDoc | undefined;

  /* 2) Locale inicial — preferimos FDV.settings si existe */
  const [Locale, setLocale] = useState<string>(
    toShort(
      initial?.locale ??
        initialLocale ??
        fdvSettings?.website?.i18n?.defaultLocale ??
        initialSettings?.website?.i18n?.defaultLocale ??
        defaultShort(),
    ),
  );

  /* 3) Datos efectivos: Branding / Settings / Styles */

  const [Branding, setBranding] = useState<iBranding<UIString>>(
    normalizeBranding(
      fdvBranding ?? initial?.branding ?? initialBranding ?? ({} as any),
    ),
  );

  const [Settings, setSettings] = useState<iSettings | undefined>(
    fdvSettings ?? initial?.settings ?? initialSettings,
  );

  const [Styles, setStyles] = useState<StylesDoc | undefined>(
    fdvStyles ?? initial?.styles ?? initialStyles,
  );

  // Sincronizar cuando cambie FDV (por ejemplo, cambios en panel admin)
  useEffect(() => {
    if (fdvBranding) setBranding(normalizeBranding(fdvBranding));
  }, [fdvBranding]);

  useEffect(() => {
    if (fdvSettings) setSettings(fdvSettings);
  }, [fdvSettings]);

  useEffect(() => {
    if (fdvStyles) setStyles(fdvStyles);
  }, [fdvStyles]);

  /* 4) Auth funcional y SignAuth */

  const [Authenticated, setAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!FbAuth) return;
    const unsub = onAuthStateChanged(FbAuth, (u) => {
      setUser(u ?? null);
      setAuthenticated(!!u);
    });
    return () => {
      try {
        unsub && unsub();
      } catch {
        // ignore
      }
    };
  }, []);

  const signIn = useCallback(async () => {
    if (!FbAuth || !GoogleProvider) return;
    try {
      await signInWithPopup(FbAuth, GoogleProvider);
    } catch {
      // ignore
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!FbAuth) return;
    try {
      await fbSignOut(FbAuth);
    } catch {
      // ignore
    }
  }, []);

  const signEnsureAnon = useCallback(async () => {
    try {
      await ensureAnon();
    } catch {
      // ignore
    }
  }, []);

  /* 5) Flags de UI */

  const [HideHeaderFooter, setHideHeaderFooter] = useState(false);
  const [ShowFloatingWidget, setShowFloatingWidget] = useState(false);
  const [AiEnabled, setAiEnabled] = useState(false);
  const [AiExpanded, setAiExpanded] = useState(false);
  const [AiInput, setAiInput] = useState("");

  /* 6) Theme API (slot y aliases desde Settings + atributo data-theme) */

  const aliases = useMemo(
    () => ({
      light: String(Settings?.website?.theme?.aliases?.light ?? "light"),
      dark: String(Settings?.website?.theme?.aliases?.dark ?? "dark"),
    }),
    [Settings],
  );

  // slot inicial desde atributo SSR; si no existe, usa light
  const initialSlot: "light" | "dark" =
    typeof document !== "undefined"
      ? ((document.documentElement.getAttribute(
          "data-theme",
        ) as "light" | "dark" | null) ?? "light")
      : "light";

  const [slot, setSlotState] = useState<"light" | "dark">(initialSlot);

  const setSlot = useCallback((next: "light" | "dark") => {
    try {
      localStorage.setItem("theme.slot", next);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.setAttribute("data-theme", next);
      root.classList.toggle("dark", next === "dark");
      try {
        (root as any).style.colorScheme = next;
      } catch {
        // ignore
      }
      document.dispatchEvent(new CustomEvent("theme:slot", { detail: next }));
    }
    setSlotState(next);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const cur = root.getAttribute("data-theme");
    const initial: "light" | "dark" =
      cur === "light" || cur === "dark" ? (cur as any) : "light";
    root.classList.toggle("dark", initial === "dark");
    try {
      (root as any).style.colorScheme = initial;
    } catch {
      // ignore
    }
    setSlotState(initial);
  }, []);

  /* 7) Valor memoizado del contexto */

  const value = useMemo<iAppContext>(
    () => ({
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

      User: user,
      setUserState: setUser,
      userState: { User: user, setUserState: setUser },

      SignAuth: {
        user,
        signIn,
        signOut,
        ensureAnon: signEnsureAnon,
      },
    }),
    [
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
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* Hook de consumo */
export function useAppContext(): iAppContext {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within <ContextProvider>");
  }
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
    es: "es",
    "es-mx": "es",
    en: "en",
    "en-us": "en",
    fr: "fr",
    "fr-ca": "fr",
  };
  return map[v] ?? SUPPORTED_LOCALES[0];
}
