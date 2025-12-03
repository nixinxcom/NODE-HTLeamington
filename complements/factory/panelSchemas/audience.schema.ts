import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const AUDIENCES_PANEL_SCHEMA: PanelSchema = {
  id: 'audiences',
  labelKey: 'panels.audiences.title',
  iconKey: 'audiences',
  fsCollection: 'Providers',
  fsDocId: 'Audiences',
  isProvider: true,
  // Estas audiencias NO deben ir directo al contexto del AAI
  isAgentFDV: false,
  source: 'core',
  stage: 'published',
  access: {
    allowedRoles: ['superadmin', 'admin'],
  },
  version: 1,
  fields: [
    {
      name: 'audiences',
      type: 'array',
      groupKey: 'audiences',
      element: {
        name: 'audience',
        type: 'object',
        collapsible: true,
        fields: [
          // ─────────────────────────────
          // Identificación básica
          // ─────────────────────────────
          {
            name: 'audienceId',
            type: 'string',
            required: true,
            widget: 'input',
            translatable: false,
          },
          {
            name: 'name',
            type: 'string',
            required: true,
            widget: 'input',
            translatable: false,
          },
          {
            name: 'description',
            type: 'text',
            required: false,
            widget: 'textarea',
            translatable: false,
          },

          // Tags opcionales para clasificar audiencias
          {
            name: 'tags',
            type: 'array',
            element: {
              name: 'tag',
              type: 'string',
              widget: 'input',
            },
            sortable: true,
          },

          // ─────────────────────────────
          // Metadatos para alinear con tracking (wrappers)
          // ─────────────────────────────
          {
            name: 'track',
            type: 'string',
            required: false,
            widget: 'input', // ej. "sales.cta.headphones"
          },
          {
            name: 'trackCategory',
            type: 'string',
            required: false,
            widget: 'input', // ej. "sales", "support", "nav"
          },
          {
            name: 'trigger',
            type: 'string',
            required: false,
            widget: 'input', // texto de la pieza que detonó la acción
          },
          {
            name: 'target',
            type: 'string',
            required: false,
            widget: 'input', // objetivo: "headphones", "giftcards", etc.
          },

          // ─────────────────────────────
          // Tipo de audiencia (lógica)
          // ─────────────────────────────
          {
            name: 'kind',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              {
                value: 'allUsers',
                labelKey: 'audiences.kind.allUsers',
              },
              {
                value: 'authenticated',
                labelKey: 'audiences.kind.authenticated',
              },
              {
                value: 'byRole',
                labelKey: 'audiences.kind.byRole',
              },
              {
                value: 'byUserProperty',
                labelKey: 'audiences.kind.byUserProperty',
              },
              {
                value: 'byManualUserIds',
                labelKey: 'audiences.kind.byManualUserIds',
              },
              {
                value: 'externalRef',
                labelKey: 'audiences.kind.externalRef',
              },
            ],
          },

          // ─────────────────────────────
          // Configuración según tipo
          // ─────────────────────────────

          // byRole: roles de negocio (superadmin, admin, client, enduser, etc.)
          {
            name: 'roles',
            type: 'array',
            element: {
              name: 'role',
              type: 'string',
              widget: 'input',
            },
            sortable: true,
          },

          // byUserProperty: propiedad y valores (ej. user.planType in ["premium"])
          {
            name: 'userPropertyKey',
            type: 'string',
            required: false,
            widget: 'input', // ej. "planType", "segments"
          },
          {
            name: 'userPropertyValues',
            type: 'array',
            element: {
              name: 'value',
              type: 'string',
              widget: 'input',
            },
            sortable: true,
          },

          // byManualUserIds: lista explícita de UIDs
          {
            name: 'userIds',
            type: 'array',
            element: {
              name: 'userId',
              type: 'string',
              widget: 'input',
            },
            sortable: true,
          },

          // externalRef: referencia conceptual a audiencias de Ads / FB / etc.
          {
            name: 'externalSystem',
            type: 'string',
            required: false,
            widget: 'input', // ej. "google-ads", "facebook-ads"
          },
          {
            name: 'externalAudienceId',
            type: 'string',
            required: false,
            widget: 'input', // id/nombre en el sistema externo
          },
        ],
      },
      sortable: true,
    },
  ],
};
