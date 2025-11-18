// complements/data/branding.schema.ts
// ============================================================================
//  Tipos "marcados" y clampers (para mapas, etc.)
// ============================================================================

export type Latitude  = number & { __brand: "Latitude" };
export type Longitude = number & { __brand: "Longitude" };
export type Zoom      = number & { __brand: "Zoom" };
export type MapAngle  = number & { __brand: "MapAngle" };

export const lat   = (value: number): Latitude  => Math.max(-90, Math.min(90, value)) as Latitude;
export const lng   = (value: number): Longitude => Math.max(-180, Math.min(180, value)) as Longitude;
export const zoom  = (value: number): Zoom      => Math.max(1, Math.min(22, value)) as Zoom;
// 0–360 normalizado
export const angle = (value: number): MapAngle  => (((value % 360) + 360) % 360) as MapAngle;

// ============================================================================
//  Metadata de campos para RDD + creación dinámica de UI
//  - kind      → tipo de dato / widget
//  - required  → obligatorio para poder guardar
//  - min/max   → límites numéricos (cuando aplique)
//  - translate → si el LABEL debe pasar por i18n (FM) en la UI
// ============================================================================

export type ScalarKind =
  | "string"    // input de texto corto
  | "textarea"  // textos largos
  | "number"    // número genérico
  | "lat"       // Latitude
  | "lng"       // Longitude
  | "zoom"      // Zoom
  | "angle"     // MapAngle
  | "bool"      // booleano
  | "url"
  | "email"
  | "phone";

export interface ScalarFieldMeta {
  kind: ScalarKind;
  required: boolean;
  min?: number;
  max?: number;
  /** Si true (default), la UI puede usar <FM> para el label del campo */
  translate?: boolean;
}

export interface ObjectFieldMeta {
  kind: "object";
  required: boolean;
  shape: FieldShape;
}

export interface ArrayFieldMeta {
  kind: "array";
  required: boolean;
  of: ScalarFieldMeta | ObjectFieldMeta;
  minItems?: number;
  maxItems?: number;
}

export type FieldMeta  = ScalarFieldMeta | ObjectFieldMeta | ArrayFieldMeta;
export type FieldShape = { [key: string]: FieldMeta };

/** Opciones extra para escalares: límites + flag de traducción de label */
export interface ScalarFieldOptions {
  min?: number;
  max?: number;
  translate?: boolean; // default: true
}

// Helpers para que cada campo quede en UN renglón
export const s = (
  kind: ScalarKind,
  required: boolean,
  options: ScalarFieldOptions = {},
): ScalarFieldMeta => {
  const { min, max, translate = true } = options;
  return { kind, required, min, max, translate };
};

export const o = (shape: FieldShape, required: boolean = false): ObjectFieldMeta =>
  ({ kind: "object", required, shape });

export const a = (
  of: ScalarFieldMeta | ObjectFieldMeta,
  required: boolean = false,
  minItems?: number,
  maxItems?: number,
): ArrayFieldMeta =>
  ({ kind: "array", required, of, minItems, maxItems });

// ============================================================================
//  Metadata de secciones raíz para la BUI
//  (título via FM solo si translate === true)
// ============================================================================

export type BrandingRootKey = keyof typeof brandingSchema;

export interface BrandingSectionMeta {
  key: BrandingRootKey;
  titleId: string;
  descriptionId?: string;
  /** Si true, el título se renderiza con <FM id={titleId} defaultMessage={key} /> */
  translate?: boolean;
}

export const brandingSections: BrandingSectionMeta[] = [
  { key: "company",   titleId: "branding.section.company.title",   descriptionId: "branding.section.company.desc",   translate: true },
  { key: "agentAI",   titleId: "branding.section.agentAI.title",   descriptionId: "branding.section.agentAI.desc",   translate: true },
  { key: "contact",   titleId: "branding.section.contact.title",   descriptionId: "branding.section.contact.desc",   translate: true },
  { key: "socials",   titleId: "branding.section.socials.title",   descriptionId: "branding.section.socials.desc",   translate: true },
  { key: "platforms", titleId: "branding.section.platforms.title", descriptionId: "branding.section.platforms.desc", translate: true },
  { key: "schedule",  titleId: "branding.section.schedule.title",  descriptionId: "branding.section.schedule.desc",  translate: true },
  { key: "holidays",  titleId: "branding.section.holidays.title",  descriptionId: "branding.section.holidays.desc",  translate: true },
  { key: "products",  titleId: "branding.section.products.title",  descriptionId: "branding.section.products.desc",  translate: true },
  { key: "services",  titleId: "branding.section.services.title",  descriptionId: "branding.section.services.desc",  translate: true },
  { key: "more",      titleId: "branding.section.more.title",      descriptionId: "branding.section.more.desc",      translate: true },
];

// ============================================================================
//  Esquema completo de BRANDING
//  - translate se refiere al LABEL del campo (UI), no al valor.
// ============================================================================

export const brandingSchema = {
  company: o({
    legalName: s("string",   true),
    brandName: s("string",   true),
    logo:      s("url",      true),
    tagline:   s("textarea", false),

    contact: o({
      website:          s("url",   false),
      phone:            s("phone", false),
      email:            s("email", false),
      googleProfileURL: s("url",   false),

      address: o({
        street:    s("string", false),
        number:    s("string", false),
        interior:  s("string", false),
        city:      s("string", false),
        state:     s("string", false),
        zip:       s("string", false),
        country:   s("string", false),
        latitud:   s("lat",    false, { min: -90,  max: 90 }),
        longitude: s("lng",    false, { min: -180, max: 180 }),
      }),
    }),

    terms:   s("textarea", false),
    privacy: s("textarea", false),
    mission: s("textarea", false),
    vision:  s("textarea", false),

    // Valores de la empresa (lista de textos)
    values: a(s("string", true), false),

    // Sucursales físicas
    branches: a(o({
      name: s("string", true),
      url:  s("url",    true),
      icon: s("string", false),
    }, true)),
  }, true),

  // Configuración del agente de IA asociado a la marca (contexto)
  agentAI: o({
    name:                 s("string",   true), // nombre interno
    displayName:          s("string",   true),
    role:                 s("string",   true),
    description:          s("textarea", true),
    tone:                 s("string",   true),
    greeting:             s("textarea", true),
    farewell:             s("textarea", true),
    unknown_response:     s("textarea", true),
    fallback_when_unsure: s("textarea", true),
  }),

  // Redes sociales
  socials: a(o({
    name:     s("string", true), // SocialMediaName
    url:      s("url",    true),
    username: s("string", false),
    icon:     s("string", false),
  }, true)),

  // Plataformas de venta / reseñas
  platforms: a(o({
    name: s("string", true), // sellsplatforms
    url:  s("url",    true),
    icon: s("string", false),
  }, true)),

  // Contacto principal
  contact: o({
    address: o({
      intNumber: s("string", false),
      extNumber: s("string", false),
      street:    s("string", false),
      city:      s("string", false),
      state:     s("string", false),
      zip:       s("string", false),
      country:   s("string", false),
      lat:       s("lat",    false, { min: -90,  max: 90 }),
      lng:       s("lng",    false, { min: -180, max: 180 }),
      zoom:      s("zoom",   false, { min: 1,    max: 22 }),
    }),
    phone:      s("phone",    false),
    email:      s("email",    false),
    whatsapp:   s("phone",    false),
    map:        s("url",      false),
    directions: s("textarea", false),
    google:     s("url",      false),
    googleMaps: s("url",      false),
  }),

  // Horario de operación
  schedule: a(o({
    day:    s("string", true),   // “Lunes”, “Monday”, etc.
    open:   s("string", false),  // hh:mm o lo que definas
    close:  s("string", false),
    closed: s("bool",   false),
  }, true), true),

  // Días festivos especiales
  holidays: a(o({
    name: s("string", true),
    date: s("string", true),   // ISO date (YYYY-MM-DD)
  }, true)),

  // Productos destacados
  products: a(o({
    prodName:    s("string",   true),
    description: s("textarea", false),
    price:       s("number",   true, { min: 0 }),
    image:       s("url",      false),
    video:       s("url",      false),
    gallery:     a(s("url",    true), false),
    url:         s("url",      false),
    category:    s("string",   false),
    subcategory: s("string",   false),
  }, true)),

  // Servicios
  services: a(o({
    servName:    s("string",   true),
    description: s("textarea", false),
    price:       s("number",   true, { min: 0 }),
    image:       s("url",      false),
    video:       s("url",      false),
    gallery:     a(s("url",    true), false),
    url:         s("url",      false),
  }, true)),

  // “Caja negra” para extensiones futuras por cliente
  more: o({}, false),
} as const satisfies FieldShape;

// ============================================================================
//  Mapeo metadata → tipos TS (lo que vive en Firestore = FDV)
// ============================================================================

type ScalarKindToType<K extends ScalarKind> =
  K extends "string" | "textarea" | "url" | "email" | "phone" ? string :
  K extends "number" ? number :
  K extends "lat"    ? Latitude :
  K extends "lng"    ? Longitude :
  K extends "zoom"   ? Zoom :
  K extends "angle"  ? MapAngle :
  K extends "bool"   ? boolean :
  never;

type FieldMetaToType<F extends FieldMeta> =
  F extends ObjectFieldMeta ? ShapeToType<F["shape"]> :
  F extends ArrayFieldMeta  ? Array<FieldMetaToType<F["of"]>> :
  F extends ScalarFieldMeta ? ScalarKindToType<F["kind"]> :
  never;

export type ShapeToType<S extends FieldShape> = { [K in keyof S]: FieldMetaToType<S[K]> };

// Tipo final de documento de branding en Firestore (FDV)
export type Branding = ShapeToType<typeof brandingSchema>;
