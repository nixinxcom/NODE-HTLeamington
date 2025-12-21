import type { PanelSchema } from '@/complements/factory/panelSchema.types';

/**
 * Servicios (NO productos)
 * - Flexible para catálogo + booking + CTAs
 * - Sin tallas/colores/variantes de inventario (eso es para Products)
 * - Incluye disponibilidad semanal + overrides por fecha
 */
export const SERVICES_PANEL_SCHEMA: PanelSchema = {
  id: 'services',
  labelKey: 'panels.services.title',
  iconKey: 'services',
  fsCollection: 'Providers',
  fsDocId: 'Services',
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
      name: 'services',
      type: 'array',
      groupKey: 'services',
      sortable: true,
      element: {
        name: 'service',
        type: 'object',
        collapsible: false,
        fields: [
          // ─────────────────────────────
          // Identidad
          // ─────────────────────────────
          {
            name: 'serviceId',
            type: 'string',
            required: true,
            widget: 'input',
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            widget: 'select',
            options: [
              { value: 'draft', labelKey: 'services.status.draft' },
              { value: 'active', labelKey: 'services.status.active' },
              { value: 'archived', labelKey: 'services.status.archived' },
            ],
          },
          {
            name: 'name',
            type: 'string',
            required: true,
            widget: 'input',
            translatable: true,
          },
          {
            name: 'slug',
            type: 'string',
            required: false,
            widget: 'input',
            pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
          },
          {
            name: 'summary',
            type: 'text',
            required: false,
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

          // ─────────────────────────────
          // Categorías / tags (para filtros + comparativos)
          // ─────────────────────────────
          {
            name: 'categories',
            type: 'array',
            sortable: true,
            element: {
              name: 'category',
              type: 'string',
              widget: 'input',
            },
          },
          {
            name: 'tags',
            type: 'array',
            sortable: true,
            element: {
              name: 'tag',
              type: 'string',
              widget: 'input',
            },
          },

          // ─────────────────────────────
          // Nivel de servicio (Premium / Oro / etc)
          // ─────────────────────────────
          {
            name: 'serviceLevel',
            type: 'select',
            required: false,
            widget: 'select',
            options: [
              { value: 'standard', labelKey: 'services.level.standard' },
              { value: 'premium', labelKey: 'services.level.premium' },
              { value: 'gold', labelKey: 'services.level.gold' },
              { value: 'platinum', labelKey: 'services.level.platinum' },
              { value: 'custom', labelKey: 'services.level.custom' },
            ],
          },
          {
            name: 'customLevelLabel',
            type: 'string',
            required: false,
            widget: 'input',
            translatable: true,
          },

          // ─────────────────────────────
          // Media (slider / galería)
          // AutoMediaCarousel consume: { kind, src, alt?, durationMs?, href?, poster?, ... }
          // ─────────────────────────────
          {
            name: 'media',
            type: 'object',
            fields: [
              {
                name: 'cover',
                type: 'string',
                required: false,
                widget: 'upload',
                accept: ['image/*', 'video/*'],
                uploadConfig: {
                  storageFolder: 'services/media',
                },
              },
              {
                name: 'slider',
                type: 'array',
                sortable: true,
                element: {
                  name: 'slide',
                  type: 'object',
                  collapsible: false,
                  fields: [
                    {
                      name: 'kind',
                      type: 'select',
                      widget: 'select',
                      required: true,
                      options: [
                        { value: 'image', labelKey: 'media.kind.image' },
                        { value: 'gif', labelKey: 'media.kind.gif' },
                        { value: 'video', labelKey: 'media.kind.video' },
                      ],
                    },
                    {
                      name: 'src',
                      type: 'string',
                      required: true,
                      widget: 'upload',
                      accept: ['image/*', 'video/*'],
                      uploadConfig: {
                        storageFolder: 'services/media',
                      },
                    },
                    {
                      name: 'alt',
                      type: 'string',
                      required: false,
                      widget: 'input',
                      translatable: true,
                    },
                    {
                      name: 'label',
                      type: 'string',
                      required: false,
                      widget: 'input',
                      translatable: true,
                    },
                    {
                      name: 'href',
                      type: 'string',
                      required: false,
                      widget: 'input',
                    },
                    {
                      name: 'target',
                      type: 'select',
                      required: false,
                      widget: 'select',
                      options: [
                        { value: '_self', labelKey: 'media.target.self' },
                        { value: '_blank', labelKey: 'media.target.blank' },
                      ],
                    },
                    {
                      name: 'poster',
                      type: 'string',
                      required: false,
                      widget: 'upload',
                      accept: ['image/*'],
                      uploadConfig: {
                        storageFolder: 'services/media',
                      },
                    },
                    {
                      name: 'durationMs',
                      type: 'number',
                      required: false,
                      widget: 'input',
                      min: 0,
                    },
                    {
                      name: 'videoLoop',
                      type: 'boolean',
                      required: false,
                    },
                    {
                      name: 'videoMuted',
                      type: 'boolean',
                      required: false,
                    },
                  ],
                },
              },
              {
                name: 'gallery',
                type: 'array',
                sortable: true,
                element: {
                  name: 'mediaItem',
                  type: 'object',
                  collapsible: false,
                  fields: [
                    {
                      name: 'kind',
                      type: 'select',
                      widget: 'select',
                      required: true,
                      options: [
                        { value: 'image', labelKey: 'media.kind.image' },
                        { value: 'gif', labelKey: 'media.kind.gif' },
                        { value: 'video', labelKey: 'media.kind.video' },
                      ],
                    },
                    {
                      name: 'src',
                      type: 'string',
                      required: true,
                      widget: 'upload',
                      accept: ['image/*', 'video/*'],
                      uploadConfig: {
                        storageFolder: 'services/media',
                      },
                    },
                    {
                      name: 'alt',
                      type: 'string',
                      required: false,
                      widget: 'input',
                      translatable: true,
                    },
                  ],
                },
              },
            ],
          },

          // ─────────────────────────────
          // Links
          // ─────────────────────────────
          {
            name: 'links',
            type: 'array',
            sortable: true,
            element: {
              name: 'link',
              type: 'object',
              collapsible: false,
              fields: [
                {
                  name: 'label',
                  type: 'string',
                  required: true,
                  widget: 'input',
                  translatable: true,
                },
                {
                  name: 'url',
                  type: 'string',
                  required: true,
                  widget: 'input',
                },
                {
                  name: 'type',
                  type: 'select',
                  required: false,
                  widget: 'select',
                  options: [
                    { value: 'website', labelKey: 'services.link.website' },
                    { value: 'booking', labelKey: 'services.link.booking' },
                    { value: 'menu', labelKey: 'services.link.menu' },
                    { value: 'brochure', labelKey: 'services.link.brochure' },
                    { value: 'other', labelKey: 'services.link.other' },
                  ],
                },
              ],
            },
          },

          // ─────────────────────────────
          // Paquetes / niveles internos (opcional)
          // ─────────────────────────────
          {
            name: 'packages',
            type: 'array',
            sortable: true,
            element: {
              name: 'package',
              type: 'object',
              collapsible: false,
              fields: [
                {
                  name: 'packageId',
                  type: 'string',
                  required: true,
                  widget: 'input',
                },
                {
                  name: 'name',
                  type: 'string',
                  required: true,
                  widget: 'input',
                  translatable: true,
                },
                {
                  name: 'description',
                  type: 'text',
                  required: false,
                  widget: 'textarea',
                  translatable: true,
                },
                {
                  name: 'durationMinutes',
                  type: 'number',
                  required: false,
                  min: 0,
                },
                {
                  name: 'price',
                  type: 'number',
                  required: false,
                  min: 0,
                },
              ],
            },
          },

          // ─────────────────────────────
          // Precio / cobro
          // ─────────────────────────────
          {
            name: 'pricing',
            type: 'object',
            fields: [
              {
                name: 'priceType',
                type: 'select',
                required: false,
                widget: 'select',
                options: [
                  { value: 'fixed', labelKey: 'services.price.fixed' },
                  { value: 'startingAt', labelKey: 'services.price.startingAt' },
                  { value: 'quote', labelKey: 'services.price.quote' },
                  { value: 'free', labelKey: 'services.price.free' },
                  { value: 'subscription', labelKey: 'services.price.subscription' },
                ],
              },
              {
                name: 'currency',
                type: 'string',
                required: false,
                widget: 'input',
              },
              {
                name: 'basePrice',
                type: 'number',
                required: false,
                min: 0,
              },
              {
                name: 'unit',
                type: 'select',
                required: false,
                widget: 'select',
                options: [
                  { value: 'per_session', labelKey: 'services.unit.perSession' },
                  { value: 'per_hour', labelKey: 'services.unit.perHour' },
                  { value: 'per_day', labelKey: 'services.unit.perDay' },
                  { value: 'per_person', labelKey: 'services.unit.perPerson' },
                  { value: 'per_booking', labelKey: 'services.unit.perBooking' },
                  { value: 'per_month', labelKey: 'services.unit.perMonth' },
                ],
              },
              {
                name: 'taxIncluded',
                type: 'boolean',
                required: false,
              },
              {
                name: 'depositRequired',
                type: 'boolean',
                required: false,
              },
              {
                name: 'depositAmount',
                type: 'number',
                required: false,
                min: 0,
              },
            ],
          },

          // ─────────────────────────────
          // Duración / buffers
          // ─────────────────────────────
          {
            name: 'duration',
            type: 'object',
            fields: [
              {
                name: 'durationMinutes',
                type: 'number',
                required: false,
                min: 0,
              },
              {
                name: 'bufferBeforeMinutes',
                type: 'number',
                required: false,
                min: 0,
              },
              {
                name: 'bufferAfterMinutes',
                type: 'number',
                required: false,
                min: 0,
              },
            ],
          },

          // ─────────────────────────────
          // Disponibilidad / booking
          // ─────────────────────────────
          {
            name: 'availability',
            type: 'object',
            fields: [
              {
                name: 'timezone',
                type: 'string',
                required: false,
                widget: 'input',
              },
              {
                name: 'bookingMode',
                type: 'select',
                required: false,
                widget: 'select',
                options: [
                  { value: 'none', labelKey: 'services.booking.none' },
                  { value: 'request', labelKey: 'services.booking.request' },
                  { value: 'instant', labelKey: 'services.booking.instant' },
                ],
              },
              {
                name: 'leadTimeHours',
                type: 'number',
                required: false,
                min: 0,
              },
              {
                name: 'maxAdvanceDays',
                type: 'number',
                required: false,
                min: 0,
              },
              {
                name: 'capacityPerSlot',
                type: 'number',
                required: false,
                min: 1,
              },
              {
                name: 'weeklySchedule',
                type: 'array',
                sortable: true,
                element: {
                  name: 'day',
                  type: 'object',
                  collapsible: false,
                  fields: [
                    {
                      name: 'dayOfWeek',
                      type: 'select',
                      required: true,
                      widget: 'select',
                      options: [
                        { value: 'mon', labelKey: 'days.mon' },
                        { value: 'tue', labelKey: 'days.tue' },
                        { value: 'wed', labelKey: 'days.wed' },
                        { value: 'thu', labelKey: 'days.thu' },
                        { value: 'fri', labelKey: 'days.fri' },
                        { value: 'sat', labelKey: 'days.sat' },
                        { value: 'sun', labelKey: 'days.sun' },
                      ],
                    },
                    {
                      name: 'enabled',
                      type: 'boolean',
                      required: false,
                    },
                    {
                      name: 'intervals',
                      type: 'array',
                      sortable: true,
                      element: {
                        name: 'interval',
                        type: 'object',
                        collapsible: false,
                        fields: [
                          {
                            name: 'start',
                            type: 'time',
                            required: true,
                          },
                          {
                            name: 'end',
                            type: 'time',
                            required: true,
                          },
                          {
                            name: 'capacity',
                            type: 'number',
                            required: false,
                            min: 1,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                name: 'dateOverrides',
                type: 'array',
                sortable: true,
                element: {
                  name: 'override',
                  type: 'object',
                  collapsible: false,
                  fields: [
                    {
                      name: 'date',
                      type: 'date',
                      required: true,
                    },
                    {
                      name: 'closed',
                      type: 'boolean',
                      required: false,
                    },
                    {
                      name: 'reason',
                      type: 'string',
                      required: false,
                      widget: 'input',
                      translatable: true,
                    },
                    {
                      name: 'intervals',
                      type: 'array',
                      sortable: true,
                      element: {
                        name: 'interval',
                        type: 'object',
                        collapsible: false,
                        fields: [
                          {
                            name: 'start',
                            type: 'time',
                            required: true,
                          },
                          {
                            name: 'end',
                            type: 'time',
                            required: true,
                          },
                          {
                            name: 'capacity',
                            type: 'number',
                            required: false,
                            min: 1,
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                name: 'blackoutDates',
                type: 'array',
                sortable: true,
                element: {
                  name: 'blackout',
                  type: 'object',
                  collapsible: false,
                  fields: [
                    {
                      name: 'date',
                      type: 'date',
                      required: true,
                    },
                    {
                      name: 'reason',
                      type: 'string',
                      required: false,
                      widget: 'input',
                      translatable: true,
                    },
                  ],
                },
              },
            ],
          },

          // ─────────────────────────────
          // Ubicación (si aplica)
          // ─────────────────────────────
          {
            name: 'location',
            type: 'object',
            fields: [
              {
                name: 'mode',
                type: 'select',
                required: false,
                widget: 'select',
                options: [
                  { value: 'on_site', labelKey: 'services.location.onSite' },
                  { value: 'remote', labelKey: 'services.location.remote' },
                  { value: 'at_customer', labelKey: 'services.location.atCustomer' },
                  { value: 'hybrid', labelKey: 'services.location.hybrid' },
                ],
              },
              {
                name: 'address',
                type: 'text',
                required: false,
                widget: 'textarea',
                translatable: true,
              },
              {
                name: 'notes',
                type: 'text',
                required: false,
                widget: 'textarea',
                translatable: true,
              },
            ],
          },

          // ─────────────────────────────
          // Specs comparables (para tablas/comparativos)
          // ─────────────────────────────
          {
            name: 'specs',
            type: 'array',
            sortable: true,
            element: {
              name: 'spec',
              type: 'object',
              collapsible: false,
              fields: [
                {
                  name: 'key',
                  type: 'string',
                  required: true,
                  widget: 'input',
                },
                {
                  name: 'label',
                  type: 'string',
                  required: true,
                  widget: 'input',
                  translatable: true,
                },
                {
                  name: 'value',
                  type: 'string',
                  required: true,
                  widget: 'input',
                  translatable: true,
                },
                {
                  name: 'unit',
                  type: 'string',
                  required: false,
                  widget: 'input',
                },
                {
                  name: 'comparable',
                  type: 'boolean',
                  required: false,
                },
                {
                  name: 'order',
                  type: 'number',
                  required: false,
                  min: 0,
                },
              ],
            },
          },

          // ─────────────────────────────
          // CTAs + flags
          // ─────────────────────────────
          {
            name: 'cta',
            type: 'object',
            fields: [
              {
                name: 'primaryLabel',
                type: 'string',
                required: false,
                widget: 'input',
                translatable: true,
              },
              {
                name: 'primaryAction',
                type: 'select',
                required: false,
                widget: 'select',
                options: [
                  { value: 'book', labelKey: 'services.cta.book' },
                  { value: 'call', labelKey: 'services.cta.call' },
                  { value: 'whatsapp', labelKey: 'services.cta.whatsapp' },
                  { value: 'email', labelKey: 'services.cta.email' },
                  { value: 'openLink', labelKey: 'services.cta.openLink' },
                ],
              },
              {
                name: 'primaryUrl',
                type: 'string',
                required: false,
                widget: 'input',
              },
              {
                name: 'secondaryLabel',
                type: 'string',
                required: false,
                widget: 'input',
                translatable: true,
              },
              {
                name: 'secondaryUrl',
                type: 'string',
                required: false,
                widget: 'input',
              },
            ],
          },
          {
            name: 'flags',
            type: 'object',
            fields: [
              { name: 'featured', type: 'boolean' },
              { name: 'allowFavorites', type: 'boolean' },
              { name: 'allowCart', type: 'boolean' },
              { name: 'allowCompare', type: 'boolean' },
              { name: 'allowReviews', type: 'boolean' },
            ],
          },

          // ─────────────────────────────
          // Relaciones
          // ─────────────────────────────
          {
            name: 'relatedServiceIds',
            type: 'array',
            sortable: true,
            element: {
              name: 'serviceId',
              type: 'string',
              widget: 'input',
            },
          },
          {
            name: 'relatedProductIds',
            type: 'array',
            sortable: true,
            element: {
              name: 'productId',
              type: 'string',
              widget: 'input',
            },
          },
        ],
      },
    },
  ],
};
