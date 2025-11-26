import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const TRAINING_PANEL_SCHEMA: PanelSchema = {
  "id": "training",
  "labelKey": "panels.training.title",
  "iconKey": "training",
  "fsCollection": "Providers",
  "fsDocId": "InternalTraining",
  "isProvider": true,
  "source": "core",
  "stage": "published",
  "access": {
    "allowedRoles": [
      "superadmin",
      "admin",
      "client"
    ]
  },
  "version": 1,
  "fields": [
    {
      "name": "topics",
      "type": "array",
      "groupKey": "topics",
      "element": {
        "name": "topic",
        "type": "object",
        "collapsible": false,
        "fields": [
          {
            "name": "title",
            "type": "string",
            "required": true,
            "widget": "input",
            "translatable": true
          },
          {
            "name": "code",
            "type": "string",
            "required": false,
            "widget": "input"
          },
          {
            "name": "summary",
            "type": "text",
            "required": false,
            "widget": "textarea",
            "translatable": true
          },
          {
            "name": "validFrom",
            "type": "date",
            "required": false
          },
          {
            "name": "validUntil",
            "type": "date",
            "required": false
          },
          {
            "name": "departments",
            "type": "multiselect",
            "required": false,
            "widget": "multiselect",
            "options": [
              {
                "value": "all",
                "labelKey": "training.department.all"
              },
              {
                "value": "sales",
                "labelKey": "training.department.sales"
              },
              {
                "value": "service",
                "labelKey": "training.department.service"
              },
              {
                "value": "support",
                "labelKey": "training.department.support"
              },
              {
                "value": "operations",
                "labelKey": "training.department.operations"
              },
              {
                "value": "management",
                "labelKey": "training.department.management"
              }
            ]
          },
          {
            "name": "audience",
            "type": "multiselect",
            "required": false,
            "widget": "multiselect",
            "options": [
              {
                "value": "allStaff",
                "labelKey": "training.audience.allStaff"
              },
              {
                "value": "newHires",
                "labelKey": "training.audience.newHires"
              },
              {
                "value": "frontline",
                "labelKey": "training.audience.frontline"
              },
              {
                "value": "supervisors",
                "labelKey": "training.audience.supervisors"
              }
            ]
          },
          {
            "name": "attachments",
            "type": "array",
            "groupKey": "attachments",
            "element": {
              "name": "attachment",
              "type": "object",
              "collapsible": false,
              "fields": [
                {
                  "name": "label",
                  "type": "string",
                  "required": true,
                  "widget": "input",
                  "translatable": true
                },
                {
                  "name": "fileUrl",
                  "type": "string",
                  "required": true,
                  "widget": "file"
                },
                {
                  "name": "description",
                  "type": "text",
                  "required": false,
                  "widget": "textarea",
                  "translatable": true
                }
              ]
            },
            "sortable": true
          },
          {
            "name": "contentBlocks",
            "type": "array",
            "groupKey": "content",
            "element": {
              "name": "block",
              "type": "object",
              "collapsible": false,
              "fields": [
                {
                  "name": "title",
                  "type": "string",
                  "required": false,
                  "widget": "input",
                  "translatable": true
                },
                {
                  "name": "body",
                  "type": "text",
                  "required": false,
                  "widget": "textarea",
                  "translatable": true
                }
              ]
            },
            "sortable": true
          },
          {
            "name": "questions",
            "type": "array",
            "groupKey": "evaluation",
            "element": {
              "name": "question",
              "type": "object",
              "collapsible": false,
              "fields": [
                {
                  "name": "prompt",
                  "type": "text",
                  "required": true,
                  "widget": "textarea",
                  "translatable": true
                },
                {
                  "name": "type",
                  "type": "select",
                  "required": true,
                  "widget": "select",
                  "options": [
                    {
                      "value": "open",
                      "labelKey": "training.question.type.open"
                    },
                    {
                      "value": "singleChoice",
                      "labelKey": "training.question.type.singleChoice"
                    },
                    {
                      "value": "multiChoice",
                      "labelKey": "training.question.type.multiChoice"
                    },
                    {
                      "value": "scale",
                      "labelKey": "training.question.type.scale"
                    }
                  ]
                },
                {
                  "name": "options",
                  "type": "array",
                  "element": {
                    "name": "option",
                    "type": "string",
                    "required": false,
                    "widget": "input",
                    "translatable": true
                  },
                  "sortable": true
                },
                {
                  "name": "required",
                  "type": "boolean",
                  "required": false
                }
              ]
            },
            "sortable": true
          },
          {
            "name": "allowComplaints",
            "type": "boolean",
            "required": false
          },
          {
            "name": "allowSuggestions",
            "type": "boolean",
            "required": false
          },
          {
            "name": "allowSurveys",
            "type": "boolean",
            "required": false
          }
        ]
      },
      "sortable": true
    },
    {
      "name": "feedbackInbox",
      "type": "string",
      "groupKey": "feedback",
      "required": false,
      "widget": "input"
    }
  ]
};
