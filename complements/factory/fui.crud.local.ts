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
  const roles = schema.access.allowedRoles.map((r) => `'${r}'`).join(', ');
  const fields = schema.fields
    .map(
      (f) =>
        `    {
      name: '${f.name}',
      type: '${f.type}',
      ${f.required ? 'required: true,' : ''}
      ${f.widget ? `widget: '${f.widget}',` : ''}
      ${f.groupKey ? `groupKey: '${f.groupKey}',` : ''}
    },`
    )
    .join('\n');

  return `import { PANEL_FS_COLLECTION_PROVIDERS, type PanelSchema } from '../panelSchema.types';

export const ${schema.id.toUpperCase()}_PANEL_SCHEMA: PanelSchema = {
  id: '${schema.id}',
  labelKey: '${schema.labelKey}',
  fsCollection: ${schema.fsCollection || 'PANEL_FS_COLLECTION_PROVIDERS'},
  fsDocId: '${schema.fsDocId}',
  isProvider: ${schema.isProvider},
  access: { allowedRoles: [${roles}] },
  version: ${schema.version ?? 1},
  fields: [
${fields}
  ],
};
`;
}
