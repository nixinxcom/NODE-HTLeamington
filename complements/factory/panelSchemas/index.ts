import type { PanelSchemasRegistry } from '../panelSchema.types';
import { BRANDING_PANEL_SCHEMA } from './branding.schema';
import { SETTINGS_PANEL_SCHEMA } from './settings.schema';

export const PANEL_SCHEMAS: PanelSchemasRegistry = {
  branding: BRANDING_PANEL_SCHEMA,
  settings: SETTINGS_PANEL_SCHEMA,
};
