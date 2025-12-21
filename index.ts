// ────────────────────
// Manifest PWA
// ────────────────────
export { pwaManifest, pwaManifestDynamic } from "./lib/pwa/manifest";

// ────────────────────
// Wrappers
// ────────────────────
export * from "./complements/components/ui/wrappers";

// ────────────────────
// Admin Core Panel
// ────────────────────
export { default as AdminCorePanel } from "./complements/admin/AdminCorePanel";

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
// Seeds TS - Server safe
// ────────────────────
export { default as SeedStyles } from "./seeds/styles";

// ────────────────────
// Providers
// ────────────────────
// export { default as Providers } from "./app/ui/providers";
export { default as NIXINX } from "./app/ui/NIXINXproviders";
export {
  NotificationsProvider,
  useNotifications,
} from "./app/lib/notifications/provider";

// ────────────────────
// Notifications
// ────────────────────
export { default as NotificationTriggerButton } from "./complements/components/Notifications/NotificationTriggerButton";
export { default as NotificationsBadge } from "./complements/components/Notifications/NotificationsBadge";
export { default as NotificationsInbox } from "./complements/components/Notifications/NotificationsInbox";
export { default as NotificationPopupHost } from "./complements/components/Notifications/NotificationPopupHost";

// ────────────────────
// Interfaces - server safe
// ────────────────────
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
export { default as CardElem } from "./complements/components/Cards/CardElem";
export { default as ControlAccessRoles } from "./complements/components/ControlAccessRoles/ControlAccessRoles";
export { default as CookiesComp } from "./complements/components/CookiesComp/CookiesComp";
export { default as FooterComp } from "./complements/components/FooterComp/FooterComp";
export { default as FormComp } from "./complements/components/FormComp/FormComp";
export { default as GalleryComponent } from "./complements/components/GalleryComponent/GalleryComponent";
export { default as HeroEventsCarousel } from "./complements/components/HeroEventsCarousel/HeroEventsCarousel";
export { HoldComp, Success, Failed } from "./complements/components/HoldComp/HoldComp";
export { default as InstallPWAComp } from "./complements/components/InstallPWAComp/InstallPWAComp";

// i18n switcher (alias doble para evitar rupturas)
export { default as InterComp } from "./complements/components/InterComp/InterComp";
export { default as MapEmbed } from "./complements/components/Maps/MapEmbed/MapEmbed";  // Server
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
// Products (catálogo)
// ────────────────────
export { default as ProductCard } from "./complements/components/Products/ProductCard";
export { default as ProductDetails } from "./complements/components/Products/ProductDetails";
export type {
  Product,
  ProductVariant,
  ProductPricing,
  ProductSpec,
  ProductCTA,
  ProductLink,
  ProductSlide,
} from "./complements/components/Products/product.types";

// ────────────────────
// Functionalities
// ────────────────────
export { default as AdminGuard } from "./complements/admin/AdminGuard";
export { default as SuperAdminOnly } from "./complements/admin/SuperAdminOnly";
export { default as CampaignsCenter } from "./complements/admin/CampaignCenter";
export { default as CapGuard } from "./complements/admin/CapGuard";
export { default as FDVTest } from "./complements/admin/fdv";
export { default as PaymentsAdmin } from "./complements/admin/PaymentsAdmin";
export { default as Settings } from "./complements/admin/Setting";
export { default as StylesTab } from "./complements/admin/StylesTab";
export { default as ProductsAdmin } from "./complements/admin/ProductsAdmin";
export { default as ServicesAdmin } from "./complements/admin/ServicesAdmin";

// ────────────────────
// EndPoints
// ────────────────────
export {
  fetchFaculties,
  canUseFaculty,
  type FacultyKey,
} from "./lib/sdk/facultiesClient";  // Server

// FM (wrapper de react-intl)
export { default as NIXIN } from "./complements/shell/NIXIN";
export { default as FM } from "./complements/i18n/FM";

// ────────────────────
// Factory UI (FUI + AdminPanel)
// ────────────────────
export { default as FUIPanel } from "./complements/factory/FuiPanel";
export { default as AdminPanel } from "./complements/factory/AdminPanel";

// Catálogo base de schemas
export { PANEL_SCHEMAS } from "./complements/factory/panelSchemas";

// Tipos públicos del schema
export type {
  PanelSchema,
  PanelField,
  PanelFieldType,
} from "./complements/factory/panelSchema.types";

// Helpers (opcional, pero recomendado)
export * from "./complements/factory/fui.crud";
export * from "./complements/factory/pwa.sync";

// Final obligatorio
export {};