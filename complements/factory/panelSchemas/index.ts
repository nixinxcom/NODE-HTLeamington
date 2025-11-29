import type { PanelSchemasRegistry } from '../panelSchema.types';
import { BRANDING_PANEL_SCHEMA } from './branding.schema';
import { SETTINGS_PANEL_SCHEMA } from './settings.schema';
import { PWA_PANEL_SCHEMA } from './pwa.schema'

import { I18N_FRONT_PANEL_SCHEMA } from './frontI18n.schema';
import { TRAINING_PANEL_SCHEMA } from './training.schema';
import { AGREEMENTS_PANEL_SCHEMA } from './agreements.schema';
import { CALENDAR_PANEL_SCHEMA } from './calendar.schema';
import { ENV_PANEL_SCHEMA } from './env.schema';

export const PANEL_SCHEMAS: PanelSchemasRegistry = {
  branding: BRANDING_PANEL_SCHEMA,
  settings: SETTINGS_PANEL_SCHEMA,
  pwa: PWA_PANEL_SCHEMA,
  i18nFront: I18N_FRONT_PANEL_SCHEMA,
  training: TRAINING_PANEL_SCHEMA,
  agreements: AGREEMENTS_PANEL_SCHEMA,
  calendar: CALENDAR_PANEL_SCHEMA,
  env: ENV_PANEL_SCHEMA,
};