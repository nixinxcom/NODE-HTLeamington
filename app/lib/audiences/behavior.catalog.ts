// app/lib/audiences/behavior.catalog.ts

// 1) DOMINIOS: describen "dónde / qué tipo de elemento" se está usando
export const BEHAVIOR_DOMAINS = [
  "navigation",
  "content",
  "commerce",
  "booking",
  "engagement",
  "account",
  "support",
  "system",
  "custom", // reservado para cosas específicas por negocio
] as const;

export type BehaviorDomain = (typeof BEHAVIOR_DOMAINS)[number];

// 2) CATEGORÍAS DE NEGOCIO (Category):
// impacto / intención de la acción

// Segmento: Session Behaviour (no UTMs)
export const BEHAVIOR_CATEGORIES_SESSION = [
  "agentAI",              // interacciones con agentes de IA
  "brand",                // marca, awareness, anuncios
  "claims",               // quejas, reclamaciones, devoluciones
  "compliance",           // normatividad, políticas, consentimientos
  "customer_acquisition", // leads, suscripciones, registros
  "customer_experience",  // experiencia del cliente, NPS, journeys
  "customer_service",     // servicio al cliente / soporte
  "difussion",            // difusión general (broadcast, masificación)
  "desired",              // comportamiento deseado / meta
  "expenses",             // gastos, costos, egresos
  "feedback",             // feedback / reviews / opiniones
  "marketing",            // marketing general, campañas cross-canal
  "operations",           // operaciones internas / procesos
  "operative",            // operación táctica / día a día
  "priority",             // elementos/casos de alta prioridad
  "process",              // procesos específicos a medir
  "revenue",              // ventas directas: compras, reservas, upsell
  "strategic",            // acciones estratégicas, VIP, especiales
  "support",              // soporte genérico (si quieres diferenciarlo)
  "survey",               // encuestas (internas o externas)
  "team_suggestions",     // sugerencias internas del equipo
  "training",             // capacitación (staff o cliente)
  "undesired",            // comportamiento no deseado
] as const;

// Segmento: UTMs
export const BEHAVIOR_CATEGORIES_UTM = [
  "emailUTM",             // tráfico/campañas etiquetadas por UTMs de email
  "smsUTM",               // tráfico/campañas etiquetadas por UTMs de SMS
  "socialUTM",            // tráfico/campañas etiquetadas por UTMs sociales
] as const;

export type BehaviorCategory =
  | (typeof BEHAVIOR_CATEGORIES_SESSION)[number]
  | (typeof BEHAVIOR_CATEGORIES_UTM)[number];

// Array combinado (por si necesitas iterar todas juntas)
export const BEHAVIOR_CATEGORIES: readonly BehaviorCategory[] = [
  ...BEHAVIOR_CATEGORIES_SESSION,
  ...BEHAVIOR_CATEGORIES_UTM,
];

// 3) TIPOS DE EVENTO (Trigger):
// "qué acción ocurrió"
export const BEHAVIOR_EVENT_TYPES = [
  "view",
  "impression",
  "click",
  "submit",
  "change",
  "play",
  "pause",
  "start",
  "complete",
  "error",
  "open",
  "close",
  "system",
] as const;

export type BehaviorEventType = (typeof BEHAVIOR_EVENT_TYPES)[number];
