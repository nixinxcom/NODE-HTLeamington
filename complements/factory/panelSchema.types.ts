// complements/factory/panelSchema.types.ts
// ============================================================================
// Tipos base para Factory UI (FUI) + Panel UI (PUI)
// Estructura estricta y extensible, con sub-schemas validados
// ============================================================================

/** Roles que pueden acceder a un panel */
export type PanelRole =
  | 'superadmin'
  | 'admin'
  | 'client'
  | 'enduser';

/** Tipos escalares */
export type PanelScalarType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multiselect';

/** Tipos contenedores */
export type PanelContainerType = 'object' | 'array';

/** Tipo total */
export type PanelFieldType = PanelScalarType | PanelContainerType;

/** Widgets admitidos */
export type PanelFieldWidget =
  | 'input'
  | 'textarea'
  | 'checkbox'
  | 'switch'
  | 'select'
  | 'radio'
  | 'multiselect'
  | 'color'
  | 'slider'
  | 'tags'
  | 'code'
  | 'markdown'
  | 'json'
  | 'image'
  | 'file'
  | 'hidden'
  | (string & {});

/** Opción para selects/multiselect */
export type PanelFieldOption = {
  value: string;
  labelKey?: string;
};

// ============================================================================
//  BASE FIELD
// ============================================================================
export interface PanelBaseField {
  /** Nombre completo del campo, p.ej. "agentAI.name" */
  name: string;

  /** Tipo lógico (string, number, array, object, etc.) */
  type: PanelFieldType;

  /** Si es obligatorio en el formulario */
  required?: boolean;

  /** Si el valor se maneja por locale */
  translatable?: boolean;

  /** Clave de i18n para el label */
  labelKey?: string;

  /** Clave de i18n para la descripción */
  descriptionKey?: string;

  /** Grupo lógico, p.ej. "agentAI" */
  groupKey?: string;

  /** Orden sugerido en el panel */
  order?: number;

  /** Widget preferido (input, select, color, etc.) */
  widget?: PanelFieldWidget;

  /** Opciones para select/multiselect */
  options?: PanelFieldOption[];

  /** Rango numérico (para type:number) */
  min?: number;
  max?: number;

  /** Longitud mínima/máxima de texto (string/text) */
  minLength?: number;
  maxLength?: number;
}

// ============================================================================
//  SCALAR FIELD
// ============================================================================
export interface PanelScalarField extends PanelBaseField {
  type: PanelScalarType;
}

// ============================================================================
//  OBJECT FIELD (SUB-SCHEMA ESTRICTO)
// ============================================================================
export interface PanelObjectField extends PanelBaseField {
  type: 'object';
  fields: PanelField[]; // subcampos obligatorios
  collapsible?: boolean;
  initiallyCollapsed?: boolean;
}

// ============================================================================
//  ARRAY FIELD (SUB-SCHEMA DE ELEMENTO)
// ============================================================================
export interface PanelArrayField extends PanelBaseField {
  type: 'array';
  element: PanelScalarField | PanelObjectField;
  sortable?: boolean;
  minItems?: number;
  maxItems?: number;
}

// ============================================================================
//  UNIÓN FINAL DE CAMPOS
// ============================================================================
export type PanelField =
  | PanelScalarField
  | PanelObjectField
  | PanelArrayField;

// ============================================================================
//  PANEL SCHEMA COMPLETO
// ============================================================================

export interface PanelAccess {
  allowedRoles: PanelRole[];
}

/** Origen del schema (core vs FUI en Firestore) */
export type PanelSchemaSource = 'core' | 'factory';

/** Etapa del schema (borrador vs publicado) */
export type PanelSchemaStage = 'draft' | 'published';

export interface PanelSchema {
  /** Id lógico del panel: branding, settings, products, etc. */
  id: string;

  /** Clave de i18n para el título del panel */
  labelKey: string;

  /** Icono sugerido (clave interna) */
  iconKey?: string;

  /** Colección y documento donde vive la FDV (Providers/Branding, etc.) */
  fsCollection: string;
  fsDocId: string;

  /**
   * De dónde viene el schema:
   *  - 'core'    → definido en código (PANEL_SCHEMAS)
   *  - 'factory' → creado/ajustado por el FUI y guardado en FactorySchemas
   */
  source?: PanelSchemaSource;

  /**
   * Estado del schema:
   *  - 'draft'     → en diseño / pruebas
   *  - 'published' → listo para ser consumido por el PUI
   */
  stage?: PanelSchemaStage;

  /** Si alimenta FDV (Providers) o paneles internos */
  isProvider?: boolean;

  /** Roles permitidos para ver/editar este panel */
  access?: PanelAccess;

  /** Definición de campos */
  fields: PanelField[];

  /** Versión del schema */
  version?: number;
}

export type PanelSchemasRegistry = Record<string, PanelSchema>;

export const PANEL_FS_COLLECTION_PROVIDERS = 'Providers' as const;
export const PANEL_FS_COLLECTION_ADMIN = 'Admin' as const;

// ============================================================================
//  TYPE GUARDS
// ============================================================================
export function isScalarField(field: PanelField): field is PanelScalarField {
  return field.type !== 'object' && field.type !== 'array';
}

export function isObjectField(field: PanelField): field is PanelObjectField {
  return field.type === 'object';
}

export function isArrayField(field: PanelField): field is PanelArrayField {
  return field.type === 'array';
}
