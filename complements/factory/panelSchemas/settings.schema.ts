import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const SETTINGS_PANEL_SCHEMA: PanelSchema = {
  "id": "settings",
  "labelKey": "panels.settings.title",
  "iconKey": "settings",
  "fsCollection": "Providers",
  "fsDocId": "Settings",
  "isProvider": true,
  "source": "core",
  "stage": "published",
  "access": {
    "allowedRoles": [
      "superadmin",
      "admin"
    ]
  },
  "version": 1,
  "fields": [
    {
      "name": "adminPanel",
      "type": "boolean",
      "required": true,
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "website",
      "type": "boolean",
      "required": true,
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "agentAI",
      "type": "boolean",
      "required": true,
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "ecommerce",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "booking",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "socialmedia",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "sellsplatforms",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "products",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "services",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "contact",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "settings",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "branding",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "styles",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "maps",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "notifications",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "paypal",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "stripe",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "adsense",
      "type": "boolean",
      "widget": "switch",
      "groupKey": "faculties"
    },
    {
      "name": "Name",
      "type": "string",
      "required": true,
      "groupKey": "company.legals"
    },
    {
      "name": "TaxId",
      "type": "string",
      "groupKey": "company.legals"
    },
    {
      "name": "BusinessNumber",
      "type": "string",
      "groupKey": "company.legals"
    },
    {
      "name": "Email",
      "type": "string",
      "groupKey": "company.legals"
    },
    {
      "name": "Phone",
      "type": "string",
      "groupKey": "company.legals"
    },
    {
      "name": "Address",
      "type": "text",
      "widget": "textarea",
      "groupKey": "company.legals"
    },
    {
      "name": "mapLat",
      "type": "number",
      "min": -90,
      "max": 90,
      "groupKey": "company.legals"
    },
    {
      "name": "mapLng",
      "type": "number",
      "min": -180,
      "max": 180,
      "groupKey": "company.legals"
    },
    {
      "name": "placeQuery",
      "type": "string",
      "groupKey": "company.legals"
    },
    {
      "name": "Name",
      "type": "string",
      "required": true,
      "groupKey": "company.controller"
    },
    {
      "name": "Email",
      "type": "string",
      "required": true,
      "groupKey": "company.controller"
    },
    {
      "name": "Phone",
      "type": "string",
      "required": true,
      "groupKey": "company.controller"
    },
    {
      "name": "Address",
      "type": "text",
      "widget": "textarea",
      "required": true,
      "groupKey": "company.controller"
    },
    {
      "name": "enabled",
      "type": "boolean",
      "required": true,
      "widget": "switch",
      "groupKey": "domain"
    },
    {
      "name": "url",
      "type": "string",
      "required": true,
      "groupKey": "domain"
    },
    {
      "name": "provider",
      "type": "select",
      "required": true,
      "groupKey": "agentAI",
      "options": [
        {
          "value": "openai",
          "labelKey": "settings.agentAI.provider.openai"
        },
        {
          "value": "gemini",
          "labelKey": "settings.agentAI.provider.gemini"
        }
      ]
    },
    {
      "name": "model",
      "type": "string",
      "required": true,
      "groupKey": "agentAI"
    },
    {
      "name": "temperature",
      "type": "number",
      "min": 0,
      "max": 2,
      "groupKey": "agentAI"
    },
    {
      "name": "languages",
      "type": "array",
      "groupKey": "agentAI",
      "element": {
        "name": "langCode",
        "type": "string",
        "widget": "input"
      },
      "sortable": true
    },
    {
      "name": "rawConfig",
      "type": "text",
      "widget": "json",
      "descriptionKey": "settings.agentAI.rawConfig.desc",
      "groupKey": "agentAI"
    },
    {
      "name": "url",
      "type": "string",
      "required": true,
      "groupKey": "website"
    },
    {
      "name": "favicon",
      "type": "string",
      "widget": "image",
      "groupKey": "website"
    },
    {
      "name": "ogDefault.image",
      "type": "string",
      "widget": "image",
      "groupKey": "website"
    },
    {
      "name": "fonts.headings",
      "type": "string",
      "groupKey": "website"
    },
    {
      "name": "fonts.body",
      "type": "string",
      "groupKey": "website"
    },
    {
      "name": "aliases.light",
      "type": "string",
      "groupKey": "website.theme"
    },
    {
      "name": "aliases.dark",
      "type": "string",
      "groupKey": "website.theme"
    },
    {
      "name": "initialSlot",
      "type": "select",
      "required": true,
      "groupKey": "website.theme",
      "options": [
        {
          "value": "light",
          "labelKey": "settings.website.theme.initialSlot.light"
        },
        {
          "value": "dark",
          "labelKey": "settings.website.theme.initialSlot.dark"
        }
      ]
    },
    {
      "name": "meta.themeColor.light",
      "type": "string",
      "widget": "color",
      "groupKey": "website.theme"
    },
    {
      "name": "meta.themeColor.dark",
      "type": "string",
      "widget": "color",
      "groupKey": "website.theme"
    },
    {
      "name": "defaultLocale",
      "type": "string",
      "required": true,
      "groupKey": "website.i18n"
    },
    {
      "name": "supported",
      "type": "array",
      "groupKey": "website.i18n",
      "element": {
        "name": "locale",
        "type": "string"
      },
      "sortable": true
    },
    {
      "name": "directUrls",
      "type": "array",
      "groupKey": "directUrls",
      "element": {
        "name": "route",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "key",
            "type": "string",
            "required": true
          },
          {
            "name": "path",
            "type": "string",
            "required": true
          }
        ]
      },
      "sortable": true
    },
    {
      "name": "name",
      "type": "string",
      "required": true,
      "groupKey": "pwa"
    },
    {
      "name": "shortName",
      "type": "string",
      "required": true,
      "groupKey": "pwa"
    },
    {
      "name": "description",
      "type": "text",
      "widget": "textarea",
      "required": true,
      "groupKey": "pwa"
    },
    {
      "name": "startUrl",
      "type": "string",
      "required": true,
      "groupKey": "pwa"
    },
    {
      "name": "scope",
      "type": "string",
      "required": true,
      "groupKey": "pwa"
    },
    {
      "name": "id",
      "type": "string",
      "required": true,
      "groupKey": "pwa"
    },
    {
      "name": "display",
      "type": "select",
      "required": true,
      "groupKey": "pwa",
      "options": [
        {
          "value": "fullscreen",
          "labelKey": "settings.pwa.display.fullscreen"
        },
        {
          "value": "standalone",
          "labelKey": "settings.pwa.display.standalone"
        },
        {
          "value": "minimal-ui",
          "labelKey": "settings.pwa.display.minimal"
        },
        {
          "value": "browser",
          "labelKey": "settings.pwa.display.browser"
        }
      ]
    },
    {
      "name": "displayOverride",
      "type": "array",
      "groupKey": "pwa",
      "element": {
        "name": "displayMode",
        "type": "string"
      },
      "sortable": true
    },
    {
      "name": "orientation",
      "type": "select",
      "groupKey": "pwa",
      "options": [
        {
          "value": "any",
          "labelKey": "settings.pwa.orientation.any"
        },
        {
          "value": "natural",
          "labelKey": "settings.pwa.orientation.natural"
        },
        {
          "value": "landscape",
          "labelKey": "settings.pwa.orientation.landscape"
        },
        {
          "value": "portrait",
          "labelKey": "settings.pwa.orientation.portrait"
        },
        {
          "value": "portrait-primary",
          "labelKey": "settings.pwa.orientation.portraitPrimary"
        },
        {
          "value": "portrait-secondary",
          "labelKey": "settings.pwa.orientation.portraitSecondary"
        },
        {
          "value": "landscape-primary",
          "labelKey": "settings.pwa.orientation.landscapePrimary"
        },
        {
          "value": "landscape-secondary",
          "labelKey": "settings.pwa.orientation.landscapeSecondary"
        }
      ]
    },
    {
      "name": "pwa.icons",
      "type": "array",
      "groupKey": "pwa.icons",
      "element": {
        "name": "icon",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "src",
            "type": "string",
            "required": true
          },
          {
            "name": "sizes",
            "type": "string",
            "required": true
          },
          {
            "name": "type",
            "type": "string",
            "required": true
          },
          {
            "name": "purpose",
            "type": "string"
          }
        ]
      },
      "sortable": true
    },
    {
      "name": "pwa.screenshots",
      "type": "array",
      "groupKey": "pwa.screenshots",
      "element": {
        "name": "screenshot",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "src",
            "type": "string",
            "required": true
          },
          {
            "name": "sizes",
            "type": "string",
            "required": true
          },
          {
            "name": "type",
            "type": "string",
            "required": true
          },
          {
            "name": "label",
            "type": "string"
          },
          {
            "name": "form_factor",
            "type": "select",
            "options": [
              {
                "value": "wide",
                "labelKey": "settings.pwa.screenshot.wide"
              },
              {
                "value": "narrow",
                "labelKey": "settings.pwa.screenshot.narrow"
              }
            ]
          }
        ]
      },
      "sortable": true
    },
    {
      "name": "more",
      "type": "text",
      "widget": "json",
      "groupKey": "more"
    }
  ]
};
