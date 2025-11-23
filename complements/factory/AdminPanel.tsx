// complements/factory/AdminPanel.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { FbDB } from '@/app/lib/services/firebase';

// Ajusta este import si tu tipo se llama distinto o está en otra ruta
import type { Role as AclRole } from '@/app/lib/authz';

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
  PANEL_FS_COLLECTION_PROVIDERS,
  PANEL_FS_COLLECTION_ADMIN,
  type PanelSchema,
  type PanelField,
  type PanelFieldType,
  type PanelFieldWidget,
  type PanelRole,
  type PanelFieldOption,
  type PanelScalarField,
} from './panelSchema.types';

import { PANEL_SCHEMAS } from './panelSchemas';

// -------------------- Utils básicos --------------------

type PanelData = Record<string, any>;

type AdminPanelProps = {
  locale: string;
  /** Si viene, NO usamos /api/acl/role y forzamos este rol para los paneles */
  panelRoleOverride?: PanelRole;
};

function mapAclToPanelRole(role: AclRole): PanelRole {
  // Mapeo inicial simple:
  // - superadmin  → superadmin
  // - admin       → admin
  // - user        → client (admin del cliente)
  // - anon        → enduser
  switch (role) {
    case 'superadmin':
      return 'superadmin';
    case 'admin':
      return 'admin';
    case 'user':
      return 'client';
    default:
      return 'enduser';
  }
}

function buildDefaultValue(field: PanelField): any {
  const t: PanelFieldType = field.type;
  switch (t) {
    case 'string':
    case 'text':
      return '';
    case 'number':
      return undefined; // o 0 si prefieres algo inicial
    case 'boolean':
      return false;
    case 'date':
      return '';
    case 'select':
      return '';
    case 'multiselect':
      return [];
    case 'object':
      return {};
    case 'array':
      return [];
    default:
      return undefined;
  }
}

function buildDefaultsFromSchema(schema: PanelSchema): PanelData {
  const out: PanelData = {};
  for (const f of schema.fields) {
    out[f.name] = buildDefaultValue(f);
  }
  return out;
}

// type guard: este campo es escalar (string/number/bool/etc.), NO object/array
function isScalarField(field: PanelField): field is PanelScalarField {
  return field.type !== 'object' && field.type !== 'array';
}

// Campo visible amigable (no usamos i18n aquí para no complicar)
function getFieldLabel(field: PanelField): string {
  if (field.labelKey) return field.labelKey;
  // Fallback tonto: NameCase → "Name", "Logo Url", etc.
  const n = field.name || '';
  return n
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

// -------------------- Componente principal --------------------

export function AdminPanel({ locale, panelRoleOverride }: AdminPanelProps) {
  const [aclRole, setAclRole] = useState<AclRole>('anon');
  // Si tenemos override, no hay que “cargar” rol
  const [roleLoading, setRoleLoading] = useState<boolean>(
    panelRoleOverride ? false : true,
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [data, setData] = useState<PanelData>({});
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 1) Resolver rol:
  //    - Si viene panelRoleOverride → usamos ese y NO llamamos /api/acl/role
  //    - Si no, seguimos pidiendo /api/acl/role como antes
  useEffect(() => {
    if (panelRoleOverride) {
      // Forzamos el rol de panel directamente
      setAclRole(panelRoleOverride as AclRole);
      setRoleLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/acl/role', { method: 'GET' });
        const json = (await res.json()) as { role?: AclRole };
        if (!cancelled && json && typeof json.role === 'string') {
          setAclRole(json.role);
        }
      } catch {
        if (!cancelled) {
          setAclRole('anon');
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [panelRoleOverride]);

  const panelRole: PanelRole = useMemo(
    () => panelRoleOverride ?? mapAclToPanelRole(aclRole),
    [panelRoleOverride, aclRole],
  );

  const availableSchemas: PanelSchema[] = useMemo(() => {
    const all = Object.values(PANEL_SCHEMAS);
    if (!all.length) return [];
    return all.filter((schema) =>
      schema.access?.allowedRoles?.includes(panelRole),
    );
  }, [panelRole]);

  // 2) Seleccionar panel por default cuando haya alguno disponible
  useEffect(() => {
    if (!selectedId && availableSchemas.length > 0) {
      setSelectedId(availableSchemas[0].id);
    } else if (
      selectedId &&
      !availableSchemas.some((s) => s.id === selectedId)
    ) {
      // Si el panel deja de ser accesible por cambio de rol, lo limpiamos
      setSelectedId('');
      setData({});
    }
  }, [availableSchemas, selectedId]);

  const currentSchema: PanelSchema | undefined = useMemo(
    () => availableSchemas.find((s) => s.id === selectedId),
    [availableSchemas, selectedId],
  );

  // 3) Cargar documento de FS cuando cambia el schema o el locale
  useEffect(() => {
    if (!currentSchema) {
      setData({});
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadingDoc(true);
      setError(null);
      setSaved(false);
      try {
        const ref = doc(
          FbDB,
          currentSchema.fsCollection,
          currentSchema.fsDocId,
        );
        const snap = await getDoc(ref);

        const defaults = buildDefaultsFromSchema(currentSchema);

        if (snap.exists()) {
          const fsDoc = snap.data() as PanelData;
          const merged = { ...defaults, ...fsDoc };
          if (!cancelled) setData(merged);
        } else {
          if (!cancelled) setData(defaults);
        }
      } catch (e) {
        console.error('[AdminPanel] error al cargar doc:', e);
        if (!cancelled) {
          setError('load');
          setData({});
        }
      } finally {
        if (!cancelled) setLoadingDoc(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentSchema, locale]);

  const handleFieldChange = (field: PanelField, value: any) => {
    setData((prev) => ({
      ...prev,
      [field.name]: value,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!currentSchema) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const ref = doc(
        FbDB,
        currentSchema.fsCollection,
        currentSchema.fsDocId,
      );

      const out: PanelData = {
        ...data,
        _updatedAt: Date.now(),
        _updatedByRole: panelRole,
      };

      await setDoc(ref, out, { merge: true });
      setSaved(true);
    } catch (e) {
      console.error('[AdminPanel] error al guardar:', e);
      setError('save');
    } finally {
      setSaving(false);
    }
  };

  // -------------------- Render helpers --------------------

  const renderFieldInput = (field: PanelField) => {
    const value = data[field.name];

    const widget: PanelFieldWidget | undefined = field.widget;
    const type: PanelFieldType = field.type;

    // STRING / TEXT
    if (type === 'string' || type === 'text') {
      // widget textarea / markdown / code / json => textarea
      if (
        widget === 'textarea' ||
        widget === 'markdown' ||
        widget === 'code' ||
        widget === 'json'
      ) {
        const strVal =
          typeof value === 'string'
            ? value
            : value == null
            ? ''
            : String(value);
        return (
          <textarea
            className="w-full min-h-[80px] text-sm bg-black/60 text-white px-2 py-1 rounded"
            value={strVal}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        );
      }

      // widget color
      if (widget === 'color') {
        const strVal =
          typeof value === 'string'
            ? value
            : value == null
            ? '#000000'
            : String(value);
        return (
          <INPUT
            type="color"
            value={strVal}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        );
      }

      // widget image / file → por ahora URL simple
      if (widget === 'image' || widget === 'file') {
        const strVal =
          typeof value === 'string'
            ? value
            : value == null
            ? ''
            : String(value);
        return (
          <INPUT
            type="text"
            placeholder={widget === 'image' ? 'URL de imagen' : 'URL de archivo'}
            value={strVal}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        );
      }

      // default → input de texto
      const strVal =
        typeof value === 'string'
          ? value
          : value == null
          ? ''
          : String(value);
      return (
        <INPUT
          type="text"
          value={strVal}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      );
    }

    // NUMBER
    if (type === 'number') {
      const numVal =
        typeof value === 'number'
          ? value
          : value == null
          ? ''
          : Number(value) || '';
      return (
        <INPUT
          type="number"
          value={numVal}
          onChange={(e) => {
            const v = e.target.value;
            handleFieldChange(field, v === '' ? undefined : Number(v));
          }}
        />
      );
    }

    // BOOLEAN
    if (type === 'boolean') {
      const boolVal = value === true;
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={boolVal}
            onChange={(e) => handleFieldChange(field, e.target.checked)}
          />
          <SPAN className="text-xs opacity-70">
            {field.widget === 'switch' ? 'Switch' : 'Checkbox'}
          </SPAN>
        </div>
      );
    }

    // DATE
    if (type === 'date') {
      const strVal =
        typeof value === 'string'
          ? value
          : value == null
          ? ''
          : String(value);
      return (
        <INPUT
          type="date"
          value={strVal}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      );
    }

    // SELECT / MULTISELECT
    if (type === 'select' || type === 'multiselect') {
      // Solo los campos escalares pueden tener options
      const opts: PanelFieldOption[] =
        isScalarField(field) && Array.isArray(field.options)
          ? field.options
          : [];

      // MULTISELECT
      if (type === 'multiselect' || widget === 'multiselect') {
        const arrVal: string[] = Array.isArray(value)
          ? value
          : value == null
          ? []
          : [String(value)];

        return (
          <SELECT
            multiple
            value={arrVal}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map(
                (o) => o.value,
              );
              handleFieldChange(field, selected);
            }}
          >
            {opts.map((opt: PanelFieldOption) => (
              <option key={opt.value} value={opt.value}>
                {opt.labelKey || opt.value}
              </option>
            ))}
          </SELECT>
        );
      }

      // RADIO
      if (widget === 'radio') {
        const curVal = value == null ? '' : String(value);
        return (
          <DIV className="flex flex-wrap gap-3">
            {opts.map((opt: PanelFieldOption) => (
              <label
                key={opt.value}
                className="flex items-center gap-1 text-sm"
              >
                <input
                  type="radio"
                  value={opt.value}
                  checked={curVal === opt.value}
                  onChange={() => handleFieldChange(field, opt.value)}
                />
                <SPAN>{opt.labelKey || opt.value}</SPAN>
              </label>
            ))}
          </DIV>
        );
      }

      // SELECT normal
      const curVal = value == null ? '' : String(value);
      return (
        <SELECT
          value={curVal}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        >
          <option value="">— Selecciona —</option>
          {opts.map((opt: PanelFieldOption) => (
            <option key={opt.value} value={opt.value}>
              {opt.labelKey || opt.value}
            </option>
          ))}
        </SELECT>
      );
    }

    // OBJECT / ARRAY → JSON plano por ahora
    if (type === 'object' || type === 'array') {
      let jsonValue = '';
      try {
        jsonValue = JSON.stringify(
          value ?? (type === 'array' ? [] : {}),
          null,
          2,
        );
      } catch {
        jsonValue = '';
      }
      return (
        <textarea
          className="w-full min-h-[120px] text-xs font-mono bg-black/60 text-white px-2 py-1 rounded"
          value={jsonValue}
          onChange={(e) => {
            const txt = e.target.value;
            try {
              const parsed = txt
                ? JSON.parse(txt)
                : type === 'array'
                ? []
                : {};
              handleFieldChange(field, parsed);
            } catch (err) {
              console.error(
                `[AdminPanel] JSON inválido en campo ${field.name}:`,
                err,
              );
              // si el JSON es inválido, no actualizamos el estado
            }
          }}
        />
      );
    }

    // fallback
    return (
      <INPUT
        type="text"
        value={value == null ? '' : String(value)}
        onChange={(e) => handleFieldChange(field, e.target.value)}
      />
    );
  };

  // -------------------- Render principal --------------------

  if (roleLoading) {
    return (
      <DIV className="p-4">
        <P className="text-sm opacity-70">Cargando permisos…</P>
      </DIV>
    );
  }

  if (!availableSchemas.length) {
    return (
      <DIV className="p-4">
        <P className="text-sm">
          No hay paneles disponibles para tu rol actual (
          <SPAN className="font-mono">{panelRole}</SPAN>).
        </P>
      </DIV>
    );
  }

  return (
    <DIV className="p-4 flex flex-col gap-6">
      {/* Header */}
      <DIV className="mb-2">
        <SPAN className="text-xl font-bold">
          Panel de Administración Dinámico (PUI)
        </SPAN>
        <P className="text-sm opacity-75">
          Elige un esquema para administrar sus datos en Firestore. Los que
          marcan <SPAN className="font-mono">isProvider = true</SPAN> alimentan
          la FDV bajo la colección <SPAN className="font-mono">Providers</SPAN>.
        </P>
      </DIV>

      {/* Selector de panel */}
      <DIV className="flex flex-col md:flex-row md:items-center gap-3">
        <DIV className="flex-1">
          <LABEL className="text-xs font-semibold">
            Elige el esquema a alimentar
          </LABEL>
          <SELECT
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setData({});
              setError(null);
              setSaved(false);
            }}
          >
            <option value="">— Selecciona un panel —</option>
            {availableSchemas.map((schema) => (
              <option key={schema.id} value={schema.id}>
                {schema.labelKey || schema.id}{' '}
                {schema.isProvider ? ' (FDV)' : ''}
              </option>
            ))}
          </SELECT>
        </DIV>

        <DIV className="text-xs opacity-70">
          <P>
            Rol actual:{' '}
            <SPAN className="font-mono">
              {panelRoleOverride ?? panelRole}
            </SPAN>
          </P>
          {currentSchema && (
            <P>
              FS:{' '}
              <SPAN className="font-mono">
                {currentSchema.fsCollection}/{currentSchema.fsDocId}
              </SPAN>
            </P>
          )}
        </DIV>
      </DIV>

      {/* Estado de carga / errores */}
      {error && (
        <DIV className="border border-red-700 bg-red-950/40 text-red-200 text-xs px-3 py-2 rounded">
          {error === 'load' && 'Error al cargar los datos desde Firestore.'}
          {error === 'save' && 'Error al guardar los datos en Firestore.'}
        </DIV>
      )}

      {loadingDoc && (
        <DIV className="text-sm opacity-70">
          Cargando documento de Firestore…
        </DIV>
      )}

      {saved && !saving && !loadingDoc && (
        <DIV className="border border-emerald-600 bg-emerald-900/40 text-emerald-100 text-xs px-3 py-2 rounded">
          Cambios guardados correctamente.
        </DIV>
      )}

      {/* Formulario dinámico */}
      {currentSchema && !loadingDoc && (
        <DIV className="border border-white/10 rounded-lg p-4 flex flex-col gap-4 bg-black/40">
          <SPAN className="font-semibold text-sm uppercase tracking-wide">
            Campos ({currentSchema.id})
          </SPAN>

          <DIV className="grid gap-4 md:grid-cols-2">
            {currentSchema.fields.map((field) => (
              <DIV
                key={field.name}
                className="flex flex-col gap-1 bg-black/30 border border-white/10 rounded-md p-3"
              >
                <LABEL className="text-xs font-semibold flex justify-between">
                  <span>{getFieldLabel(field)}</span>
                  <span className="opacity-60 font-mono text-[10px]">
                    {field.type}
                    {field.required ? ' · req' : ''}
                    {field.translatable ? ' · i18n' : ''}
                  </span>
                </LABEL>
                {renderFieldInput(field)}
              </DIV>
            ))}
          </DIV>

          <DIV className="flex items-center justify-between mt-2">
            <P className="text-xs opacity-70">
              Se guardará en{' '}
              <SPAN className="font-mono">
                {currentSchema.fsCollection}/{currentSchema.fsDocId}
              </SPAN>
              .
            </P>
            <BUTTON
              kind="button"
              type="button"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </BUTTON>
          </DIV>
        </DIV>
      )}
    </DIV>
  );
}
