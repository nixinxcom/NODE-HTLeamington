import type { PanelSchema } from '@/complements/factory/panelSchema.types';


export const SEO_METADATA_PANEL_SCHEMA: PanelSchema = {
  id: 'seoMetadata',
  labelKey: 'panels.seoMetadata.title',
  iconKey: 'seo',
  fsCollection: 'Providers',
  fsDocId: 'SeoMetadata',
  isProvider: true,
  isAgentFDV: false,
  source: 'core',
  stage: 'published',
  access: {
    allowedRoles: ['superadmin', 'admin', 'client'],
  },
  version: 1,
  fields: [
    // ─────────────────────────────────────
    // GLOBAL (components) – defaults base
    // ─────────────────────────────────────
    {
      name: 'global.title',
      type: 'string',
      groupKey: 'global',
      translatable: true,
      required: false,
    },
    {
      name: 'global.description',
      type: 'text',
      widget: 'textarea',
      groupKey: 'global',
      translatable: true,
    },
    {
      name: 'global.canonical',
      type: 'string',
      groupKey: 'global',
    },
    {
      name: 'global.robots',
      type: 'string',
      groupKey: 'global',
    },
    {
      name: 'global.og.title',
      type: 'string',
      groupKey: 'global',
      translatable: true,
    },
    {
      name: 'global.og.description',
      type: 'text',
      widget: 'textarea',
      groupKey: 'global',
      translatable: true,
    },
    {
      name: 'global.og.image',
      type: 'string',
      widget: 'image',
      groupKey: 'global',
    },
    {
      name: 'global.og.type',
      type: 'string',
      groupKey: 'global',
    },
    {
      name: 'global.twitter.card',
      type: 'string',
      groupKey: 'global',
    },
    {
      name: 'global.twitter.title',
      type: 'string',
      groupKey: 'global',
      translatable: true,
    },
    {
      name: 'global.twitter.description',
      type: 'text',
      widget: 'textarea',
      groupKey: 'global',
      translatable: true,
    },
    {
      name: 'global.twitter.image',
      type: 'string',
      widget: 'image',
      groupKey: 'global',
    },
    {
      name: 'global.noindex',
      type: 'boolean',
      groupKey: 'global',
    },

    // ─────────────────────────────────────
    // SITE (all pages) – defaults de sitio
    // ─────────────────────────────────────
    {
      name: 'site.title',
      type: 'string',
      groupKey: 'site',
      translatable: true,
    },
    {
      name: 'site.description',
      type: 'text',
      widget: 'textarea',
      groupKey: 'site',
      translatable: true,
    },
    {
      name: 'site.canonical',
      type: 'string',
      groupKey: 'site',
    },
    {
      name: 'site.robots',
      type: 'string',
      groupKey: 'site',
    },
    {
      name: 'site.og.title',
      type: 'string',
      groupKey: 'site',
      translatable: true,
    },
    {
      name: 'site.og.description',
      type: 'text',
      widget: 'textarea',
      groupKey: 'site',
      translatable: true,
    },
    {
      name: 'site.og.image',
      type: 'string',
      widget: 'image',
      groupKey: 'site',
    },
    {
      name: 'site.og.type',
      type: 'string',
      groupKey: 'site',
    },
    {
      name: 'site.twitter.card',
      type: 'string',
      groupKey: 'site',
    },
    {
      name: 'site.twitter.title',
      type: 'string',
      groupKey: 'site',
      translatable: true,
    },
    {
      name: 'site.twitter.description',
      type: 'text',
      widget: 'textarea',
      groupKey: 'site',
      translatable: true,
    },
    {
      name: 'site.twitter.image',
      type: 'string',
      widget: 'image',
      groupKey: 'site',
    },
    {
      name: 'site.noindex',
      type: 'boolean',
      groupKey: 'site',
    },

    // ─────────────────────────────────────
    // PER PAGE – por ruta
    // ─────────────────────────────────────
    {
      name: 'routes',
      type: 'array',
      groupKey: 'routes',
      sortable: true,
      element: {
        name: 'route',
        type: 'object',
        collapsible: false,
        fields: [
          {
            name: 'path',
            type: 'string',
            required: true,        // ej: "/", "/menu", "/blog"
          },
          {
            name: 'title',
            type: 'string',
            translatable: true,
          },
          {
            name: 'description',
            type: 'text',
            widget: 'textarea',
            translatable: true,
          },
          {
            name: 'canonical',
            type: 'string',
          },
          {
            name: 'robots',
            type: 'string',
          },
          {
            name: 'ogTitle',
            type: 'string',
            translatable: true,
          },
          {
            name: 'ogDescription',
            type: 'text',
            widget: 'textarea',
            translatable: true,
          },
          {
            name: 'ogImage',
            type: 'string',
            widget: 'image',
          },
          {
            name: 'ogType',
            type: 'string',
          },
          {
            name: 'twitterCard',
            type: 'string',
          },
          {
            name: 'twitterTitle',
            type: 'string',
            translatable: true,
          },
          {
            name: 'twitterDescription',
            type: 'text',
            widget: 'textarea',
            translatable: true,
          },
          {
            name: 'twitterImage',
            type: 'string',
            widget: 'image',
          },
          {
            name: 'noindex',
            type: 'boolean',
          },
        ],
      },
    },
  ],
};
