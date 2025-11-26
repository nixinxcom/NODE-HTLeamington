import type { PanelSchema } from '@/complements/factory/panelSchema.types';

export const CALENDAR_PANEL_SCHEMA: PanelSchema = {
  "id": "calendar",
  "labelKey": "panels.calendar.title",
  "iconKey": "calendar",
  "fsCollection": "Providers",
  "fsDocId": "Calendar",
  "isProvider": true,
  "isAgentFDV": true,
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
      "name": "events",
      "type": "array",
      "groupKey": "events",
      "element": {
        "name": "event",
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
            "name": "description",
            "type": "text",
            "required": false,
            "widget": "textarea",
            "translatable": true
          },
          {
            "name": "category",
            "type": "select",
            "required": false,
            "widget": "select",
            "options": [
              {
                "value": "event",
                "labelKey": "calendar.category.event"
              },
              {
                "value": "promo",
                "labelKey": "calendar.category.promo"
              },
              {
                "value": "holiday",
                "labelKey": "calendar.category.holiday"
              },
              {
                "value": "meeting",
                "labelKey": "calendar.category.meeting"
              },
              {
                "value": "other",
                "labelKey": "calendar.category.other"
              }
            ]
          },
          {
            "name": "startDate",
            "type": "date",
            "required": true
          },
          {
            "name": "startTime",
            "type": "string",
            "required": false,
            "widget": "input"
          },
          {
            "name": "endDate",
            "type": "date",
            "required": false
          },
          {
            "name": "endTime",
            "type": "string",
            "required": false,
            "widget": "input"
          },
          {
            "name": "allDay",
            "type": "boolean",
            "required": false
          },
          {
            "name": "location",
            "type": "string",
            "required": false,
            "widget": "input",
            "translatable": true
          },
          {
            "name": "contactName",
            "type": "string",
            "required": false,
            "widget": "input"
          },
          {
            "name": "contactPhone",
            "type": "string",
            "required": false,
            "widget": "input"
          },
          {
            "name": "contactEmail",
            "type": "string",
            "required": false,
            "widget": "input"
          },
          {
            "name": "links",
            "type": "array",
            "element": {
              "name": "link",
              "type": "object",
              "collapsible": false,
              "fields": [
                {
                  "name": "label",
                  "type": "string",
                  "required": false,
                  "widget": "input",
                  "translatable": true
                },
                {
                  "name": "url",
                  "type": "string",
                  "required": true,
                  "widget": "input"
                }
              ]
            },
            "sortable": true
          },
          {
            "name": "media",
            "type": "array",
            "element": {
              "name": "mediaItem",
              "type": "object",
              "collapsible": false,
              "fields": [
                {
                  "name": "type",
                  "type": "select",
                  "required": false,
                  "widget": "select",
                  "options": [
                    {
                      "value": "image",
                      "labelKey": "calendar.media.type.image"
                    },
                    {
                      "value": "video",
                      "labelKey": "calendar.media.type.video"
                    },
                    {
                      "value": "file",
                      "labelKey": "calendar.media.type.file"
                    }
                  ]
                },
                {
                  "name": "url",
                  "type": "string",
                  "required": true,
                  "widget": "input"
                },
                {
                  "name": "caption",
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
            "name": "visibility",
            "type": "select",
            "required": false,
            "widget": "select",
            "options": [
              {
                "value": "public",
                "labelKey": "calendar.visibility.public"
              },
              {
                "value": "websiteOnly",
                "labelKey": "calendar.visibility.websiteOnly"
              },
              {
                "value": "internal",
                "labelKey": "calendar.visibility.internal"
              }
            ]
          }
        ]
      },
      "sortable": true
    }
  ]
};
