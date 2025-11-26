import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const I18N_FRONT_PANEL_SCHEMA: PanelSchema = {
  id: 'i18nFront',
  labelKey: 'panels.i18nFront.title',
  iconKey: 'i18n',
  fsCollection: 'Providers',
  fsDocId: 'I18nFront',
  isProvider: true,
  isAgentFDV: false,
  source: 'core',
  stage: 'published',
  access: {
    allowedRoles: ['superadmin', 'admin', 'client'],
  },
  version: 1,
  fields: [
    {
      // Lista libre de IDs de i18n
      name: 'entries',
      type: 'array',
      groupKey: 'general',
      sortable: true,
      element: {
        name: 'entry',
        type: 'object',
        collapsible: false,
        fields: [
          {
            // ID completo: scope.page.concept  (ej: "global.all.welcome")
            name: 'id',
            type: 'string',
            required: true,
            widget: 'input',
            // opcional: forzar formato <scope>.<page>.<concept>
            pattern: '^[a-z][a-z0-9]*(\\.[a-z][a-z0-9]*){1,2}$',
          },
          {
            // Texto por defecto / contenido a traducir
            name: 'value',
            type: 'text',
            widget: 'textarea',
            required: true,
            translatable: true,
          },
          {
            // Nota interna opcional para maquetador / copy
            name: 'note',
            type: 'text',
            widget: 'textarea',
            required: false,
          },
        ],
      },
    },
  ],
};
