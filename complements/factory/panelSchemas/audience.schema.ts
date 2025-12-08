// complements/factory/panelSchemas/audience.schema.ts

import type { PanelSchema } from '@/complements/factory/panelSchema.types';

/**
 * Panel de "Audiencias UTM"
 *
 * FDV: Providers/Utms (doc único)
 * Alineado a UtmDefinition del Campaign Center.
 */

export const AUDIENCES_PANEL_SCHEMA: PanelSchema = {
  id: 'audiencesUtm', // si ya tienes wiring con "audiences", puedes volver a "audiences"
  labelKey: 'panels.audiencesUtm.title',
  iconKey: 'audiences',
  fsCollection: 'Providers',
  fsDocId: 'Utms', // <- misma FDV que usa el Campaign Center para las UTMs
  isProvider: true,
  isAgentFDV: false,
  source: 'core',
  stage: 'published',
  access: {
    allowedRoles: ['superadmin', 'admin'],
  },
  version: 1,

  fields: [
    {
      name: 'utms',
      type: 'array',
      groupKey: 'utms',
      sortable: true,
      element: {
        name: 'utm',
        type: 'object',
        collapsible: true,
        fields: [
          // ─────────────────────────────
          // Identificación / naming
          // ─────────────────────────────

          {
            // ID técnico (slug / utm_id) → coincide con UtmDefinition.id
            name: 'id',
            type: 'string',
            required: true,
            widget: 'input',
            translatable: false,
            pattern: '^[a-zA-Z0-9._-]+$',
          },

          {
            // Nombre legible interno
            name: 'name',
            type: 'string',
            required: true,
            widget: 'input',
            translatable: false,
          },

          {
            // Descripción de la campaña / uso de esta UTM
            name: 'description',
            type: 'text',
            required: true,
            widget: 'textarea',
            translatable: false,
          },

          {
            // Estado lógico en catálogo
            name: 'status',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              { value: 'draft',    labelKey: 'utms.status.draft' },
              { value: 'active',   labelKey: 'utms.status.active' },
              { value: 'archived', labelKey: 'utms.status.archived' },
            ],
          },

          {
            // Flag operativo para activar/desactivar rápido
            name: 'active',
            type: 'boolean',
            required: false,
            widget: 'switch',
          },

          // ─────────────────────────────
          // Campos UTM core
          // ─────────────────────────────

          {
            // utm_source
            name: 'source',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              { value: 'facebook',  labelKey: 'utms.source.facebook' },
              { value: 'instagram', labelKey: 'utms.source.instagram' },
              { value: 'tiktok',    labelKey: 'utms.source.tiktok' },
              { value: 'google',    labelKey: 'utms.source.google' },
              { value: 'youtube',   labelKey: 'utms.source.youtube' },
              { value: 'linkedin',  labelKey: 'utms.source.linkedin' },
              { value: 'whatsapp',  labelKey: 'utms.source.whatsapp' },
              { value: 'email',     labelKey: 'utms.source.email' },
              { value: 'sms',       labelKey: 'utms.source.sms' },
              { value: 'QRcode',    labelKey: 'utms.source.qrcode' },
              { value: 'other',     labelKey: 'utms.source.other' },
            ],
          },

          {
            // utm_medium
            name: 'medium',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              { value: 'display',    labelKey: 'utms.medium.display' },
              { value: 'search',     labelKey: 'utms.medium.search' },
              { value: 'video',      labelKey: 'utms.medium.video' },
              { value: 'stories',    labelKey: 'utms.medium.stories' },
              { value: 'reels',      labelKey: 'utms.medium.reels' },
              { value: 'shorts',     labelKey: 'utms.medium.shorts' },
              { value: 'feed',       labelKey: 'utms.medium.feed' },
              { value: 'newsletter', labelKey: 'utms.medium.newsletter' },
              { value: 'referral',   labelKey: 'utms.medium.referral' },
              { value: 'other',      labelKey: 'utms.medium.other' },
            ],
          },

          {
            // utm_campaign
            name: 'campaign',
            type: 'string',
            required: true,
            widget: 'input',
            translatable: false,
          },

          {
            // utm_term (opcional)
            name: 'term',
            type: 'string',
            required: false,
            widget: 'input',
            translatable: false,
          },

          {
            // utm_content (opcional)
            name: 'content',
            type: 'string',
            required: false,
            widget: 'input',
            translatable: false,
          },

          // ─────────────────────────────
          // Destino + clasificación
          // ─────────────────────────────

          {
            // Path destino en la PWA: "/", "/reservas", etc.
            name: 'targetPath',
            type: 'string',
            required: true,
            widget: 'input',
            translatable: false,
          },

          {
            // Categoría de campaña (para reports)
            name: 'category',
            type: 'select',
            required: false,
            widget: 'select',
            options: [
              { value: 'sales',   labelKey: 'utms.category.sales' },
              { value: 'training',   labelKey: 'utms.category.training' },
              { value: 'support',   labelKey: 'utms.category.support' },
              { value: 'customerExperience',   labelKey: 'utms.category.customerExperience' },
              { value: 'awareness',   labelKey: 'utms.category.awareness' },
              { value: 'retargeting', labelKey: 'utms.category.retargeting' },
              { value: 'loyalty',     labelKey: 'utms.category.loyalty' },
              { value: 'promo',       labelKey: 'utms.category.promo' },
              { value: 'other',       labelKey: 'utms.category.other' },
            ],
          },

          {
            // Scope u objetivo principal
            name: 'scope',
            type: 'select',
            required: false,
            widget: 'select',
            options: [
              { value: 'traffic',   labelKey: 'utms.scope.traffic' },
              { value: 'leads',     labelKey: 'utms.scope.leads' },
              { value: 'sales',     labelKey: 'utms.scope.sales' },
              { value: 'retention', labelKey: 'utms.scope.retention' },
              { value: 'other',     labelKey: 'utms.scope.other' },
            ],
          },

          {
            // Tags libres (menos críticos, pero útiles para filtrar)
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
          // Ventana de vigencia (aquí ya son date/time)
          // ─────────────────────────────

          {
            name: 'startDate',
            type: 'date',     // ⬅️ aquí ya es date
            required: false,
            widget: 'input',  // tu FUI debería mapear type=date → <input type="date">
            translatable: false,
          },

          {
            name: 'startTime',
            type: 'time',     // ⬅️ aquí ya es time
            required: false,
            widget: 'input',  // y esto → <input type="time">
            translatable: false,
          },

          {
            name: 'endDate',
            type: 'date',
            required: false,
            widget: 'input',
            translatable: false,
          },

          {
            name: 'endTime',
            type: 'time',
            required: false,
            widget: 'input',
            translatable: false,
          },
        ],
      },
    },
  ],
};
