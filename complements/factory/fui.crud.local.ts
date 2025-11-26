// complements/factory/fui.crud.local.ts
// CRUD local de schemas (versión repo-local, no Firestore)

import fs from 'fs';
import path from 'path';
import type { PanelSchema } from './panelSchema.types';

/** Ruta base de schemas locales */
const SCHEMAS_DIR = path.join(process.cwd(), 'complements/factory/panelSchemas');

/** Lista todos los schemas .schema.ts dentro de panelSchemas */
export async function listPanelSchemasLocal(): Promise<string[]> {
  const files = fs.readdirSync(SCHEMAS_DIR);
  return files
    .filter((f) => f.endsWith('.schema.ts'))
    .map((f) => f.replace('.schema.ts', ''));
}

/** Lee un schema existente */
export async function readPanelSchemaLocal(id: string): Promise<string> {
  const filePath = path.join(SCHEMAS_DIR, `${id}.schema.ts`);
  if (!fs.existsSync(filePath)) throw new Error(`Schema no encontrado: ${id}`);
  return fs.readFileSync(filePath, 'utf8');
}

/** Guarda o actualiza un schema localmente */
export async function savePanelSchemaLocal(schema: PanelSchema): Promise<void> {
  if (!schema.id) throw new Error('El schema debe tener un ID.');
  const filePath = path.join(SCHEMAS_DIR, `${schema.id}.schema.ts`);

  const content = generateSchemaCode(schema);
  fs.writeFileSync(filePath, content, 'utf8');
}

/** Elimina un schema existente */
export async function deletePanelSchemaLocal(id: string): Promise<void> {
  const filePath = path.join(SCHEMAS_DIR, `${id}.schema.ts`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

/** Genera el código TypeScript del schema */
function generateSchemaCode(schema: PanelSchema): string {
  // 1) Roles seguros (fallback si no hay access/allowedRoles)
  const rawRoles =
    schema.access?.allowedRoles && schema.access.allowedRoles.length
      ? schema.access.allowedRoles
      : ["superadmin", "admin", "client"];

  const roles = rawRoles.map((r) => `'${r}'`).join(", ");

  // 2) Campos
  const fields = schema.fields
    .map(
      (f) =>
        `    {
      name: '${f.name}',
      type: '${f.type}',
      ${f.required ? "required: true," : ""}
      ${f.widget ? `widget: '${f.widget}',` : ""}
      ${f.groupKey ? `groupKey: '${f.groupKey}',` : ""}
    },`
    )
    .join("\n");

  // 3) fsCollection: si es Providers, usamos la constante; si no, string literal
  const fsCollectionExpr =
    schema.fsCollection && schema.fsCollection !== "Providers"
      ? `'${schema.fsCollection}'`
      : "PANEL_FS_COLLECTION_PROVIDERS";

  // 4) Flags y metadatos con fallback
  const isProvider = schema.isProvider ? "true" : "false";
  const isAgentFDV = schema.isAgentFDV ? "true" : "false";
  const iconKey = schema.iconKey ? `'${schema.iconKey}'` : `'${schema.id}'`;
  const source = schema.source ? `'${schema.source}'` : "'core'";
  const stage = schema.stage ? `'${schema.stage}'` : "'draft'";
  const version = schema.version ?? 1;

  return `import { PANEL_FS_COLLECTION_PROVIDERS, type PanelSchema } from '../panelSchema.types';

export const ${schema.id.toUpperCase()}_PANEL_SCHEMA: PanelSchema = {
  id: '${schema.id}',
  labelKey: '${schema.labelKey}',
  iconKey: ${iconKey},
  fsCollection: ${fsCollectionExpr},
  fsDocId: '${schema.fsDocId}',
  isProvider: ${isProvider},
  isAgentFDV: ${isAgentFDV},
  source: ${source},
  stage: ${stage},
  access: { allowedRoles: [${roles}] },
  version: ${version},
  fields: [
${fields}
  ],
};
`;
}
