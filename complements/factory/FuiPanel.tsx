// complements/factory/FuiPanel.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  DIV,
  SPAN,
  P,
  LABEL,
  INPUT,
  SELECT,
  BUTTON,
} from '@/complements/components/ui/wrappers';

import FM from '@/complements/i18n/FM';

import {
  type PanelSchema,
  type PanelField,
  type PanelFieldType,
  type PanelFieldWidget,
  type PanelFieldOption,
  type PanelRole,
} from './panelSchema.types';

import { PANEL_SCHEMAS } from './panelSchemas';

import {
  fuiListSchemas,
  fuiLoadSchema,
  fuiSaveSchema,
  fuiDeleteSchema,
  type FuiSchemaSummary,
} from './fui.crud';

type FuiPanelProps = {
  locale: string;
};

const PANEL_ROLES: PanelRole[] = ['superadmin', 'admin', 'client', 'enduser'];

function isPanelRole(v: string): v is PanelRole {
  return (PANEL_ROLES as string[]).includes(v);
}

/**
 * Normaliza un PanelSchema para que el FUI sea consistente,
 * pero SIN tocar nada que ya exista (idempotente para esquemas ya normalizados).
 *
 * Reglas:
 * - Clona profundo para no mutar PANEL_SCHEMAS ni lo que venga de Firestore.
 * - Solo rellena defaults si faltan (labelKey, fsDocId, access, isProvider, version).
 * - Para fields:
 *   - Si ya tienen groupKey, se respetan 100% (mismo objeto, misma orden de props).
 *   - Si NO tienen groupKey, se calcula desde el primer segmento de name.
 */
function normalizeSchemaForFui(input: PanelSchema): PanelSchema {
  // Clon profundo para no mutar la fuente
  const schema: PanelSchema = JSON.parse(JSON.stringify(input));

  // Defaults a nivel panel SOLO si faltan
  if ((!schema.labelKey || schema.labelKey.trim() === '') && schema.id) {
    schema.labelKey = `panels.${schema.id}.title`;
  }

  if (!schema.fsDocId && schema.id) {
    schema.fsDocId = schema.id;
  }

  if (!schema.iconKey && schema.id) {
    schema.iconKey = schema.id;
  }

  if (
    !schema.access ||
    !Array.isArray(schema.access.allowedRoles) ||
    schema.access.allowedRoles.length === 0
  ) {
    schema.access = { allowedRoles: ['superadmin'] };
  }

  if (schema.isProvider === undefined || schema.isProvider === null) {
    schema.isProvider = false;
  }

  if (schema.version === undefined || schema.version === null) {
    schema.version = 1;
  }

  // groupKey por campo SOLO si falta
  schema.fields = (schema.fields || []).map((field) => {
    if (field.groupKey) {
      // Ya está definido → se respeta tal cual (no cambiamos orden de props)
      return field;
    }

    const pathSegments = (field.name || '').split('.').filter(Boolean);
    const groupKey =
      pathSegments.length > 0 ? pathSegments[0] : 'general';

    // Creamos un nuevo objeto SOLO en este caso
    return {
      ...field,
      groupKey,
    };
  });

  return schema;
}

// ---------------------------------------------------------------------------
// i18n IDs dinámicos de paneles (PUI), no del FUI
// ---------------------------------------------------------------------------

function buildI18nIds(schema: PanelSchema): Record<string, string> {
  const out: Record<string, string> = {};

  // ── Título del panel ──
  if (schema.labelKey) {
    out[schema.labelKey] = 'Panel title';
  }

  const visitField = (
    field: PanelField,
    group: string,
    relPath: string,
  ): void => {
    // OBJECT → recursamos a subcampos
    if (field.type === 'object') {
      const anyField = field as any;
      const subFields: PanelField[] = Array.isArray(anyField.fields)
        ? anyField.fields
        : [];

      for (const sub of subFields) {
        const childRel = relPath
          ? `${relPath}.${sub.name || ''}`
          : (sub.name || '');
        visitField(sub, group, childRel);
      }
      return;
    }

    // ARRAY
    if (field.type === 'array') {
      const arr: any = field;
      const element: PanelField | undefined = arr.element;

      // Arrays de objetos → generamos IDs para subcampos
      if (element && element.type === 'object') {
        const subFields: PanelField[] = Array.isArray(element.fields)
          ? element.fields
          : [];

        for (const sub of subFields) {
          const childRel = sub.name || '';
          visitField(sub, group, childRel);
        }
        return;
      }

      // Arrays escalares → 1 label para el conjunto
      const effective = relPath || field.name || '';
      const segments = effective.split('.').filter(Boolean);
      const shortName =
        segments[segments.length - 1] || field.name || 'items';

      const base = `${schema.id}.${group}.${shortName}`;

      const labelDefault =
        (field as any).labelKey?.trim() || shortName;
      const descDefault =
        (field as any).descriptionKey?.trim() ||
        `${shortName}.Description`;

      out[`${base}.Labelkey`] = labelDefault;
      out[`${base}.Description`] = descDefault;

      return;
    }

    // ESCALAR
    const effective = relPath || field.name || '';
    const segments = effective.split('.').filter(Boolean);
    const shortName =
      segments[segments.length - 1] || field.name || 'field';

    const base = `${schema.id}.${group}.${shortName}`;

    const labelDefault =
      (field as any).labelKey?.trim() || shortName;
    const descDefault =
      (field as any).descriptionKey?.trim() ||
      `${shortName}.Description`;

    out[`${base}.Labelkey`] = labelDefault;
    out[`${base}.Description`] = descDefault;

    // Opciones para selects / radios
    const widget = field.widget as PanelFieldWidget | undefined;
    const type = field.type as PanelFieldType;

    const hasOptions =
      type === 'select' ||
      type === 'multiselect' ||
      widget === 'select' ||
      widget === 'multiselect' ||
      widget === 'radio';

    if (hasOptions && Array.isArray((field as any).options)) {
      for (const opt of (field as any).options as PanelFieldOption[]) {
        if (!opt?.value) continue;
        const key = `${base}.option.${opt.value}`;
        out[key] = opt.labelKey || opt.value;
      }
    }
  };

  // Top-level: recorremos los campos
  for (const field of schema.fields) {
    const rawName = field.name || '';
    const segs = rawName.split('.').filter(Boolean);

    const group = field.groupKey || segs[0] || 'root';

    let relPath = '';
    if (segs.length > 0 && segs[0] === group) {
      relPath = segs.slice(1).join('.');
    } else {
      relPath = segs.join('.');
    }

    visitField(field, group, relPath);
  }

  return out;
}

// ---------------------------------------------------------------------------
// Tipos auxiliares de agrupación
// ---------------------------------------------------------------------------

type GroupBucket = {
  id: string;
  label: string;
  indexes: number[];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FuiPanel({ locale }: FuiPanelProps) {
  const [savedSchemas, setSavedSchemas] = useState<FuiSchemaSummary[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const [schema, setSchema] = useState<PanelSchema | null>(null);
  const [basePanelId, setBasePanelId] = useState('');
  const [savedSchemaId, setSavedSchemaId] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const [copiedI18n, setCopiedI18n] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // ---- Cargar lista de schemas guardados en FactorySchemas ----
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingSaved(true);
      try {
        const list = await fuiListSchemas();
        if (!cancelled) setSavedSchemas(list);
      } catch (err) {
        console.error('[FUI] Error listando FactorySchemas', err);
        if (!cancelled) setError('load-schemas');
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Handlers de selección de schema ----

  const handlePickBaseSchema = (id: string) => {
    setBasePanelId(id);
    setSavedSchemaId('');
    setError(null);
    setCopiedI18n(false);
    setCopiedSchema(false);
    setOpenGroups({});

    if (!id) {
      setSchema(null);
      return;
    }

    const base = (PANEL_SCHEMAS as Record<string, PanelSchema | undefined>)[id];
    if (!base) {
      setSchema(null);
      return;
    }

    const working: PanelSchema = normalizeSchemaForFui(base);
    setSchema(working);
  };

  const handlePickSavedSchema = async (id: string) => {
    setSavedSchemaId(id);
    setBasePanelId('');
    setError(null);
    setCopiedI18n(false);
    setCopiedSchema(false);
    setOpenGroups({});

    if (!id) {
      setSchema(null);
      return;
    }

    try {
      const loaded = await fuiLoadSchema(id);
      if (!loaded) {
        setSchema(null);
        return;
      }
      setSchema(normalizeSchemaForFui(loaded));
    } catch (err) {
      console.error('[FUI] Error cargando schema guardado', err);
      setError('load-one');
    }
  };

  const handleNewEmptyPanel = () => {
    setBasePanelId('');
    setSavedSchemaId('');
    setError(null);
    setCopiedI18n(false);
    setCopiedSchema(false);
    setOpenGroups({});

    const empty: PanelSchema = {
      id: '',
      labelKey: '',
      iconKey: '',
      fsCollection: 'Providers',
      fsDocId: '',
      isProvider: true,
      access: { allowedRoles: ['superadmin'] },
      fields: [],
      version: 1,
    };

    setSchema(empty);
  };

  // ---- Helpers de actualización ----

  const updatePanel = (patch: Partial<PanelSchema>) => {
    setSchema((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleChangePanelProp = (field: keyof PanelSchema, value: any) => {
    if (field === 'id') {
      const cleanId = (String(value) || '').trim();

      setSchema((prev) => {
        if (!prev) return prev;

        const nextId = cleanId;

        return {
          ...prev,
          id: nextId,
          fsDocId: nextId,
          iconKey: nextId,
          labelKey: nextId
            ? `panels.${nextId}.title`
            : prev.labelKey,
        };
      });
    } else {
      updatePanel({ [field]: value } as any);
    }

    setCopiedI18n(false);
    setCopiedSchema(false);
  };

  const handleChangeRoles = (value: string) => {
    const parts = value
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
      .filter(isPanelRole);

    updatePanel({
      access: { allowedRoles: parts.length ? parts : ['superadmin'] },
    });
    setCopiedI18n(false);
    setCopiedSchema(false);
  };

  const handleToggleRole = (role: PanelRole, enabled: boolean) => {
    setSchema((prev) => {
      if (!prev) return prev;

      const current = prev.access?.allowedRoles ?? ['superadmin'];
      let next: PanelRole[];

      if (enabled) {
        next = Array.from(new Set([...current, role])) as PanelRole[];
      } else {
        next = current.filter((r) => r !== role) as PanelRole[];
        if (next.length === 0) {
          next = ['superadmin'];
        }
      }

      return { ...prev, access: { allowedRoles: next } };
    });

    setCopiedI18n(false);
    setCopiedSchema(false);
  };

  const handleAddField = (groupKey?: string) => {
    if (!schema) return;

    const index = schema.fields.length + 1;
    const g = groupKey && groupKey.trim() ? groupKey.trim() : 'general';

    const newField: PanelField = {
      name: `field${index}`,
      type: 'string',
      required: false,
      groupKey: g,
      translatable: false,
      widget: 'input',
      order: index,
    } as any;

    // Nuevo campo al inicio
    setSchema({ ...schema, fields: [newField, ...schema.fields] });
    setCopiedI18n(false);
    setCopiedSchema(false);
  };

  const handleAddGroupWithField = () => {
    if (!schema) return;

    const raw = window.prompt(
      'Nombre interno del nuevo grupo (groupKey). Ej: company, contact, pwa...',
    );
    if (!raw) return;

    const g = raw.trim();
    if (!g) return;

    handleAddField(g);

    setOpenGroups((prev) => ({
      ...prev,
      [g]: true,
    }));
  };

  const handleUpdateField = (idx: number, patch: Partial<PanelField>) => {
    setSchema((prev) => {
      if (!prev) return prev;
      const fields = [...prev.fields];
      const current = fields[idx];
      if (!current) return prev;

      const merged: PanelField = { ...(current as any), ...(patch as any) };
      fields[idx] = merged;

      return { ...prev, fields };
    });
    setCopiedI18n(false);
    setCopiedSchema(false);
  };

  /** Actualiza solo el "shortName" (último segmento) del name */
  const handleChangeFieldNameShort = (idx: number, shortName: string) => {
    setSchema((prev) => {
      if (!prev) return prev;
      const fields = [...prev.fields];
      const current = fields[idx];
      if (!current) return prev;

      const trimmed = shortName.trim() || 'field';

      const rawName = current.name || '';
      const segments = rawName.split('.').filter(Boolean);

      let prefixSegments: string[] = [];

      if (segments.length > 1) {
        prefixSegments = segments.slice(0, -1);
      } else {
        prefixSegments = [];
      }

      const newFullName = prefixSegments.length
        ? `${prefixSegments.join('.')}.${trimmed}`
        : trimmed;

      fields[idx] = { ...(current as any), name: newFullName };
      return { ...prev, fields };
    });
    setCopiedI18n(false);
    setCopiedSchema(false);
  };

  const handleDeleteField = (idx: number) => {
    setSchema((prev) => {
      if (!prev) return prev;
      const next = [...prev.fields];
      next.splice(idx, 1);
      return { ...prev, fields: next };
    });
    setCopiedI18n(false);
    setCopiedSchema(false);
  };

  const handleSaveSchema = async () => {
    if (!schema) return;

    const cleanId = (schema.id || '').trim();
    if (!cleanId) {
      alert('El schema necesita un id interno.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const normalized: PanelSchema = normalizeSchemaForFui({
        ...schema,
        id: cleanId,
      });

      await fuiSaveSchema(normalized);

      const list = await fuiListSchemas();
      setSavedSchemas(list);
      setSavedSchemaId(cleanId);
      setBasePanelId('');
    } catch (err) {
      console.error('[FUI] Error guardando schema', err);
      setError('save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchema = async () => {
    if (!savedSchemaId) return;

    const ok = window.confirm(
      `¿Eliminar el schema "${savedSchemaId}" de FactorySchemas?`,
    );
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      await fuiDeleteSchema(savedSchemaId);

      const list = await fuiListSchemas();
      setSavedSchemas(list);
      setSavedSchemaId('');
      setSchema(null);
    } catch (err) {
      console.error('[FUI] Error eliminando schema', err);
      setError('delete');
    } finally {
      setDeleting(false);
    }
  };

  const i18nIdsText = useMemo(() => {
    if (!schema || !schema.id) return '';
    return JSON.stringify(buildI18nIds(schema), null, 2);
  }, [schema]);

  const currentRoles = useMemo(() => {
    const roles = schema?.access?.allowedRoles ?? ['superadmin'];
    return roles.join(', ');
  }, [schema]);

  // Agrupar campos
  const groupedFields = useMemo<GroupBucket[]>(() => {
    if (!schema) return [];

    const buckets = new Map<string, GroupBucket>();

    schema.fields.forEach((field, idx) => {
      const seg0 = field.name?.split('.').filter(Boolean)[0];
      const bucketId = field.groupKey || seg0 || 'general';
      const labelCandidate = field.groupKey || bucketId;

      if (!buckets.has(bucketId)) {
        buckets.set(bucketId, {
          id: bucketId,
          label: labelCandidate,
          indexes: [],
        });
      } else {
        const bucket = buckets.get(bucketId)!;
        if (!bucket.label && labelCandidate) {
          bucket.label = labelCandidate;
        }
      }

      buckets.get(bucketId)!.indexes.push(idx);
    });

    return Array.from(buckets.values());
  }, [schema]);

  const schemaCodeText = useMemo(() => {
    if (!schema) return '';

    const baseId = schema.id || 'panel';
    const constName =
      `${baseId}_PANEL_SCHEMA`
        .replace(/[^A-Za-z0-9_]/g, '_')
        .toUpperCase();

    const plain: any = JSON.parse(JSON.stringify(schema));

    return [
      `import type { PanelSchema } from '@/complements/factory/panelSchema.types';`,
      '',
      `export const ${constName}: PanelSchema = ${JSON.stringify(
        plain,
        null,
        2,
      )};`,
      '',
    ].join('\n');
  }, [schema]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? true),
    }));
  };

  const handleCopyI18nIds = async () => {
    if (!i18nIdsText) return;
    try {
      await navigator.clipboard.writeText(i18nIdsText);
      setCopiedI18n(true);
      setTimeout(() => setCopiedI18n(false), 1500);
    } catch (err) {
      console.error('[FUI] Error copiando i18n IDs', err);
    }
  };

  const handleCopySchemaCode = async () => {
    if (!schemaCodeText) return;
    try {
      await navigator.clipboard.writeText(schemaCodeText);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 1500);
    } catch (err) {
      console.error('[FUI] Error copiando schema code', err);
    }
  };

  // =================== RENDER ===================

  return (
    <DIV className="p-4 flex flex-col gap-6">
      <DIV className="mb-4 flex flex-col gap-1">
        <SPAN className="text-xl font-bold">
          <FM
            id="admin.FuiPanel.title"
            defaultMessage="Factory UI · Constructor de Paneles"
          />
        </SPAN>
        <P className="text-sm opacity-75">
          <FM
            id="admin.FuiPanel.description"
            defaultMessage="Aquí defines los objetos PanelSchema que alimentan el PUI (branding, settings, etc.). Primero elige un esquema guardado o un esquema base y luego ajusta campos, grupos e IDs."
          />
        </P>
        <P className="text-[11px] opacity-60">
          <FM
            id="admin.FuiPanel.localeLabel"
            defaultMessage="Locale actual:"
          />{' '}
          <SPAN className="font-mono">{locale}</SPAN>
        </P>
      </DIV>

      {/* SELECTORES PRINCIPALES */}
      <DIV className="flex flex-col md:flex-row md:items-end gap-4">
        <DIV className="flex-1">
          <LABEL className="text-xs font-semibold">
            <FM
              id="admin.FuiPanel.savedSchema.label"
              defaultMessage="Esquema guardado en FactorySchemas"
            />
          </LABEL>
          <SELECT
            value={savedSchemaId}
            onChange={(e) => handlePickSavedSchema(e.target.value)}
          >
            <option value="">
              <FM
                id="admin.FuiPanel.savedSchema.placeholder"
                defaultMessage="— Selecciona un panel —"
              />
            </option>
            {savedSchemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.fsCollection}/{s.fsDocId}
              </option>
            ))}
          </SELECT>
          {loadingSaved && (
            <P className="text-xs opacity-60 mt-1">
              <FM
                id="admin.FuiPanel.savedSchema.loading"
                defaultMessage="Cargando lista de esquemas…"
              />
            </P>
          )}
        </DIV>

        <DIV className="flex-1">
          <LABEL className="text-xs font-semibold">
            <FM
              id="admin.FuiPanel.baseSchema.label"
              defaultMessage="Esquema base (PANEL_SCHEMAS)"
            />
          </LABEL>
          <SELECT
            value={basePanelId}
            onChange={(e) => handlePickBaseSchema(e.target.value)}
          >
            <option value="">
              <FM
                id="admin.FuiPanel.baseSchema.placeholder"
                defaultMessage="— Ninguno / vacío —"
              />
            </option>
            {Object.values(PANEL_SCHEMAS).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.fsCollection}/{s.fsDocId}
              </option>
            ))}
          </SELECT>
        </DIV>

        <DIV className="flex flex-row flex-wrap gap-2">
          <BUTTON type="button" kind="button" onClick={handleNewEmptyPanel}>
            <FM
              id="admin.FuiPanel.button.newEmpty"
              defaultMessage="Nuevo panel vacío"
            />
          </BUTTON>
          <BUTTON
            type="button"
            kind="button"
            onClick={handleSaveSchema}
            disabled={!schema || saving}
          >
            {saving ? (
              <FM
                id="admin.FuiPanel.button.saving"
                defaultMessage="Guardando…"
              />
            ) : (
              <FM
                id="admin.FuiPanel.button.save"
                defaultMessage="Guardar schema"
              />
            )}
          </BUTTON>
          <BUTTON
            type="button"
            kind="button"
            onClick={handleDeleteSchema}
            disabled={!savedSchemaId || deleting}
          >
            {deleting ? (
              <FM
                id="admin.FuiPanel.button.deleting"
                defaultMessage="Eliminando…"
              />
            ) : (
              <FM
                id="admin.FuiPanel.button.delete"
                defaultMessage="Eliminar"
              />
            )}
          </BUTTON>
        </DIV>
      </DIV>

      {error && (
        <DIV className="border border-red-700 bg-red-950/40 text-red-200 text-xs px-3 py-2 rounded">
          {error === 'load-schemas' && (
            <FM
              id="admin.FuiPanel.error.loadSchemas"
              defaultMessage="Error al listar los schemas."
            />
          )}
          {error === 'load-one' && (
            <FM
              id="admin.FuiPanel.error.loadOne"
              defaultMessage="Error al cargar el schema seleccionado."
            />
          )}
          {error === 'save' && (
            <FM
              id="admin.FuiPanel.error.save"
              defaultMessage="Error al guardar el schema."
            />
          )}
          {error === 'delete' && (
            <FM
              id="admin.FuiPanel.error.delete"
              defaultMessage="Error al eliminar el schema."
            />
          )}
        </DIV>
      )}

      {!schema && (
        <DIV className="text-sm opacity-70">
          <FM
            id="admin.FuiPanel.emptyHint"
            defaultMessage="Elige un esquema guardado o un esquema base, o crea uno vacío para empezar."
          />
        </DIV>
      )}

      {schema && (
        <>
          {/* METADATA DEL PANEL */}
          <DIV className="border border-white/10 rounded-lg p-4 flex flex-col gap-3 bg-black/40">
            <SPAN className="font-semibold text-sm uppercase tracking-wide">
              <FM
                id="admin.FuiPanel.section.metadata"
                defaultMessage="Metadatos del panel"
              />
            </SPAN>

            <DIV className="grid md:grid-cols-3 gap-3">
              {/* Id interno */}
              <DIV className="flex flex-col gap-1">
                <LABEL className="text-xs font-semibold">
                  <FM
                    id="admin.FuiPanel.meta.id"
                    defaultMessage="Id (interno)"
                  />
                </LABEL>
                <INPUT
                  type="text"
                  value={schema.id}
                  onChange={(e) =>
                    handleChangePanelProp('id', e.target.value)
                  }
                />
              </DIV>

              {/* Roles (checkboxes) */}
              <DIV className="flex flex-col gap-1">
                <LABEL className="text-xs font-semibold">
                  <FM
                    id="admin.FuiPanel.meta.roles"
                    defaultMessage="Roles permitidos"
                  />
                </LABEL>
                <DIV className="flex flex-wrap gap-3 text-xs">
                  {PANEL_ROLES.map((role) => {
                    const checked =
                      schema.access?.allowedRoles?.includes(role) ?? false;
                    return (
                      <label key={role} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            handleToggleRole(role, e.target.checked)
                          }
                        />
                        <SPAN className="font-mono">{role}</SPAN>
                      </label>
                    );
                  })}
                </DIV>
              </DIV>
              <DIV className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!schema.isProvider}
                  onChange={(e) =>
                    handleChangePanelProp('isProvider', e.target.checked)
                  }
                />
                <SPAN className="text-xs">
                  <FM
                    id="admin.FuiPanel.meta.isProvider"
                    defaultMessage="isProvider (alimenta FDV / Providers)"
                  />
                </SPAN>
              </DIV>
            </DIV>

            {/* isProvider + resumen técnico */}
            <DIV className="flex flex-col gap-1 mt-2">
                <P className="text-[11px] opacity-60 mt-1">
                  <SPAN className="font-mono">
                    fsCollection: {schema.fsCollection || 'Providers'}
                  </SPAN>{' '}
                  ·{' '}
                  <SPAN className="font-mono">
                    fsDocId: {schema.fsDocId || schema.id || '—'}
                  </SPAN>{' '}
                  ·{' '}
                  <SPAN className="font-mono">
                    iconKey: {schema.iconKey || schema.id || '—'}
                  </SPAN>{' '}
                  ·{' '}
                  <SPAN className="font-mono">
                    labelKey:{' '}
                    {schema.labelKey ||
                      (schema.id ? `panels.${schema.id}.title` : '—')}
                  </SPAN>
                </P>
            </DIV>
          </DIV>

          {/* CAMPOS AGRUPADOS CON ACORDEONES */}
          <DIV className="border border-white/10 rounded-lg p-4 flex flex-col gap-4 bg-black/40">
            <DIV className="flex items-center justify-between gap-2 flex-wrap">
              <SPAN className="font-semibold text-sm uppercase tracking-wide">
                <FM
                  id="admin.FuiPanel.section.fields"
                  defaultMessage="Campos"
                />
              </SPAN>
              <DIV className="flex gap-2">
                <BUTTON
                  type="button"
                  kind="button"
                  onClick={() => handleAddField()}
                >
                  <FM
                    id="admin.FuiPanel.button.addFieldGeneral"
                    defaultMessage="+ Campo (general)"
                  />
                </BUTTON>
                <BUTTON
                  type="button"
                  kind="button"
                  onClick={handleAddGroupWithField}
                >
                  <FM
                    id="admin.FuiPanel.button.addGroup"
                    defaultMessage="+ Grupo nuevo"
                  />
                </BUTTON>
              </DIV>
            </DIV>

            <DIV className="flex flex-col gap-3">
              {groupedFields.map(({ id, label, indexes }) => {
                const isOpen = openGroups[id] ?? true;
                const groupLabel = label || id || 'Sin grupo';

                return (
                  <DIV
                    key={id}
                    className="border border-white/15 rounded-md overflow-hidden bg-black/50"
                  >
                    {/* Header del acordeón (click = toggle) */}
                    <DIV
                      className="flex items-center justify-between px-3 py-2 bg-black/70 cursor-pointer select-none"
                      onClick={() => toggleGroup(id)}
                    >
                      <DIV className="flex flex-col">
                        <SPAN className="text-sm font-semibold">
                          {(isOpen ? '▽ ' : '▷ ') + groupLabel}
                        </SPAN>
                        <SPAN className="text-[10px] opacity-60">
                          <FM
                            id="admin.FuiPanel.group.count"
                            defaultMessage="{count, plural, one {# campo} other {# campos}}"
                            values={{ count: indexes.length }}
                          />
                        </SPAN>
                      </DIV>
                      <DIV className="flex items-center gap-2">
                        <BUTTON
                          type="button"
                          kind="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddField(id);
                          }}
                        >
                          <FM
                            id="admin.FuiPanel.button.addFieldGroup"
                            defaultMessage="+ Campo"
                          />
                        </BUTTON>
                      </DIV>
                    </DIV>

                    {/* Contenido */}
                    {isOpen && (
                      <DIV className="p-3 flex flex-col gap-3">
                        {indexes.map((idx) => {
                          const field = schema.fields[idx];
                          const fullName = field.name || '';
                          const pathSegments = fullName
                            .split('.')
                            .filter(Boolean);
                          const shortName =
                            pathSegments[pathSegments.length - 1] || '';
                          const isTextLike =
                            field.type === 'string' || field.type === 'text';

                          return (
                            <DIV
                              key={idx}
                              className="relative flex flex-col gap-2 border border-white/10 rounded-md p-3 bg-black/30"
                            >
                              {/* Botón de eliminar */}
                              <DIV className="absolute top-2 right-2">
                                <BUTTON
                                  type="button"
                                  kind="button"
                                  onClick={() => handleDeleteField(idx)}
                                  aria-label="Eliminar campo"
                                >
                                  🗑
                                </BUTTON>
                              </DIV>

                              {/* Fila principal */}
                              <DIV className="grid md:grid-cols-12 gap-2 items-end">
                                {/* Nombre interno */}
                                <DIV className="flex flex-col gap-1 md:col-span-3">
                                  <LABEL className="text-xs font-semibold">
                                    <FM
                                      id="admin.FuiPanel.field.internalName"
                                      defaultMessage="Titulo (Title)"
                                    />
                                  </LABEL>
                                  <INPUT
                                    type="text"
                                    value={shortName}
                                    onChange={(e) =>
                                      handleChangeFieldNameShort(
                                        idx,
                                        e.target.value,
                                      )
                                    }
                                  />
                                </DIV>

                                {/* Tipo */}
                                <DIV className="flex flex-col gap-1 md:col-span-2">
                                  <LABEL className="text-xs font-semibold">
                                    <FM
                                      id="admin.FuiPanel.field.type"
                                      defaultMessage="Tipo (type)"
                                    />
                                  </LABEL>
                                  <SELECT
                                    value={field.type}
                                    onChange={(e) =>
                                      handleUpdateField(idx, {
                                        type: e.target
                                          .value as PanelFieldType,
                                      })
                                    }
                                  >
                                    <option value="string">string</option>
                                    <option value="text">text</option>
                                    <option value="number">number</option>
                                    <option value="boolean">boolean</option>
                                    <option value="date">date</option>
                                    <option value="select">select</option>
                                    <option value="multiselect">
                                      multiselect
                                    </option>
                                    <option value="object">object</option>
                                    <option value="array">array</option>
                                  </SELECT>
                                </DIV>

                                {/* Orden */}
                                <DIV className="flex flex-col gap-1 md:col-span-1">
                                  <LABEL className="text-xs font-semibold">
                                    <FM
                                      id="admin.FuiPanel.field.order"
                                      defaultMessage="Orden"
                                    />
                                  </LABEL>
                                  <INPUT
                                    type="number"
                                    value={(field as any).order ?? idx + 1}
                                    onChange={(e) =>
                                      handleUpdateField(idx, {
                                        order:
                                          e.target.value === ''
                                            ? undefined
                                            : Number(e.target.value),
                                      } as any)
                                    }
                                  />
                                </DIV>

                                {/* Flags */}
                                <DIV className="flex flex-col gap-1 md:col-span-2">
                                  <LABEL className="text-xs font-semibold">
                                    <FM
                                      id="admin.FuiPanel.field.flags"
                                      defaultMessage="Flags"
                                    />
                                  </LABEL>
                                  <DIV className="flex flex-wrap items-center gap-3">
                                    <label className="flex items-center gap-1 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={field.required === true}
                                        onChange={(e) =>
                                          handleUpdateField(idx, {
                                            required: e.target.checked,
                                          })
                                        }
                                      />
                                      <span>
                                        <FM
                                          id="admin.FuiPanel.field.flags.required"
                                          defaultMessage="Required"
                                        />
                                      </span>
                                    </label>
                                    <label className="flex items-center gap-1 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={field.translatable === true}
                                        onChange={(e) =>
                                          handleUpdateField(idx, {
                                            translatable: e.target.checked,
                                          })
                                        }
                                      />
                                      <span>
                                        <FM
                                          id="admin.FuiPanel.field.flags.translatable"
                                          defaultMessage="Translatable (valor por idioma)"
                                        />
                                      </span>
                                    </label>
                                  </DIV>
                                </DIV>

                                {/* Widget sugerido */}
                                <DIV className="flex flex-col gap-1 md:col-span-2">
                                  <LABEL className="text-xs font-semibold">
                                    <FM
                                      id="admin.FuiPanel.field.widget"
                                      defaultMessage="Widget sugerido"
                                    />
                                  </LABEL>
                                  <SELECT
                                    value={field.widget || ''}
                                    onChange={(e) =>
                                      handleUpdateField(idx, {
                                        widget: e.target.value || undefined,
                                      })
                                    }
                                  >
                                    <option value="">
                                      (auto por tipo)
                                    </option>
                                    <option value="input">input</option>
                                    <option value="textarea">textarea</option>
                                    <option value="color">color</option>
                                    <option value="image">image (URL)</option>
                                    <option value="file">file</option>
                                    <option value="select">select</option>
                                    <option value="multiselect">
                                      multiselect
                                    </option>
                                    <option value="radio">radio</option>
                                    <option value="code">code</option>
                                    <option value="json">json</option>
                                  </SELECT>
                                </DIV>

                                {/* Min / Max para texto */}
                                {isTextLike && (
                                  <>
                                    <DIV className="flex flex-col gap-1 md:col-span-1">
                                      <LABEL className="text-xs font-semibold">
                                        <FM
                                          id="admin.FuiPanel.field.minLength"
                                          defaultMessage="Min length (texto)"
                                        />
                                      </LABEL>
                                      <INPUT
                                        type="number"
                                        value={(field as any).minLength ?? ''}
                                        onChange={(e) =>
                                          handleUpdateField(idx, {
                                            minLength:
                                              e.target.value === ''
                                                ? undefined
                                                : Number(e.target.value),
                                          } as any)
                                        }
                                      />
                                    </DIV>
                                    <DIV className="flex flex-col gap-1 md:col-span-1">
                                      <LABEL className="text-xs font-semibold">
                                        <FM
                                          id="admin.FuiPanel.field.maxLength"
                                          defaultMessage="Max length (texto)"
                                        />
                                      </LABEL>
                                      <INPUT
                                        type="number"
                                        value={(field as any).maxLength ?? ''}
                                        onChange={(e) =>
                                          handleUpdateField(idx, {
                                            maxLength:
                                              e.target.value === ''
                                                ? undefined
                                                : Number(e.target.value),
                                          } as any)
                                        }
                                      />
                                    </DIV>
                                  </>
                                )}
                              </DIV>

                              {/* Opciones para selects/multiselect/radio */}
                              {(field.type === 'select' ||
                                field.type === 'multiselect' ||
                                field.widget === 'select' ||
                                field.widget === 'multiselect' ||
                                field.widget === 'radio') && (
                                <DIV className="flex flex-col gap-1">
                                  <LABEL className="text-xs font-semibold">
                                    <FM
                                      id="admin.FuiPanel.field.options"
                                      defaultMessage="Opciones (value:labelKey, una por línea)"
                                    />
                                  </LABEL>
                                  <textarea
                                    className="w-full min-h-[80px] text-xs font-mono bg-black/60 text-white px-2 py-1 rounded"
                                    value={Array.isArray(
                                      (field as any).options,
                                    )
                                      ? ((field as any)
                                          .options as PanelFieldOption[])
                                          .map(
                                            (opt) =>
                                              `${opt.value}:${
                                                opt.labelKey || ''
                                              }`,
                                          )
                                          .join('\n')
                                      : ''}
                                    onChange={(e) => {
                                      const lines = e.target.value
                                        .split('\n')
                                        .map((l) => l.trim())
                                        .filter(Boolean);

                                      const opts: PanelFieldOption[] =
                                        lines.map((line) => {
                                          const [v, label] =
                                            line.split(':');
                                          return {
                                            value: v.trim(),
                                            labelKey:
                                              label?.trim() || undefined,
                                          };
                                        });

                                      handleUpdateField(idx, {
                                        options: opts as any,
                                      } as any);
                                    }}
                                  />
                                </DIV>
                              )}
                            </DIV>
                          );
                        })}
                      </DIV>
                    )}
                  </DIV>
                );
              })}
            </DIV>
          </DIV>

          {/* IDS DE I18N */}
          <DIV className="border border-white/10 rounded-lg p-4 flex flex-col gap-2 bg-black/40">
            <DIV className="flex items-center justify-between">
              <SPAN className="font-semibold text-sm uppercase tracking-wide">
                <FM
                  id="admin.FuiPanel.section.i18nIds"
                  defaultMessage="IDs de i18n detectados para este panel"
                />
              </SPAN>
              <BUTTON
                type="button"
                kind="button"
                onClick={handleCopyI18nIds}
                disabled={!i18nIdsText}
              >
                {copiedI18n ? (
                  <FM
                    id="admin.FuiPanel.button.copiedI18n"
                    defaultMessage="Copiado"
                  />
                ) : (
                  <FM
                    id="admin.FuiPanel.button.copyI18nIds"
                    defaultMessage="Copiar IDs i18n"
                  />
                )}
              </BUTTON>
            </DIV>
            <P className="text-xs opacity-70">
              <FM
                id="admin.FuiPanel.i18n.description"
                defaultMessage="Copia este JSON a tus archivos de traducción. Incluye el título del panel, campos y opciones de selects/multiselect."
              />
            </P>
            <textarea
              readOnly
              className="w-full min-h-[220px] text-xs font-mono bg-black/70 text-white px-3 py-2 rounded"
              value={i18nIdsText}
            />
          </DIV>

          {/* ESQUEMA PARA PUI / CORE */}
          <DIV className="border border-white/10 rounded-lg p-4 flex flex-col gap-2 bg-black/40">
            <DIV className="flex items-center justify-between">
              <SPAN className="font-semibold text-sm uppercase tracking-wide">
                <FM
                  id="admin.FuiPanel.section.schemaForPui"
                  defaultMessage="Esquema listo para PUI (guardar en el core)"
                />
              </SPAN>
              <BUTTON
                type="button"
                kind="button"
                onClick={handleCopySchemaCode}
                disabled={!schemaCodeText}
              >
                {copiedSchema ? (
                  <FM
                    id="admin.FuiPanel.button.copiedSchema"
                    defaultMessage="Copiado"
                  />
                ) : (
                  <FM
                    id="admin.FuiPanel.button.copySchema"
                    defaultMessage="Copiar esquema"
                  />
                )}
              </BUTTON>
            </DIV>
            <P className="text-xs opacity-70">
              <FM
                id="admin.FuiPanel.schema.description"
                defaultMessage="Copia este bloque en panelSchemas del core. El nombre sugerido está derivado de schema.id."
              />
            </P>
            <textarea
              readOnly
              className="w-full min-h-[260px] text-xs font-mono bg-black/70 text-white px-3 py-2 rounded"
              value={schemaCodeText}
            />
          </DIV>
        </>
      )}
    </DIV>
  );
}

export default FuiPanel;
