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
    schema.labelKey = `admin.${schema.id}Panel.title`;
  }

  if (!schema.fsDocId && schema.id) {
    schema.fsDocId = schema.id;
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
// i18n IDs
// ---------------------------------------------------------------------------

function buildI18nIds(schema: PanelSchema): Record<string, string> {
  const out: Record<string, string> = {};

  // Título del panel
  if (schema.labelKey) {
    out[schema.labelKey] = schema.id;
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

      const base = `panels.${schema.id}.${group}.${shortName}`;
      out[`${base}.label`] = field.labelKey || shortName;
      out[`${base}.description`] =
        field.descriptionKey || `${shortName}.description`;

      return;
    }

    // ESCALAR
    const effective = relPath || field.name || '';
    const segments = effective.split('.').filter(Boolean);
    const shortName =
      segments[segments.length - 1] || field.name || 'field';

    const base = `panels.${schema.id}.${group}.${shortName}`;
    out[`${base}.label`] = field.labelKey || shortName;
    out[`${base}.description`] =
      field.descriptionKey || `${shortName}.description`;

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

    // Grupo: primero usamos groupKey, si no hay caemos a primer segmento o 'root'
    const group = field.groupKey || segs[0] || 'root';

    let relPath = '';
    if (segs.length > 0 && segs[0] === group) {
      // Si el primer segmento es igual al group, lo quitamos
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
  /** ID estable de grupo (para acordéon y key) */
  id: string;
  /** Etiqueta visible (usamos groupKey cuando exista) */
  label: string;
  /** Índices de campos en schema.fields */
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

    // Solo pasamos por normalizeSchemaForFui.
    // Para esquemas ya generados por el FUI, esta función es idempotente.
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
      // Igual: normalización idempotente
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
    updatePanel({ [field]: value } as any);
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

    setSchema({ ...schema, fields: [...schema.fields, newField] });
    setCopiedI18n(false);
    setCopiedSchema(false);
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
        // Conservar todo menos el último segmento (para casos tipo "contact.website")
        prefixSegments = segments.slice(0, -1);
      } else {
        // Si sólo había un segmento, NO lo usamos como prefijo para evitar "legalName.nuevo".
        // Opcionalmente podríamos usar groupKey como prefijo, pero lo dejamos sin prefijo
        // para que el nombre sea exactamente el shortName.
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
      // Antes de guardar, aplicamos una normalización light para defaults si hiciera falta.
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

  // Agrupar campos:
  // bucketId = groupKey (si existe) o primer segmento de name o "general".
  // Así, cambiar el name no cambia de grupo si ya hay groupKey.
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

    // Limpieza ligera para evitar undefined
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
          Factory UI · Constructor de Paneles
        </SPAN>
        <P className="text-sm opacity-75">
          Aquí defines los <SPAN className="font-mono">PanelSchema</SPAN> que
          alimentan el PUI (branding, settings, etc.). Primero elige un esquema
          guardado o un esquema base y luego ajusta campos, grupos e IDs.
        </P>
        <P className="text-[11px] opacity-60">
          Locale actual: <SPAN className="font-mono">{locale}</SPAN>
        </P>
      </DIV>

      {/* SELECTORES PRINCIPALES */}
      <DIV className="flex flex-col md:flex-row md:items-end gap-4">
        <DIV className="flex-1">
          <LABEL className="text-xs font-semibold">
            Esquema guardado en FactorySchemas
          </LABEL>
          <SELECT
            value={savedSchemaId}
            onChange={(e) => handlePickSavedSchema(e.target.value)}
          >
            <option value="">— Selecciona un panel —</option>
            {savedSchemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.fsCollection}/{s.fsDocId}
              </option>
            ))}
          </SELECT>
          {loadingSaved && (
            <P className="text-xs opacity-60 mt-1">
              Cargando lista de esquemas…
            </P>
          )}
        </DIV>

        <DIV className="flex-1">
          <LABEL className="text-xs font-semibold">
            Esquema base (PANEL_SCHEMAS)
          </LABEL>
          <SELECT
            value={basePanelId}
            onChange={(e) => handlePickBaseSchema(e.target.value)}
          >
            <option value="">— Ninguno / vacío —</option>
            {Object.values(PANEL_SCHEMAS).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.fsCollection}/{s.fsDocId}
              </option>
            ))}
          </SELECT>
        </DIV>

        <DIV className="flex flex-row flex-wrap gap-2">
          <BUTTON type="button" kind="button" onClick={handleNewEmptyPanel}>
            Nuevo panel vacío
          </BUTTON>
          <BUTTON
            type="button"
            kind="button"
            onClick={handleSaveSchema}
            disabled={!schema || saving}
          >
            {saving ? 'Guardando…' : 'Guardar schema'}
          </BUTTON>
          <BUTTON
            type="button"
            kind="button"
            onClick={handleDeleteSchema}
            disabled={!savedSchemaId || deleting}
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </BUTTON>
        </DIV>
      </DIV>

      {error && (
        <DIV className="border border-red-700 bg-red-950/40 text-red-200 text-xs px-3 py-2 rounded">
          {error === 'load-schemas' && 'Error al listar los schemas.'}
          {error === 'load-one' && 'Error al cargar el schema seleccionado.'}
          {error === 'save' && 'Error al guardar el schema.'}
          {error === 'delete' && 'Error al eliminar el schema.'}
        </DIV>
      )}

      {!schema && (
        <DIV className="text-sm opacity-70">
          Elige un esquema guardado o un esquema base, o crea uno vacío para
          empezar.
        </DIV>
      )}

      {schema && (
        <>
          {/* METADATA DEL PANEL */}
          <DIV className="border border-white/10 rounded-lg p-4 flex flex-col gap-3 bg-black/40">
            <SPAN className="font-semibold text-sm uppercase tracking-wide">
              Metadatos del panel
            </SPAN>
            <DIV className="grid md:grid-cols-3 gap-3">
              <DIV className="flex flex-col gap-1">
                <LABEL className="text-xs font-semibold">Id (interno)</LABEL>
                <INPUT
                  type="text"
                  value={schema.id}
                  onChange={(e) =>
                    handleChangePanelProp('id', e.target.value.trim())
                  }
                />
              </DIV>
              <DIV className="flex flex-col gap-1">
                <LABEL className="text-xs font-semibold">Label key</LABEL>
                <INPUT
                  type="text"
                  value={schema.labelKey || ''}
                  placeholder={`admin.${schema.id || 'panel'}Panel.title`}
                  onChange={(e) =>
                    handleChangePanelProp('labelKey', e.target.value)
                  }
                />
              </DIV>
              <DIV className="flex flex-col gap-1">
                <LABEL className="text-xs font-semibold">Icon key</LABEL>
                <INPUT
                  type="text"
                  value={schema.iconKey || ''}
                  onChange={(e) =>
                    handleChangePanelProp('iconKey', e.target.value)
                  }
                />
              </DIV>
              <DIV className="flex flex-col gap-1">
                <LABEL className="text-xs font-semibold">
                  Colección FS (fsCollection)
                </LABEL>
                <INPUT
                  type="text"
                  value={schema.fsCollection}
                  onChange={(e) =>
                    handleChangePanelProp('fsCollection', e.target.value)
                  }
                />
              </DIV>
              <DIV className="flex flex-col gap-1">
                <LABEL className="text-xs font-semibold">
                  Documento FS (fsDocId)
                </LABEL>
                <INPUT
                  type="text"
                  value={schema.fsDocId || ''}
                  placeholder={schema.id}
                  onChange={(e) =>
                    handleChangePanelProp('fsDocId', e.target.value)
                  }
                />
              </DIV>
              <DIV className="flex flex-col gap-1">
                <LABEL className="text-xs font-semibold">
                  Roles permitidos (comma)
                </LABEL>
                <INPUT
                  type="text"
                  value={currentRoles}
                  onChange={(e) => handleChangeRoles(e.target.value)}
                  placeholder="superadmin, admin, client"
                />
              </DIV>
              <DIV className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={!!schema.isProvider}
                  onChange={(e) =>
                    handleChangePanelProp('isProvider', e.target.checked)
                  }
                />
                <SPAN className="text-xs">
                  isProvider (alimenta FDV / Providers)
                </SPAN>
              </DIV>
            </DIV>
          </DIV>

          {/* CAMPOS AGRUPADOS CON ACORDEONES */}
          <DIV className="border border-white/10 rounded-lg p-4 flex flex-col gap-4 bg-black/40">
            <DIV className="flex items-center justify-between">
              <SPAN className="font-semibold text-sm uppercase tracking-wide">
                Campos
              </SPAN>
              <BUTTON
                type="button"
                kind="button"
                onClick={() => handleAddField()}
              >
                + Campo (general)
              </BUTTON>
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
                    {/* Header del acordeón */}
                    <DIV className="flex items-center justify-between px-3 py-2 bg-black/70">
                      <DIV className="flex flex-col">
                        <SPAN className="text-sm font-semibold">
                          {groupLabel}
                        </SPAN>
                        <SPAN className="text-[10px] opacity-60">
                          {indexes.length} campo(s)
                        </SPAN>
                      </DIV>
                      <DIV className="flex items-center gap-2">
                        <BUTTON
                          type="button"
                          kind="button"
                          onClick={() => handleAddField(id)}
                        >
                          + Campo
                        </BUTTON>
                        <BUTTON
                          type="button"
                          kind="button"
                          onClick={() => toggleGroup(id)}
                        >
                          {isOpen ? 'Cerrar' : 'Abrir'}
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

                          return (
                            <DIV
                              key={idx}
                              className="flex flex-col gap-2 border border-white/10 rounded-md p-3 bg-black/30"
                            >
                              <DIV className="flex justify-between items-center">
                                <SPAN className="text-xs font-mono opacity-70">
                                  {fullName || '(sin nombre)'}
                                </SPAN>
                                <BUTTON
                                  type="button"
                                  kind="button"
                                  onClick={() => handleDeleteField(idx)}
                                >
                                  Eliminar
                                </BUTTON>
                              </DIV>

                              <DIV className="grid md:grid-cols-4 gap-2">
                                <DIV className="flex flex-col gap-1">
                                  <LABEL className="text-xs font-semibold">
                                    Nombre interno (sin el grupo)
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

                                <DIV className="flex flex-col gap-1">
                                  <LABEL className="text-xs font-semibold">
                                    Tipo (type)
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

                                <DIV className="flex flex-col gap-1">
                                  <LABEL className="text-xs font-semibold">
                                    GroupKey
                                  </LABEL>
                                  <INPUT
                                    type="text"
                                    value={field.groupKey || groupLabel}
                                    onChange={(e) =>
                                      handleUpdateField(idx, {
                                        groupKey: e.target.value,
                                      })
                                    }
                                  />
                                </DIV>

                                <DIV className="flex flex-col gap-1">
                                  <LABEL className="text-xs font-semibold">
                                    Orden
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
                              </DIV>

                              <DIV className="grid md:grid-cols-2 gap-2">
                                <DIV className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={field.required === true}
                                    onChange={(e) =>
                                      handleUpdateField(idx, {
                                        required: e.target.checked,
                                      })
                                    }
                                  />
                                  <LABEL className="text-xs">Required</LABEL>
                                </DIV>
                                <DIV className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={field.translatable === true}
                                    onChange={(e) =>
                                      handleUpdateField(idx, {
                                        translatable: e.target.checked,
                                      })
                                    }
                                  />
                                  <LABEL className="text-xs">
                                    Translatable (valor por idioma)
                                  </LABEL>
                                </DIV>
                              </DIV>

                              <DIV className="grid md:grid-cols-2 gap-2">
                                <DIV className="flex flex-col gap-1">
                                  <LABEL className="text-xs font-semibold">
                                    Label key (i18n – opcional)
                                  </LABEL>
                                  <INPUT
                                    type="text"
                                    value={field.labelKey || ''}
                                    onChange={(e) =>
                                      handleUpdateField(idx, {
                                        labelKey: e.target.value,
                                      })
                                    }
                                  />
                                </DIV>
                                <DIV className="flex flex-col gap-1">
                                  <LABEL className="text-xs font-semibold">
                                    Descripción key (i18n – opcional)
                                  </LABEL>
                                  <INPUT
                                    type="text"
                                    value={field.descriptionKey || ''}
                                    onChange={(e) =>
                                      handleUpdateField(idx, {
                                        descriptionKey: e.target.value,
                                      })
                                    }
                                  />
                                </DIV>
                              </DIV>

                              <DIV className="grid md:grid-cols-2 gap-2">
                                <DIV className="flex flex-col gap-1">
                                  <LABEL className="text-xs font-semibold">
                                    Widget sugerido
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
                                    <option value="input">
                                      input
                                    </option>
                                    <option value="textarea">
                                      textarea
                                    </option>
                                    <option value="color">
                                      color
                                    </option>
                                    <option value="image">
                                      image (URL)
                                    </option>
                                    <option value="file">
                                      file
                                    </option>
                                    <option value="select">
                                      select
                                    </option>
                                    <option value="multiselect">
                                      multiselect
                                    </option>
                                    <option value="radio">
                                      radio
                                    </option>
                                    <option value="code">
                                      code
                                    </option>
                                    <option value="json">
                                      json
                                    </option>
                                  </SELECT>
                                </DIV>

                                {(field.type === 'string' ||
                                  field.type === 'text') && (
                                  <DIV className="grid grid-cols-2 gap-2">
                                    <DIV className="flex flex-col gap-1">
                                      <LABEL className="text-xs font-semibold">
                                        Min length (texto)
                                      </LABEL>
                                      <INPUT
                                        type="number"
                                        value={
                                          (field as any).minLength ?? ''
                                        }
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
                                    <DIV className="flex flex-col gap-1">
                                      <LABEL className="text-xs font-semibold">
                                        Max length (texto)
                                      </LABEL>
                                      <INPUT
                                        type="number"
                                        value={
                                          (field as any).maxLength ?? ''
                                        }
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
                                  </DIV>
                                )}
                              </DIV>

                              {(field.type === 'select' ||
                                field.type === 'multiselect' ||
                                field.widget === 'select' ||
                                field.widget === 'multiselect' ||
                                field.widget === 'radio') && (
                                <DIV className="flex flex-col gap-1">
                                  <LABEL className="text-xs font-semibold">
                                    Opciones (value:labelKey, una por
                                    línea)
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
                IDs de i18n detectados para este panel
              </SPAN>
              <BUTTON
                type="button"
                kind="button"
                onClick={handleCopyI18nIds}
                disabled={!i18nIdsText}
              >
                {copiedI18n ? 'Copiado' : 'Copiar IDs i18n'}
              </BUTTON>
            </DIV>
            <P className="text-xs opacity-70">
              Copia este JSON a tus archivos de traducción. Incluye el título
              del panel, campos y opciones de selects/multiselect.
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
                Esquema listo para PUI (guardar en el core)
              </SPAN>
              <BUTTON
                type="button"
                kind="button"
                onClick={handleCopySchemaCode}
                disabled={!schemaCodeText}
              >
                {copiedSchema ? 'Copiado' : 'Copiar esquema'}
              </BUTTON>
            </DIV>
            <P className="text-xs opacity-70">
              Copia este bloque en{' '}
              <SPAN className="font-mono">panelSchemas</SPAN> del core.
              El nombre sugerido está derivado de{' '}
              <SPAN className="font-mono">schema.id</SPAN>.
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
