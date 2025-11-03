import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';

// Settings (solo TSX)
import * as settingsSeedTsx from "@/seeds/settings";
import { getSettingsEffective } from "@/complements/data/settingsFS";

// Styles (solo TSX)
import * as stylesSeedTsx from "@/seeds/styles";
import { getStylesEffective } from "@/complements/data/stylesFS";

// Branding & i18n (solo TSX)
import * as brandingSeedTsx from "@/seeds/branding";
import {
  getBrandingAdminRaw,
  stringifyBrandingWithDict,
} from "@/complements/data/brandingFS";

import seedDicts from "@/app/[locale]/[tenant]/i18n";
import { getI18nEffectiveServer } from "@/complements/data/i18nFS.server";

type RouteParams = { scope: string };

// Coll/Doc parametrizables
const SETTINGS_COLL = process.env.NEXT_PUBLIC_SETTINGS_COLL || "settings";
const SETTINGS_DOC = process.env.NEXT_PUBLIC_SETTINGS_DOC || "default";

const STYLES_COLL = process.env.NEXT_PUBLIC_STYLES_COLL || "styles";
const STYLES_DOC = process.env.NEXT_PUBLIC_STYLES_DOC || "default";

const BRANDING_COLL = process.env.NEXT_PUBLIC_BRANDING_COLL || "branding";
const BRANDING_DOC = process.env.NEXT_PUBLIC_BRANDING_DOC || "default";

const I18N_COLL = process.env.NEXT_PUBLIC_I18N_COLL || "i18n_global";

export async function GET(
  req: Request,
  ctx: { params: Promise<RouteParams> }
) {
  const { scope } = await ctx.params;
  const url = new URL(req.url);
  const locale = toShortLocale(url.searchParams.get("locale") || DEFAULT_LOCALE_SHORT);
  const debug = url.searchParams.get("debug") === "1";

  try {
    // SETTINGS
    if (scope === "settings") {
      const fsGlobal = await getDoc(doc(FbDB, SETTINGS_COLL, SETTINGS_DOC))
        .then((s) => (s.exists() ? s.data() : undefined))
        .catch(() => undefined);

      // ahora resolvemos FM en settings por locale
      const effective = await getSettingsEffective(undefined, locale);

      return NextResponse.json({
        scope,
        locale,
        seedTsx: (settingsSeedTsx as any).default ?? settingsSeedTsx,
        fsGlobal,
        effective,
      });
    }

    // STYLES
    if (scope === "styles") {
      const fsGlobal = await getDoc(doc(FbDB, STYLES_COLL, STYLES_DOC))
        .then((s) => (s.exists() ? s.data() : undefined))
        .catch(() => undefined);
      const effective = await getStylesEffective();
      return NextResponse.json({
        scope,
        seedTsx: (stylesSeedTsx as any).default ?? stylesSeedTsx,
        fsGlobal,
        effective,
      });
    }

    // BRANDING
    if (scope === "branding") {
      let fsGlobal: any;
      let fsI18n: any;
      let raw: any = {};
      let dict: Record<string, any> = {};
      let effective: any = null;
      let errorMsg: string | undefined;

      try {
        fsGlobal = await getDoc(doc(FbDB, BRANDING_COLL, BRANDING_DOC))
          .then((s) => (s.exists() ? s.data() : undefined))
          .catch(() => undefined);

        fsI18n = await getDoc(doc(FbDB, I18N_COLL, locale))
          .then((s) => (s.exists() ? s.data() : undefined))
          .catch(() => undefined);

        raw = (await getBrandingAdminRaw(locale)) || {};
        dict = (await getI18nEffectiveServer(locale)) || {};
        effective = stringifyBrandingWithDict(raw, dict);
      } catch (e: any) {
        errorMsg = String(e?.message ?? e);
      }

      if (errorMsg && debug) {
        return NextResponse.json({
          scope,
          locale,
          error: errorMsg,
          seedTsx: (brandingSeedTsx as any).default ?? brandingSeedTsx,
          fsGlobal,
          fsI18n,
          raw,
          dict,
          effective: effective ?? null,
        });
      }

      if (errorMsg) {
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }

      return NextResponse.json({
        scope,
        locale,
        seedTsx: (brandingSeedTsx as any).default ?? brandingSeedTsx,
        fsGlobal,
        fsI18n,
        raw,
        dict,
        effective,
      });
    }

    // I18N
    if (scope === "i18n") {
      const seedLocale =
        (seedDicts as any)?.[locale] ||
        (seedDicts as any)?.[locale.split("-")[0]] ||
        {};

      let fsRaw: any;
      let fsEffective: Record<string, any> = {};
      let errorMsg: string | undefined;

      try {
        fsRaw = await getDoc(doc(FbDB, I18N_COLL, locale))
          .then((s) => (s.exists() ? s.data() : undefined))
          .catch(() => undefined);

        fsEffective = (await getI18nEffectiveServer(locale)) || {};
      } catch (e: any) {
        errorMsg = String(e?.message ?? e);
      }

      const effective = { ...(seedLocale || {}), ...(fsEffective || {}) };

      if (errorMsg && debug) {
        return NextResponse.json({
          scope,
          locale,
          error: errorMsg,
          seed: seedLocale,
          fsRaw,
          fsEffective,
          effective,
        });
      }
      if (errorMsg) {
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }

      return NextResponse.json({
        scope,
        locale,
        seed: seedLocale,
        fsRaw,
        effective,
      });
    }

    return NextResponse.json(
      { error: "scope inválido", allowed: ["settings", "styles", "branding", "i18n"] },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
