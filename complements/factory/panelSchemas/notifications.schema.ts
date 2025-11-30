import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const NOTIFICATIONS_PANEL_SCHEMA: PanelSchema = {
  id: "notifications",
  labelKey: "panels.notifications.title",
  iconKey: "notifications",
  fsCollection: "Providers",
  fsDocId: "Notifications",
  isProvider: true,
  isAgentFDV: true,
  source: "core",
  stage: "published",
  access: {
    allowedRoles: ["superadmin", "admin"],
  },
  version: 1,
  fields: [
    {
      name: "notifications",
      type: "array",
      groupKey: "notifications",
      element: {
        name: "notification",
        type: "object",
        collapsible: false,
        fields: [
          // ─────────────────────────────
          // Identificación y estado
          // ─────────────────────────────
          {
            name: "notificationId",
            type: "string",
            required: true,
            widget: "input",
            translatable: false,
          },
          {
            name: "enabled",
            type: "boolean",
            required: true,
          },
          {
            name: "category",
            type: "select",
            required: true,
            widget: "select",
            options: [
              {
                value: "info",
                labelKey: "notifications.category.info",
              },
              {
                value: "promo",
                labelKey: "notifications.category.promo",
              },
              {
                value: "warning",
                labelKey: "notifications.category.warning",
              },
              {
                value: "system",
                labelKey: "notifications.category.system",
              },
              {
                value: "other",
                labelKey: "notifications.category.other",
              },
            ],
          },
          {
            name: "priority",
            type: "select",
            required: false,
            widget: "select",
            options: [
              {
                value: "low",
                labelKey: "notifications.priority.low",
              },
              {
                value: "normal",
                labelKey: "notifications.priority.normal",
              },
              {
                value: "high",
                labelKey: "notifications.priority.high",
              },
            ],
          },

          // ─────────────────────────────
          // Contenido principal
          // ─────────────────────────────
          {
            name: "title",
            type: "string",
            required: true,
            widget: "input",
            translatable: true,
          },
          {
            name: "message",
            type: "text",
            required: true,
            widget: "textarea",
            translatable: true,
          },
          {
            name: "description",
            type: "text",
            required: false,
            widget: "textarea",
            translatable: true,
          },
          {
            name: "callToActionURL",
            type: "text",
            required: false,
            widget: "textarea",
            translatable: false,
          },

          // ─────────────────────────────
          // UI type (popup / badge)
          // ─────────────────────────────
          {
            name: "userInterfaceType",
            type: "select",
            required: true,
            widget: "select",
            options: [
              {
                value: "popup",
                labelKey: "notifications.uiType.popup",
              },
              {
                value: "badge",
                labelKey: "notifications.uiType.badge",
              },
              {
                value: "popupAndBadge",
                labelKey: "notifications.uiType.popupAndBadge",
              },
            ],
          },
          {
            name: "popupVariant",
            type: "select",
            required: false,
            widget: "select",
            options: [
              {
                value: "toast",
                labelKey: "notifications.popupVariant.toast",
              },
              {
                value: "modal",
                labelKey: "notifications.popupVariant.modal",
              },
              {
                value: "banner",
                labelKey: "notifications.popupVariant.banner",
              },
            ],
          },
          {
            name: "requireReadConfirmation",
            type: "boolean",
            required: true,
          },

          // ─────────────────────────────
          // Canal de entrega
          // ─────────────────────────────
          {
            name: "deliveryChannel",
            type: "select",
            required: true,
            widget: "select",
            options: [
              {
                value: "inApp",
                labelKey: "notifications.delivery.inApp",
              },
              {
                value: "push",
                labelKey: "notifications.delivery.push",
              },
              {
                value: "both",
                labelKey: "notifications.delivery.both",
              },
            ],
          },

          // ─────────────────────────────
          // Target / audiencia (config libre para backend)
          // ─────────────────────────────
          {
            name: "targetAudienceType",
            type: "select",
            required: true,
            widget: "select",
            options: [
              {
                value: "allUsers",
                labelKey: "notifications.target.allUsers",
              },
              {
                value: "authenticated",
                labelKey: "notifications.target.authenticated",
              },
              {
                value: "byRole",
                labelKey: "notifications.target.byRole",
              },
              {
                value: "bySegment",
                labelKey: "notifications.target.bySegment",
              },
              {
                value: "byUserId",
                labelKey: "notifications.target.byUserId",
              },
            ],
          },
          {
            name: "targetRoles",
            type: "multiselect",
            required: false,
            widget: "multiselect",
            options: [
              {
                value: "superadmin",
                labelKey: "notifications.target.role.superadmin",
              },
              {
                value: "admin",
                labelKey: "notifications.target.role.admin",
              },
              {
                value: "client",
                labelKey: "notifications.target.role.client",
              },
              {
                value: "enduser",
                labelKey: "notifications.target.role.enduser",
              },
            ],
          },
          {
            name: "targetAudienceSegment",  // e.g., "subscribedToNewsletter", "premiumUsers", "New Customers", etc.
            type: "string",
            required: false,
            widget: "input",
          },
          {
            name: "targetUserIds",
            type: "text",
            required: false,
            widget: "textarea",
          },

          // ─────────────────────────────
          // Calendario / scheduling básico
          // ─────────────────────────────
          {
            name: "sendDate",
            type: "date",
            required: false,
          },
          {
            name: "sendTime",
            type: "string",
            required: false,
            widget: "input",
          },
          {
            name: "expireDate",
            type: "date",
            required: false,
          },
          {
            name: "expireTime",
            type: "string",
            required: false,
            widget: "input",
          },
          {
            name: "repeat",
            type: "select",
            required: false,
            widget: "select",
            options: [
              {
                value: "none",
                labelKey: "notifications.repeat.none",
              },
              {
                value: "daily",
                labelKey: "notifications.repeat.daily",
              },
              {
                value: "weekly",
                labelKey: "notifications.repeat.weekly",
              },
              {
                value: "monthly",
                labelKey: "notifications.repeat.monthly",
              },
            ],
          },

          // ─────────────────────────────
          // Opciones de push (sonido, vibración, icono)
          // ─────────────────────────────
          {
            name: "clickAction",
            type: "string",
            required: false,
            widget: "input",
          },
          {
            name: "iconUrl",
            type: "string",
            required: false,
            widget: "input",
          },
          {
            name: "imageUrl",
            type: "string",
            required: false,
            widget: "input",
          },
          {
            name: "soundEnabled",
            type: "boolean",
            required: false,
          },
          {
            name: "soundKey",
            type: "string",
            required: false,
            widget: "input",
          },
          {
            name: "vibrationEnabled",
            type: "boolean",
            required: false,
          },
          {
            name: "vibrationPattern",
            type: "string",
            required: false,
            widget: "input",
          },

          // ─────────────────────────────
          // Media adicional (imagen / video interno)
          // ─────────────────────────────
          {
            name: "media",
            type: "array",
            element: {
              name: "mediaItem",
              type: "object",
              collapsible: false,
              fields: [
                {
                  name: "type",
                  type: "select",
                  required: false,
                  widget: "select",
                  options: [
                    {
                      value: "image",
                      labelKey: "notifications.media.type.image",
                    },
                    {
                      value: "video",
                      labelKey: "notifications.media.type.video",
                    },
                  ],
                },
                {
                  name: "url",
                  type: "string",
                  required: true,
                  widget: "input",
                },
                {
                  name: "caption",
                  type: "text",
                  required: false,
                  widget: "textarea",
                  translatable: true,
                },
              ],
            },
            sortable: true,
          },
        ],
      },
      sortable: true,
    },
  ],
};
