import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const NOTIFICATIONS_PANEL_SCHEMA: PanelSchema = {
  id: 'notifications',
  labelKey: 'panels.notifications.title',
  iconKey: 'notifications',
  fsCollection: 'Providers',
  fsDocId: 'Notifications',
  isProvider: true,
  isAgentFDV: true,
  source: 'core',
  stage: 'published',
  access: {
    allowedRoles: ['superadmin', 'admin'],
  },
  version: 1,
  fields: [
    {
      name: 'notifications',
      type: 'array',
      groupKey: 'notifications',
      element: {
        name: 'notification',
        type: 'object',
        collapsible: false,
        fields: [
          // ─────────────────────────────
          // Identificación básica
          // ─────────────────────────────
          {
            name: 'notificationId',
            type: 'string',
            required: true,
            widget: 'input',
            translatable: false,
          },

          // ─────────────────────────────
          // Contenido principal
          // ─────────────────────────────
          {
            name: 'category',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              {
                value: 'info',
                labelKey: 'notifications.category.info',
              },
              {
                value: 'promo',
                labelKey: 'notifications.category.promo',
              },
              {
                value: 'warning',
                labelKey: 'notifications.category.warning',
              },
              {
                value: 'system',
                labelKey: 'notifications.category.system',
              },
              {
                value: 'other',
                labelKey: 'notifications.category.other',
              },
            ],
          },
          {
            name: 'title',
            type: 'string',
            required: true,
            widget: 'input',
            translatable: true,
          },
          {
            name: 'message',
            type: 'text',
            required: true,
            widget: 'textarea',
            translatable: true,
          },
          {
            name: 'description',
            type: 'text',
            required: false,
            widget: 'textarea',
            translatable: true,
          },

          // URLs / Call to Actions
          {
            name: 'callToActionURL',
            type: 'text',
            required: false,
            widget: 'textarea',
            translatable: false,
          },
          {
            name: 'clickAction',
            type: 'string',
            required: false,
            widget: 'input',
          },

          // ─────────────────────────────
          // Iconos / imágenes
          // ─────────────────────────────
          {
            name: 'iconUrl',
            type: 'string',
            required: false,
            widget: 'input',
          },
          {
            name: 'imageUrl',
            type: 'string',
            required: false,
            widget: 'input',
          },

          // ─────────────────────────────
          // Sonido y vibración
          // ─────────────────────────────
          {
            name: 'soundEnabled',
            type: 'boolean',
            required: false,
          },
          {
            name: 'soundKey',
            type: 'string',
            required: false,
            widget: 'input',
          },
          {
            name: 'vibrationEnabled',
            type: 'boolean',
            required: false,
          },
          {
            name: 'vibrationPattern',
            type: 'string',
            required: false,
            widget: 'input',
          },

          // ─────────────────────────────
          // Media adicional (imagen / video interno)
          // ─────────────────────────────
          {
            name: 'media',
            type: 'array',
            element: {
              name: 'mediaItem',
              type: 'object',
              collapsible: false,
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  required: false,
                  widget: 'select',
                  options: [
                    {
                      value: 'image',
                      labelKey: 'notifications.media.type.image',
                    },
                    {
                      value: 'video',
                      labelKey: 'notifications.media.type.video',
                    },
                  ],
                },
                {
                  name: 'url',
                  type: 'string',
                  required: true,
                  widget: 'input',
                },
                {
                  name: 'caption',
                  type: 'text',
                  required: false,
                  widget: 'textarea',
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
