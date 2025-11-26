import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const AGREEMENTS_PANEL_SCHEMA: PanelSchema = {
  "id": "agreements",
  "labelKey": "panels.agreements.title",
  "iconKey": "agreements",
  "fsCollection": "Providers",
  "fsDocId": "Agreements",
  "isProvider": true,
  "isAgentFDV": true,
  "source": "core",
  "stage": "published",
  "access": {
    "allowedRoles": [
      "superadmin"
    ]
  },
  "version": 1,
  "fields": [
    {
      "name": "client",
      "type": "object",
      "groupKey": "client",
      "fields": [
        {
          "name": "legalName",
          "type": "string",
          "required": true,
          "widget": "input"
        },
        {
          "name": "brandName",
          "type": "string",
          "required": false,
          "widget": "input"
        },
        {
          "name": "taxId",
          "type": "string",
          "required": false,
          "widget": "input"
        },
        {
          "name": "country",
          "type": "string",
          "required": false,
          "widget": "input"
        },
        {
          "name": "currency",
          "type": "string",
          "required": false,
          "widget": "input"
        }
      ]
    },
    {
      "name": "agreement",
      "type": "object",
      "groupKey": "agreement",
      "fields": [
        {
          "name": "agreementId",
          "type": "string",
          "required": true,
          "widget": "input"
        },
        {
          "name": "type",
          "type": "select",
          "required": true,
          "widget": "select",
          "options": [
            {
              "value": "standard",
              "labelKey": "agreements.type.standard"
            },
            {
              "value": "custom",
              "labelKey": "agreements.type.custom"
            },
            {
              "value": "trial",
              "labelKey": "agreements.type.trial"
            },
            {
              "value": "internal",
              "labelKey": "agreements.type.internal"
            }
          ]
        },
        {
          "name": "startDate",
          "type": "date",
          "required": true
        },
        {
          "name": "endDate",
          "type": "date",
          "required": false
        },
        {
          "name": "autoRenew",
          "type": "boolean",
          "required": false
        },
        {
          "name": "notes",
          "type": "text",
          "required": false,
          "widget": "textarea"
        }
      ]
    },
    {
      "name": "contacts",
      "type": "array",
      "groupKey": "contacts",
      "element": {
        "name": "contact",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "name",
            "type": "string",
            "required": true,
            "widget": "input"
          },
          {
            "name": "role",
            "type": "string",
            "required": false,
            "widget": "input"
          },
          {
            "name": "email",
            "type": "string",
            "required": true,
            "widget": "input"
          },
          {
            "name": "phone",
            "type": "string",
            "required": false,
            "widget": "input"
          },
          {
            "name": "isBillingContact",
            "type": "boolean",
            "required": false
          },
          {
            "name": "isTechnicalContact",
            "type": "boolean",
            "required": false
          }
        ]
      },
      "sortable": true
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
            "name": "code",
            "type": "string",
            "required": true,
            "widget": "input"
          },
          {
            "name": "name",
            "type": "string",
            "required": true,
            "widget": "input"
          },
          {
            "name": "description",
            "type": "text",
            "required": false,
            "widget": "textarea"
          },
          {
            "name": "enabled",
            "type": "boolean",
            "required": true
          },
          {
            "name": "pricingModel",
            "type": "select",
            "required": false,
            "widget": "select",
            "options": [
              {
                "value": "flat",
                "labelKey": "agreements.pricing.flat"
              },
              {
                "value": "usage",
                "labelKey": "agreements.pricing.usage"
              },
              {
                "value": "hybrid",
                "labelKey": "agreements.pricing.hybrid"
              }
            ]
          },
          {
            "name": "basePrice",
            "type": "number",
            "required": false,
            "min": 0
          },
          {
            "name": "usagePricePerUnit",
            "type": "number",
            "required": false,
            "min": 0
          },
          {
            "name": "notes",
            "type": "text",
            "required": false,
            "widget": "textarea"
          }
        ]
      },
      "sortable": true
    },
    {
      "name": "billing",
      "type": "object",
      "groupKey": "billing",
      "fields": [
        {
          "name": "billingAddress",
          "type": "text",
          "required": false,
          "widget": "textarea"
        },
        {
          "name": "paymentTerms",
          "type": "string",
          "required": false,
          "widget": "input"
        },
        {
          "name": "invoicingEmail",
          "type": "string",
          "required": false,
          "widget": "input"
        },
        {
          "name": "referenceText",
          "type": "string",
          "required": false,
          "widget": "input"
        }
      ]
    },
    {
      "name": "corporateStatement",
      "type": "text",
      "groupKey": "corporate",
      "required": false,
      "widget": "textarea"
    }
  ]
};
