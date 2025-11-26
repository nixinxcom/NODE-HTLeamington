import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const BRANDING_PANEL_SCHEMA: PanelSchema = {
  "id": "branding",
  "labelKey": "panels.branding.title",
  "iconKey": "branding",
  "fsCollection": "Providers",
  "fsDocId": "Branding",
  "isProvider": true,
  "isAgentFDV": true,
  "source": "core",
  "stage": "published",
  "access": {
    "allowedRoles": [
      "superadmin",
      "admin",
      "client"
    ]
  },
  "version": 1,
  "fields": [
    {
      "name": "legalName",
      "type": "string",
      "required": true,
      "groupKey": "company",
    },
    {
      "name": "brandName",
      "type": "string",
      "required": true,
      "groupKey": "company"
    },
    {
      "name": "logo",
      "type": "string",
      "required": true,
      "widget": "image",
      "groupKey": "company"
    },
    {
      "name": "tagline",
      "type": "text",
      "required": false,
      "widget": "textarea",
      "groupKey": "company"
    },
    {
      "name": "contact.website",
      "type": "string",
      "widget": "input",
      "groupKey": "company"
    },
    {
      "name": "contact.phone",
      "type": "string",
      "widget": "input",
      "groupKey": "company"
    },
    {
      "name": "contact.email",
      "type": "string",
      "widget": "input",
      "groupKey": "company"
    },
    {
      "name": "contact.googleProfileURL",
      "type": "string",
      "widget": "input",
      "groupKey": "company"
    },
    {
      "name": "contact.address.street",
      "type": "string",
      "groupKey": "company"
    },
    {
      "name": "contact.address.number",
      "type": "string",
      "groupKey": "company"
    },
    {
      "name": "contact.address.interior",
      "type": "string",
      "groupKey": "company"
    },
    {
      "name": "contact.address.city",
      "type": "string",
      "groupKey": "company"
    },
    {
      "name": "contact.address.state",
      "type": "string",
      "groupKey": "company"
    },
    {
      "name": "contact.address.zip",
      "type": "string",
      "groupKey": "company"
    },
    {
      "name": "contact.address.country",
      "type": "string",
      "groupKey": "company"
    },
    {
      "name": "contact.address.latitud",
      "type": "number",
      "min": -90,
      "max": 90,
      "groupKey": "company"
    },
    {
      "name": "contact.address.longitude",
      "type": "number",
      "min": -180,
      "max": 180,
      "groupKey": "company"
    },
    {
      "name": "terms",
      "type": "text",
      "widget": "textarea",
      "groupKey": "company"
    },
    {
      "name": "privacy",
      "type": "text",
      "widget": "textarea",
      "groupKey": "company"
    },
    {
      "name": "mission",
      "type": "text",
      "widget": "textarea",
      "groupKey": "company"
    },
    {
      "name": "vision",
      "type": "text",
      "widget": "textarea",
      "groupKey": "company"
    },
    {
      "name": "values",
      "type": "array",
      "groupKey": "company",
      "element": {
        "name": "value",
        "type": "string",
        "required": true,
        "widget": "input"
      },
      "sortable": true
    },
    {
      "name": "branches",
      "type": "array",
      "groupKey": "company",
      "element": {
        "name": "branch",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "name",
            "type": "string",
            "required": true
          },
          {
            "name": "url",
            "type": "string",
            "required": true
          },
          {
            "name": "icon",
            "type": "string",
            "required": false
          }
        ]
      },
      "sortable": true
    },
    {
      "name": "name",
      "type": "string",
      "required": true,
      "groupKey": "agentAI"
    },
    {
      "name": "displayName",
      "type": "string",
      "required": true,
      "groupKey": "agentAI"
    },
    {
      "name": "role",
      "type": "text",
      "required": true,
      "widget": "textarea",
      "groupKey": "agentAI"
    },
    {
      "name": "description",
      "type": "text",
      "required": true,
      "widget": "textarea",
      "groupKey": "agentAI"
    },
    {
      "name": "tone",
      "type": "string",
      "required": true,
      "groupKey": "agentAI"
    },
    {
      "name": "greeting",
      "type": "text",
      "required": true,
      "widget": "textarea",
      "groupKey": "agentAI"
    },
    {
      "name": "farewell",
      "type": "text",
      "required": true,
      "widget": "textarea",
      "groupKey": "agentAI"
    },
    {
      "name": "unknown_response",
      "type": "text",
      "required": true,
      "widget": "textarea",
      "groupKey": "agentAI"
    },
    {
      "name": "fallback_when_unsure",
      "type": "text",
      "required": true,
      "widget": "textarea",
      "groupKey": "agentAI"
    },
    {
      "name": "socials",
      "type": "array",
      "groupKey": "socials",
      "element": {
        "name": "social",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "name",
            "type": "string",
            "required": true
          },
          {
            "name": "url",
            "type": "string",
            "required": true
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "icon",
            "type": "string"
          }
        ]
      },
      "sortable": true
    },
    {
      "name": "platforms",
      "type": "array",
      "groupKey": "platforms",
      "element": {
        "name": "platform",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "name",
            "type": "string",
            "required": true
          },
          {
            "name": "url",
            "type": "string",
            "required": true
          },
          {
            "name": "icon",
            "type": "string"
          }
        ]
      },
      "sortable": true
    },
    {
      "name": "address.intNumber",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "address.extNumber",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "address.street",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "address.city",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "address.state",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "address.zip",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "address.country",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "address.lat",
      "type": "number",
      "min": -90,
      "max": 90,
      "groupKey": "contact"
    },
    {
      "name": "address.lng",
      "type": "number",
      "min": -180,
      "max": 180,
      "groupKey": "contact"
    },
    {
      "name": "address.zoom",
      "type": "number",
      "min": 1,
      "max": 22,
      "groupKey": "contact"
    },
    {
      "name": "phone",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "email",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "whatsapp",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "map",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "directions",
      "type": "text",
      "widget": "textarea",
      "groupKey": "contact"
    },
    {
      "name": "google",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "googleMaps",
      "type": "string",
      "groupKey": "contact"
    },
    {
      "name": "schedule",
      "type": "array",
      "groupKey": "schedule",
      "element": {
        "name": "daySlot",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "day",
            "type": "string",
            "required": true
          },
          {
            "name": "open",
            "type": "string"
          },
          {
            "name": "close",
            "type": "string"
          },
          {
            "name": "closed",
            "type": "boolean"
          }
        ]
      },
      "sortable": true
    },
    {
      "name": "holidays",
      "type": "array",
      "groupKey": "holidays",
      "element": {
        "name": "holiday",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "name",
            "type": "string",
            "required": true
          },
          {
            "name": "date",
            "type": "string",
            "required": true
          }
        ]
      }
    },
    {
      "name": "products",
      "type": "array",
      "groupKey": "products",
      "element": {
        "name": "product",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "prodName",
            "type": "string",
            "required": true
          },
          {
            "name": "description",
            "type": "text",
            "widget": "textarea"
          },
          {
            "name": "price",
            "type": "number",
            "min": 0,
            "required": true
          },
          {
            "name": "image",
            "type": "string",
            "widget": "image"
          },
          {
            "name": "video",
            "type": "string"
          },
          {
            "name": "gallery",
            "type": "array",
            "element": {
              "name": "imageUrl",
              "type": "string",
              "widget": "image"
            }
          },
          {
            "name": "url",
            "type": "string"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "subcategory",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "services",
      "type": "array",
      "groupKey": "services",
      "element": {
        "name": "service",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "servName",
            "type": "string",
            "required": true
          },
          {
            "name": "description",
            "type": "text",
            "widget": "textarea"
          },
          {
            "name": "price",
            "type": "number",
            "min": 0,
            "required": true
          },
          {
            "name": "image",
            "type": "string",
            "widget": "image"
          },
          {
            "name": "video",
            "type": "string"
          },
          {
            "name": "gallery",
            "type": "array",
            "element": {
              "name": "imageUrl",
              "type": "string",
              "widget": "image"
            }
          },
          {
            "name": "url",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "events",
      "type": "array",
      "groupKey": "events",
      "element": {
        "name": "event",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "eventName",
            "type": "string",
            "required": true
          },
          {
            "name": "description",
            "type": "text",
            "widget": "textarea"
          },
          // 🔹 Fecha principal del evento (ISO recomendado: YYYY-MM-DD)
          {
            "name": "date",
            "type": "string",
            "required": true
          },
          // 🔹 Horario opcional (texto libre: "22:00", "9pm–2am", etc.)
          {
            "name": "startTime",
            "type": "string"
          },
          {
            "name": "endTime",
            "type": "string"
          },
          {
            "name": "price",
            "type": "number",
            "min": 0,
            "required": true
          },
          {
            "name": "image",
            "type": "string",
            "widget": "image"
          },
          {
            "name": "video",
            "type": "string"
          },
          {
            "name": "gallery",
            "type": "array",
            "element": {
              "name": "imageUrl",
              "type": "string",
              "widget": "image"
            }
          },
          {
            "name": "url",
            "type": "string"
          },
          {
            "name": "category",
            "type": "string"
          },
          {
            "name": "subcategory",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "more",
      "type": "text",
      "widget": "json",
      "groupKey": "more"
    }
  ]
};
