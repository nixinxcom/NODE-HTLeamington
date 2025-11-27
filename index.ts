'use client';

// ────────────────────
// Wrappers
// ────────────────────
export * from "./complements/components/ui/wrappers";

// ────────────────────
// UIs
// ────────────────────
export { default as StyleDesigner } from "./complements/components/StyleDesigner/StyleDesigner";
export { default as EnvWizard } from "./complements/admin/EnvWizard";

// ────────────────────
// Tabs
// ────────────────────
export { default as MetaTab } from "./complements/admin/MetaTab";
export { default as FMsTab } from "./complements/admin/FMsTab";

// ────────────────────
// Seeds TS
// ────────────────────
export { default as SeedStyles } from "./seeds/styles";
// export { default as SeedBranding } from "./seeds/branding";
// export { default as SeedSettings } from "./seeds/settings";

// ────────────────────
// Seeds JSON
// ────────────────────
import metaGlobal from "./seeds/meta.global.json";
import metaPages  from "./seeds/meta.pages.json";
import metaSite   from "./seeds/meta.site.json";
export const SeedMetaGlobal = metaGlobal;
export const SeedMetaPages  = metaPages;
export const SeedMetaSite   = metaSite;

// ────────────────────
// Providers
// ────────────────────
export { default as Providers } from "./app/ui/providers";
export { NotificationsProvider, useNotifications } from "./app/lib/notifications/provider";

// ────────────────────
// Interfaces
// ────────────────────
export * from "./coreinterfaces";
export type { default as iSettings } from "./app/lib/settings/interface";
export type { default as iBranding } from "./app/lib/branding/interface";

// ────────────────────
// App Components
// ────────────────────
export { default as AiComp } from "./complements/components/AiComp/AiComp";
export { default as Auth } from "./complements/components/Auth/UserBadge";
export { default as AuthenticationComp } from "./complements/components/AuthenticationComp/AuthenticationComp";
export { default as AutoMediaCarousel } from "./complements/components/AutoMediaCarousel/AutoMediaCarousel";
export { default as BackgroundMediaComp } from "./complements/components/BackgroundMediaComp/BackgroundMediaComp";
export { default as BlogCardComp } from "./complements/components/BlogCardComp/BlogCardComp";
export { default as CookiesComp } from "./complements/components/CookiesComp/CookiesComp";
export { default as FooterComp } from "./complements/components/FooterComp/FooterComp";
export { default as FormComp } from "./complements/components/FormComp/FormComp";
export { default as GalleryComponent } from "./complements/components/GalleryComponent/GalleryComponent";
export { default as HeroEventsCarousel } from "./complements/components/HeroEventsCarousel/HeroEventsCarousel";
export { HoldComp, Success, Failed } from "./complements/components/HoldComp/HoldComp";
export { default as InstallPWAComp } from "./complements/components/InstallPWAComp/InstallPWAComp";
export { NewNotification } from "@/complements/components/Notifications/NewNotification";


// i18n switcher (alias doble para evitar rupturas)
export { default as InterComp } from "./complements/components/InterComp/InterComp";

export { default as MapEmbed } from "./complements/components/Maps/MapEmbed/MapEmbed";
export { default as MapGoogle } from "./complements/components/Maps/MapGoogle/MapGoogle";
export { default as NavBar } from "./complements/components/NavBar/NavBar";
export { default as PayPal } from "./complements/components/PayPal/PayPalButtonsComp";
export { default as PlayerComp } from "./complements/components/PlayerComp/PlayerComp";
export { default as Popup } from "./complements/components/Popup/Popup";
export { default as PopupComp } from "./complements/components/PopupComp/PopupComp";
export { default as ReviewsRail } from "./complements/components/ReviewsRail/ReviewsRail";
export { default as RouteGuard } from "./complements/components/RouteGuard/RouteGuard";
export { default as SliderComp } from "./complements/components/SliderComp/SliderCardComp";
export { default as StripeLoaderComp } from "./complements/components/StripeLoaderComp/StripeLoaderComp";
export { default as TableComp } from "./complements/components/TableComp/TableComp";
export { default as ThemeToggle } from "./complements/components/ThemeToggle/ThemeToggle";

// ────────────────────
// Functionalities
// ────────────────────
export { default as AdminGuard } from "./complements/admin/AdminGuard";
export { default as SuperAdminOnly } from "./complements/admin/SuperAdminOnly";
export { hasNotificationsFaculty } from "./app/lib/notifications/config";
export { sendNotification } from "@/app/lib/notifications/client";

// ────────────────────
// EndPoints
// ────────────────────
export { fetchFaculties, canUseFaculty, type FacultyKey, } from "./lib/sdk/facultiesClient";


// FM (wrapper de react-intl)
export { default as CoreShell } from "./complements/shell/CoreShell";
export { default as FM } from "./complements/i18n/FM";

// Final obligatorio
export {};
