import type { PanelSchema } from '@/complements/factory/panelSchema.types';

/**
 * Products (catálogo)
 *
 * Se guarda como Provider (FDV) para que el nodo pueda hidratarlo desde Firestore.
 * Ruta: Providers/Products
 *
 * Nota: si el catálogo crece muchísimo, migra a colección "Products" por doc.
 */
export const PRODUCTS_PANEL_SCHEMA: PanelSchema = {
  id: 'products',
  labelKey: 'panels.products.title',
  iconKey: 'products',
  fsCollection: 'Providers',
  fsDocId: 'Products',
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
      name: 'products',
      type: 'array',
      groupKey: 'products',
      sortable: true,
      widget: 'array',
      element: {
        name: 'product',
        type: 'object',
        collapsible: true,
        fields: [
          // ─────────────────────────────
          // Identidad / status
          // ─────────────────────────────
          {
            name: 'productId',
            type: 'string',
            required: true,
            groupKey: 'id',
            widget: 'input',
          },
          {
            name: 'sku',
            type: 'string',
            required: false,
            groupKey: 'id',
            widget: 'input',
          },
          {
            name: 'slug',
            type: 'string',
            required: false,
            groupKey: 'id',
            widget: 'input',
            pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            groupKey: 'id',
            widget: 'select',
            options: [
              { value: 'draft', labelKey: 'products.status.draft' },
              { value: 'active', labelKey: 'products.status.active' },
              { value: 'archived', labelKey: 'products.status.archived' },
            ],
          },
          {
            name: 'visibility',
            type: 'select',
            required: false,
            groupKey: 'id',
            widget: 'select',
            options: [
              { value: 'public', labelKey: 'products.visibility.public' },
              { value: 'private', labelKey: 'products.visibility.private' },
              { value: 'unlisted', labelKey: 'products.visibility.unlisted' },
            ],
          },
          {
            name: 'createdAt',
            type: 'date',
            required: false,
            groupKey: 'id',
          },
          {
            name: 'updatedAt',
            type: 'date',
            required: false,
            groupKey: 'id',
          },

          // ─────────────────────────────
          // Contenido
          // ─────────────────────────────
          {
            name: 'title',
            type: 'string',
            required: true,
            groupKey: 'content',
            widget: 'input',
            translatable: true,
          },
          {
            name: 'subtitle',
            type: 'string',
            required: false,
            groupKey: 'content',
            widget: 'input',
            translatable: true,
          },
          {
            name: 'shortDescription',
            type: 'text',
            required: false,
            groupKey: 'content',
            widget: 'textarea',
            translatable: true,
          },
          {
            name: 'description',
            type: 'text',
            required: false,
            groupKey: 'content',
            widget: 'markdown',
            translatable: true,
          },
          {
            name: 'brand',
            type: 'string',
            required: false,
            groupKey: 'content',
            widget: 'input',
          },
          {
            name: 'tags',
            type: 'array',
            required: false,
            groupKey: 'content',
            widget: 'tags',
            element: {
              name: 'tag',
              type: 'string',
            },
            sortable: true,
          },
          {
            name: 'categories',
            type: 'array',
            required: false,
            groupKey: 'content',
            widget: 'tags',
            element: {
              name: 'category',
              type: 'string',
            },
            sortable: true,
          },

          // ─────────────────────────────
          // Media (slider + galería + video)
          // ─────────────────────────────
          {
            name: 'slider',
            type: 'array',
            required: false,
            groupKey: 'media',
            sortable: true,
            element: {
              name: 'slide',
              type: 'object',
              collapsible: true,
              fields: [
                {
                  name: 'kind',
                  type: 'select',
                  required: true,
                  widget: 'select',
                  options: [
                    { value: 'image', labelKey: 'products.media.kind.image' },
                    { value: 'gif', labelKey: 'products.media.kind.gif' },
                    { value: 'video', labelKey: 'products.media.kind.video' },
                  ],
                },
                {
                  name: 'storagePath',
                  type: 'string',
                  required: false,
                  widget: 'upload',
                  accept: ['image/*', 'video/*'],
                  uploadConfig: {
                    storageFolder: 'products/media',
                    fileNamePrefix: 'media_',
                  },
                },
                {
                  name: 'src',
                  type: 'string',
                  required: false,
                  widget: 'input',
                },
                {
                  name: 'posterStoragePath',
                  type: 'string',
                  required: false,
                  widget: 'upload',
                  accept: 'image/*',
                  uploadConfig: {
                    storageFolder: 'products/media',
                    fileNamePrefix: 'poster_',
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
                  name: 'caption',
                  type: 'text',
                  required: false,
                  widget: 'textarea',
                  translatable: true,
                },
                {
                  name: 'durationMs',
                  type: 'number',
                  required: false,
                  widget: 'input',
                  min: 0,
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
                    { value: '_self', labelKey: 'products.link.self' },
                    { value: '_blank', labelKey: 'products.link.blank' },
                  ],
                },
              ],
            },
          },
          {
            name: 'gallery',
            type: 'array',
            required: false,
            groupKey: 'media',
            widget: 'array',
            sortable: true,
            element: {
              name: 'image',
              type: 'string',
              widget: 'upload',
              accept: 'image/*',
              uploadConfig: {
                storageFolder: 'products/gallery',
                fileNamePrefix: 'img_',
              },
            },
          },
          {
            name: 'videos',
            type: 'array',
            required: false,
            groupKey: 'media',
            sortable: true,
            element: {
              name: 'video',
              type: 'object',
              collapsible: true,
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: false,
                  widget: 'select',
                  options: [
                    { value: 'youtube', labelKey: 'products.video.youtube' },
                    { value: 'vimeo', labelKey: 'products.video.vimeo' },
                    { value: 'self', labelKey: 'products.video.self' },
                    { value: 'other', labelKey: 'products.video.other' },
                  ],
                },
                {
                  name: 'url',
                  type: 'string',
                  required: false,
                  widget: 'input',
                },
                {
                  name: 'storagePath',
                  type: 'string',
                  required: false,
                  widget: 'upload',
                  accept: 'video/*',
                  uploadConfig: {
                    storageFolder: 'products/videos',
                    fileNamePrefix: 'video_',
                  },
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
          },

          // ─────────────────────────────
          // Ventajas / características
          // ─────────────────────────────
          {
            name: 'advantages',
            type: 'array',
            required: false,
            groupKey: 'content',
            sortable: true,
            element: {
              name: 'advantage',
              type: 'string',
              widget: 'input',
              translatable: true,
            },
          },
          {
            name: 'features',
            type: 'array',
            required: false,
            groupKey: 'content',
            sortable: true,
            element: {
              name: 'feature',
              type: 'string',
              widget: 'input',
              translatable: true,
            },
          },

          // ─────────────────────────────
          // Especificaciones (para comparativos)
          // ─────────────────────────────
          {
            name: 'specs',
            type: 'array',
            required: false,
            groupKey: 'specs',
            sortable: true,
            element: {
              name: 'spec',
              type: 'object',
              collapsible: true,
              fields: [
                {
                  name: 'group',
                  type: 'string',
                  required: false,
                  widget: 'input',
                },
                {
                  name: 'key',
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
                  widget: 'checkbox',
                },
                {
                  name: 'order',
                  type: 'number',
                  required: false,
                  widget: 'input',
                  min: 0,
                },
              ],
            },
          },

          // ─────────────────────────────
          // Precio / inventario
          // ─────────────────────────────
          {
            name: 'pricing',
            type: 'object',
            required: false,
            groupKey: 'pricing',
            collapsible: true,
            fields: [
              {
                name: 'currency',
                type: 'select',
                required: false,
                widget: 'select',
                options: [
                  { value: 'CAD', labelKey: 'currency.cad' },
                  { value: 'USD', labelKey: 'currency.usd' },
                  { value: 'MXN', labelKey: 'currency.mxn' },
                  { value: 'EUR', labelKey: 'currency.eur' },
                ],
              },
              {
                name: 'price',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
                step: 0.01,
              },
              {
                name: 'salePrice',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
                step: 0.01,
              },
              {
                name: 'compareAt',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
                step: 0.01,
              },
              {
                name: 'taxIncluded',
                type: 'boolean',
                required: false,
                widget: 'checkbox',
              },
              {
                name: 'unitLabel',
                type: 'string',
                required: false,
                widget: 'input',
                translatable: true,
              },
            ],
          },
          {
            name: 'inventory',
            type: 'object',
            required: false,
            groupKey: 'pricing',
            collapsible: true,
            fields: [
              {
                name: 'trackStock',
                type: 'boolean',
                required: false,
                widget: 'checkbox',
              },
              {
                name: 'stock',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
                step: 1,
              },
              {
                name: 'lowStockThreshold',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
                step: 1,
              },
            ],
          },
          {
            name: 'dimensions',
            type: 'object',
            required: false,
            groupKey: 'pricing',
            collapsible: true,
            fields: [
              {
                name: 'weight',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
              },
              {
                name: 'weightUnit',
                type: 'select',
                required: false,
                widget: 'select',
                options: [
                  { value: 'g', labelKey: 'unit.g' },
                  { value: 'kg', labelKey: 'unit.kg' },
                  { value: 'lb', labelKey: 'unit.lb' },
                ],
              },
              {
                name: 'length',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
              },
              {
                name: 'width',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
              },
              {
                name: 'height',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
              },
              {
                name: 'dimUnit',
                type: 'select',
                required: false,
                widget: 'select',
                options: [
                  { value: 'cm', labelKey: 'unit.cm' },
                  { value: 'in', labelKey: 'unit.in' },
                  { value: 'mm', labelKey: 'unit.mm' },
                ],
              },
            ],
          },

          // ─────────────────────────────
          // Variantes (tallas, colores, etc.)
          // ─────────────────────────────
          {
            name: 'optionDefs',
            type: 'array',
            required: false,
            groupKey: 'variants',
            sortable: true,
            element: {
              name: 'optionDef',
              type: 'object',
              collapsible: true,
              fields: [
                {
                  name: 'name',
                  type: 'string',
                  required: true,
                  widget: 'input',
                },
                {
                  name: 'values',
                  type: 'array',
                  required: false,
                  widget: 'tags',
                  element: { name: 'value', type: 'string' },
                  sortable: true,
                },
              ],
            },
          },
          {
            name: 'variants',
            type: 'array',
            required: false,
            groupKey: 'variants',
            sortable: true,
            element: {
              name: 'variant',
              type: 'object',
              collapsible: true,
              fields: [
                {
                  name: 'variantId',
                  type: 'string',
                  required: true,
                  widget: 'input',
                },
                {
                  name: 'sku',
                  type: 'string',
                  required: false,
                  widget: 'input',
                },
                {
                  name: 'isDefault',
                  type: 'boolean',
                  required: false,
                  widget: 'checkbox',
                },
                {
                  name: 'isActive',
                  type: 'boolean',
                  required: false,
                  widget: 'checkbox',
                },
                {
                  name: 'optionValues',
                  type: 'array',
                  required: false,
                  sortable: true,
                  element: {
                    name: 'pair',
                    type: 'object',
                    collapsible: false,
                    fields: [
                      {
                        name: 'name',
                        type: 'string',
                        required: true,
                        widget: 'input',
                      },
                      {
                        name: 'value',
                        type: 'string',
                        required: true,
                        widget: 'input',
                      },
                    ],
                  },
                },
                {
                  name: 'price',
                  type: 'number',
                  required: false,
                  widget: 'input',
                  min: 0,
                  step: 0.01,
                },
                {
                  name: 'salePrice',
                  type: 'number',
                  required: false,
                  widget: 'input',
                  min: 0,
                  step: 0.01,
                },
                {
                  name: 'stock',
                  type: 'number',
                  required: false,
                  widget: 'input',
                  min: 0,
                  step: 1,
                },
                {
                  name: 'image',
                  type: 'string',
                  required: false,
                  widget: 'upload',
                  accept: 'image/*',
                  uploadConfig: {
                    storageFolder: 'products/variants',
                    fileNamePrefix: 'variant_',
                  },
                },
              ],
            },
          },

          // ─────────────────────────────
          // Links / CTAs
          // ─────────────────────────────
          {
            name: 'links',
            type: 'array',
            required: false,
            groupKey: 'ui',
            sortable: true,
            element: {
              name: 'link',
              type: 'object',
              collapsible: true,
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
                  name: 'kind',
                  type: 'select',
                  required: false,
                  widget: 'select',
                  options: [
                    { value: 'external', labelKey: 'products.link.external' },
                    { value: 'manual', labelKey: 'products.link.manual' },
                    { value: 'spec', labelKey: 'products.link.spec' },
                    { value: 'warranty', labelKey: 'products.link.warranty' },
                  ],
                },
                {
                  name: 'newTab',
                  type: 'boolean',
                  required: false,
                  widget: 'checkbox',
                },
              ],
            },
          },
          {
            name: 'ctas',
            type: 'array',
            required: false,
            groupKey: 'ui',
            sortable: true,
            element: {
              name: 'cta',
              type: 'object',
              collapsible: true,
              fields: [
                {
                  name: 'label',
                  type: 'string',
                  required: true,
                  widget: 'input',
                  translatable: true,
                },
                {
                  name: 'action',
                  type: 'select',
                  required: true,
                  widget: 'select',
                  options: [
                    { value: 'add_to_cart', labelKey: 'products.cta.addToCart' },
                    { value: 'buy_now', labelKey: 'products.cta.buyNow' },
                    { value: 'favorite', labelKey: 'products.cta.favorite' },
                    { value: 'link', labelKey: 'products.cta.link' },
                    { value: 'phone', labelKey: 'products.cta.phone' },
                    { value: 'email', labelKey: 'products.cta.email' },
                  ],
                },
                {
                  name: 'href',
                  type: 'string',
                  required: false,
                  widget: 'input',
                },
                {
                  name: 'style',
                  type: 'select',
                  required: false,
                  widget: 'select',
                  options: [
                    { value: 'primary', labelKey: 'products.cta.style.primary' },
                    { value: 'secondary', labelKey: 'products.cta.style.secondary' },
                    { value: 'ghost', labelKey: 'products.cta.style.ghost' },
                  ],
                },
              ],
            },
          },
          {
            name: 'ui',
            type: 'object',
            required: false,
            groupKey: 'ui',
            collapsible: true,
            fields: [
              {
                name: 'sliderAutoplay',
                type: 'boolean',
                required: false,
                widget: 'checkbox',
              },
              {
                name: 'sliderIntervalMs',
                type: 'number',
                required: false,
                widget: 'input',
                min: 0,
                step: 100,
              },
              {
                name: 'allowCart',
                type: 'boolean',
                required: false,
                widget: 'checkbox',
              },
              {
                name: 'allowFavorites',
                type: 'boolean',
                required: false,
                widget: 'checkbox',
              },
              {
                name: 'allowCompare',
                type: 'boolean',
                required: false,
                widget: 'checkbox',
              },
            ],
          },

          // ─────────────────────────────
          // Relaciones
          // ─────────────────────────────
          {
            name: 'relatedProductIds',
            type: 'array',
            required: false,
            groupKey: 'relations',
            widget: 'array',
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
