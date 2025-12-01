import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const STRATEGIES_PANEL_SCHEMA: PanelSchema = {
  id: 'strategies',
  labelKey: 'panels.strategies.title',
  iconKey: 'strategies',
  fsCollection: 'Providers',
  fsDocId: 'Strategies',
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
      name: 'strategies',
      type: 'array',
      groupKey: 'strategies',
      element: {
        name: 'strategy',
        type: 'object',
        collapsible: true, // ahora cada estrategia se puede colapsar
        fields: [
          // ─────────────────────────────
          // Identificación básica
          // ─────────────────────────────
          {
            name: 'strategyId',
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

          // Tags opcionales para clasificar estrategias
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
          // Estado operativo de la estrategia
          // (no es campaña, pero igual puedes versionar)
          // ─────────────────────────────
          {
            name: 'status',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              { value: 'draft', labelKey: 'strategies.status.draft' },
              { value: 'active', labelKey: 'strategies.status.active' },
              { value: 'paused', labelKey: 'strategies.status.paused' },
              { value: 'disabled', labelKey: 'strategies.status.disabled' },
            ],
          },

          // ─────────────────────────────
          // Comportamiento de entrega
          // ─────────────────────────────
          {
            name: 'priority',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              { value: 'low', labelKey: 'strategies.priority.low' },
              { value: 'normal', labelKey: 'strategies.priority.normal' },
              { value: 'high', labelKey: 'strategies.priority.high' },
            ],
          },
          {
            name: 'uiType',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              { value: 'popup', labelKey: 'strategies.uiType.popup' },
              { value: 'toast', labelKey: 'strategies.uiType.toast' },
              { value: 'banner', labelKey: 'strategies.uiType.banner' },
              { value: 'badge', labelKey: 'strategies.uiType.badge' },
              { value: 'silent', labelKey: 'strategies.uiType.silent' },
            ],
          },
          {
            name: 'deliveryChannel',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              { value: 'inApp', labelKey: 'strategies.delivery.inApp' },
              { value: 'push', labelKey: 'strategies.delivery.push' },
              { value: 'both', labelKey: 'strategies.delivery.both' },
            ],
          },
          {
            name: 'requireReadConfirmation',
            type: 'boolean',
            required: false,
          },
        ],
      },
      sortable: true,
    },
  ],
};
