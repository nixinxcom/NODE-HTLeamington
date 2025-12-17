// app/lib/cct/caps.catalog.ts

export const CCT_CAP_KEYS = [
"adminPanel",
"website",
"campaigncenter",
"styledesigner",
"gtm",
"agentAI",
"booking",
"socialmedia",
"sellsplatforms",
"products",
"services",
"contact",
"settings",
"branding",
"maps",
"notifications",
"paypal",
"adsense",
"multilenguaje",
"seo",
"pwa",
"storage",
"car",
"marketing",
] as const;

export type CctCap = (typeof CCT_CAP_KEYS)[number];

export type CctCapItem = Readonly<{
  key: CctCap;
  labelKey: string;
  defaultEnabled?: boolean;
}>;

export const CCT_CAPS_CATALOG: ReadonlyArray<CctCapItem> = [
  { key: "adminPanel", labelKey: "Admin Panel", defaultEnabled: true },
  { key: "website", labelKey: "website", defaultEnabled: true },
  { key: "campaigncenter", labelKey: "Campaign Center" },
  { key: "styledesigner", labelKey: "Styles" },
  { key: "gtm", labelKey: "analytics" },
  { key: "agentAI", labelKey: "agentAI" },
  { key: "booking", labelKey: "booking" },
  { key: "socialmedia", labelKey: "socialmedia" },
  { key: "sellsplatforms", labelKey: "Sells Platforms" },
  { key: "products", labelKey: "Products" },
  { key: "services", labelKey: "Services" },
  { key: "contact", labelKey: "Contact" },
  { key: "settings", labelKey: "Settings", defaultEnabled: true },
  { key: "branding", labelKey: "Branding" },
  { key: "maps", labelKey: "Maps" },
  { key: "notifications", labelKey: "Notifications" },
  { key: "paypal", labelKey: "Paypal" },
  { key: "adsense", labelKey: "Adsense" },
  { key: "multilenguaje", labelKey: "multilenguaje" },
  { key: "seo", labelKey: "SEO" },
  { key: "pwa", labelKey: "Progressive Web App" },
  { key: "storage", labelKey: "Storage" },
  { key: "car", labelKey: "Multiuser" },
  { key: "marketing", labelKey: "Email / SMS / InApp Marketing" },
];

export const CCT_CAPS: ReadonlyArray<CctCap> = CCT_CAP_KEYS;

// util para selects / schemas
export type CctCapOption = { value: CctCap; labelKey: string };
export const CCT_CAP_OPTIONS: ReadonlyArray<CctCapOption> = CCT_CAPS_CATALOG.map((c) => ({
  value: c.key,
  labelKey: c.labelKey,
}));

// defaults consistentes (sin casts raros)
export const DEFAULT_CAP_CHECKS: Record<CctCap, boolean> = CCT_CAPS_CATALOG.reduce(
  (acc, c) => {
    acc[c.key] = c.defaultEnabled ?? false;
    return acc;
  },
  {} as Record<CctCap, boolean>,
);

