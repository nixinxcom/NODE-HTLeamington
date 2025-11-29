import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const PWA_PANEL_SCHEMA: PanelSchema = {
  "id": "pwa",
  "labelKey": "panels.pwa.title",
  "iconKey": "pwa",
  "fsCollection": "Providers",
  "fsDocId": "pwa",
  "isProvider": true,
  "isAgentFDV": true,
  "source": "core",
  "stage": "published",
  "access": {
    "allowedRoles": ["superadmin", "admin", "client"]
  },
  "version": 1,
  "fields": [
    /* ───────── Manifest básicos ───────── */
    {
      "name": "appName",
      "type": "string",
      "required": true,
      "groupKey": "manifest"
    },
    {
      "name": "shortName",
      "type": "string",
      "required": true,
      "groupKey": "manifest"
    },
    {
      "name": "description",
      "type": "text",
      "widget": "textarea",
      "required": true,
      "groupKey": "manifest",
      "translatable": true
    },
    {
      "name": "defaultLocale",
      "type": "select",
      "required": true,
      "groupKey": "manifest",
      "minLength": 2,
      "maxLength": 2,
      "options": [
        { "value": "es", "labelKey": "Español" },
        { "value": "en", "labelKey": "English" },
        { "value": "fr", "labelKey": "Français" }
      ]
    },
    {
      "name": "categories",
      "type": "array",
      "groupKey": "manifest",
      "element": {
        "name": "category",
        "type": "string",
        "required": true,
        "translatable": true
      },
      "sortable": true,
      "required": true
    },
    {
      "name": "startUrl",
      "type": "string",
      "required": true,
      "groupKey": "manifest",
      "widget": "image"        // ← la dejo como la tenías, tú decides luego si la cambias
    },
    {
      "name": "scope",
      "type": "string",
      "required": true,
      "groupKey": "manifest"
    },
    {
      "name": "display",
      "type": "select",
      "required": true,
      "groupKey": "manifest",
      "options": [
        { "value": "fullscreen", "labelKey": "Full Screen" },
        { "value": "standalone", "labelKey": "Standalone" },
        { "value": "minimal-ui", "labelKey": "Minimal UI" },
        { "value": "browser", "labelKey": "Browser" },
        { "value": "window-controls-overlay", "labelKey": "Window Controls Overlay" }
      ]
    },
    {
      "name": "orientation",
      "type": "select",
      "required": true,
      "groupKey": "manifest",
      "options": [
        { "value": "any", "labelKey": "any" },
        { "value": "natural", "labelKey": "natural" },
        { "value": "landscape", "labelKey": "landscape" },
        { "value": "landscape-primary", "labelKey": "landscape-primary" },
        { "value": "landscape-secondary", "labelKey": "landscape-secondary" },
        { "value": "portrait", "labelKey": "portrait" },
        { "value": "portrait-primary", "labelKey": "portrait-primary" },
        { "value": "portrait-secondary", "labelKey": "portrait-secondary" }
      ]
    },
    {
      "name": "themeColor",
      "type": "select",
      "required": true,
      "groupKey": "manifest",
      "options": [
        { "value": "light", "labelKey": "Light" },
        { "value": "dark", "labelKey": "Dark" }
      ]
    },
    {
      "name": "backgroundColor",
      "type": "string",
      "required": true,
      "groupKey": "manifest",
      "widget": "color"
    },

    /* ───────── NUEVO: upload de Logo al Storage ───────── */
    {
      "name": "logoUpload",
      "type": "string",
      "required": true,
      "groupKey": "manifest",
      "widget": "upload",
      "labelKey": "panels.pwa.logoUpload.label",
      "descriptionKey": "panels.pwa.logoUpload.description",
      // tipos de archivo permitidos en <input type="file">
      "accept": ["image/webp", "image/png", "image/jpeg"],
      // config para que el PUI sepa qué hacer
      "uploadConfig": {
        "storageFolder": "manifest/icons"
      }
    },

    /* ───────── NUEVO: upload de screenshots narrow ───────── */
    {
      "name": "screenshotsNarrowUpload",
      "type": "string",
      "required": false,
      "groupKey": "manifest",
      "widget": "upload",
      "labelKey": "panels.pwa.screenshotsUpload.label",
      "descriptionKey": "panels.pwa.screenshotsUpload.description",
      "accept": ["image/webp", "image/png", "image/jpeg"],
      "uploadConfig": {
        "storageFolder": "manifest/screenshots/narrow",
      }
    },

    /* ───────── NUEVO: upload de screenshots wide ───────── */
    {
      "name": "screenshotsWideUpload",
      "type": "string",
      "required": false,
      "groupKey": "manifest",
      "widget": "upload",
      "labelKey": "panels.pwa.screenshotsUpload.label",
      "descriptionKey": "panels.pwa.screenshotsUpload.description",
      "accept": ["image/webp", "image/png", "image/jpeg"],
      "uploadConfig": {
        "storageFolder": "manifest/screenshots/wide",
      }
    },

    /* ───────── Metadatos internos ───────── */
    {
      "name": "_updatedAt",
      "type": "date",
      "groupKey": "manifest",
      "required": true
    },
    {
      "name": "_createdBy",
      "type": "string",
      "groupKey": "manifest"
    }
  ]
};
