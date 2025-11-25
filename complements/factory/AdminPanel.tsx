// complements/factory/AdminPanel.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { FbDB } from '@/app/lib/services/firebase';

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

import type {
  PanelSchema,
  PanelField,
  PanelFieldType,
  PanelFieldWidget,
  PanelFieldOption,
  PanelScalarField,
} from './panelSchema.types';

import { PANEL_SCHEMAS } from './panelSchemas';

// -------------------- Utils básicos --------------------

type PanelData = Record<string, any>;
type FieldErrors = Record<string, string | undefined>;

type AdminPanelProps = {
  locale: string;
};

function buildDefaultValue(field: PanelField): any {
  const t: PanelFieldType = field.type;
  switch (t) {
    case 'string':
    case 'text':
      return '';
    case 'number':
      return '';
    case 'boolean':
      return false;
    case 'date':
      return '';
    case 'select':
      return '';
    case 'multiselect':
      return [];
    case 'object':
    case 'array':
      // se stringify-ará después
      return '';
    default:
      return '';
  }
}

function buildDefaultsFromSchema(schema: PanelSchema): PanelData {
  const out: PanelData = {};
  for (const f of schema.fields) {
    out[f.name] = buildDefaultValue(f);
  }
  return out;
}

// campo escalar (string/number/bool/etc.)
function isScalarField(field: PanelField): field is PanelScalarField {
  return field.type !== 'object' && field.type !== 'array';
}

// Label “bonito” por fallback
function getFieldLabelFallback(field: PanelField): string {
  const n = field.name || '';
  return n
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

// Render de label usando i18n si hay labelKey
function FieldTitle({ field }: { field: PanelField }) {
  if (field.labelKey) {
    return (
      <FM id={field.labelKey} defaultMessage={getFieldLabelFallback(field)} />
    );
  }
  return <>{getFieldLabelFallback(field)}</>;
}

// Hint / descripción (i18n)
function FieldHint({ field }: { field: PanelField }) {
  if (!('descriptionKey' in field)) return null;
  const key = (field as any).descriptionKey as string | undefined;
  if (!key) return null;
  return (
    <P className="text-[11px] opacity-70 mt-0.5">
      <FM id={key} defaultMessage="" />
    </P>
  );
}

// -------------------- Componente principal --------------------

export function AdminPanel({ locale }: AdminPanelProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [data, setData] = useState<PanelData>({});
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // 🔹 YA NO HAY ROLES AQUÍ. AdminGuard es el único que decide si entras o no.
  const availableSchemas: PanelSchema[] = useMemo(
    () => Object.values(PANEL_SCHEMAS),
    [],
  );

  // 1) Selección de panel por defecto
  useEffect(() => {
    if (!selectedId && availableSchemas.length > 0) {
      setSelectedId(availableSchemas[0].id);
    } else if (
      selectedId &&
      !availableSchemas.some((s) => s.id === selectedId)
    ) {
      setSelectedId('');
      setData({});
    }
  }, [availableSchemas, selectedId]);

  const currentSchema: PanelSchema | undefined = useMemo(
    () => availableSchemas.find((s) => s.id === selectedId),
    [availableSchemas, selectedId],
  );

  // 2) Cargar documento de Firestore cuando cambia schema o locale
  useEffect(() => {
    if (!currentSchema) {
      setData({});
      setFieldErrors({});
      setOpenGroups({});
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadingDoc(true);
      setError(null);
      setSaved(false);
      setFieldErrors({});
      try {
        const ref = doc(
          FbDB,
          currentSchema.fsCollection,
          currentSchema.fsDocId,
        );
        const snap = await getDoc(ref);

        const defaults = buildDefaultsFromSchema(currentSchema);

        let merged: PanelData;
        if (snap.exists()) {
          const fsDoc = snap.data() as PanelData;
          merged = { ...defaults, ...fsDoc };
        } else {
          merged = defaults;
        }

        // Para fields object/array guardamos STRING (JSON bonito)
        for (const f of currentSchema.fields) {
          if (f.type === 'object' || f.type === 'array') {
            const raw = merged[f.name];
            try {
              merged[f.name] = JSON.stringify(
                raw ?? (f.type === 'array' ? [] : {}),
                null,
                2,
              );
            } catch {
              merged[f.name] = f.type === 'array' ? '[]' : '{}';
            }
          }
        }

        if (!cancelled) {
          setData(merged);

          // abrir todos los grupos por default
          const groups: Record<string, boolean> = {};
          for (const f of currentSchema.fields) {
            const g =
              f.groupKey && f.groupKey.trim().length > 0
                ? f.groupKey
                : 'General';
            groups[g] = true;
          }
          setOpenGroups(groups);
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
    setFieldErrors((prev) => ({
      ...prev,
      [field.name]: undefined,
    }));
  };

  // -------------------- Validaciones y guardado --------------------

  const handleSave = async () => {
    if (!currentSchema) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const newErrors: FieldErrors = {};
    const jsonParsed: Record<string, any> = {};

    const setErr = (name: string, msg: string) => {
      if (!newErrors[name]) newErrors[name] = msg;
    };

    for (const field of currentSchema.fields) {
      const { name, type, required } = field;
      const v = data[name];

      // número: min/max desde el schema si existen
      const min = (field as any).min as number | undefined;
      const max = (field as any).max as number | undefined;

      switch (type) {
        case 'string':
        case 'text': {
          const s =
            typeof v === 'string'
              ? v
              : v == null
              ? ''
              : String(v);
          if (required && s.trim() === '') {
            setErr(name, 'Campo requerido.');
          }

          const pattern = (field as any).pattern as string | undefined;
          if (pattern && s.trim() !== '') {
            try {
              const re = new RegExp(pattern);
              if (!re.test(s)) {
                setErr(name, 'Formato inválido.');
              }
            } catch {
              // regex mal formado → se ignora
            }
          }
          break;
        }

        case 'date': {
          const s =
            typeof v === 'string'
              ? v
              : v == null
              ? ''
              : String(v);
          if (required && s.trim() === '') {
            setErr(name, 'Campo requerido.');
          }
          break;
        }

        case 'number': {
          const raw = v;
          const num =
            typeof raw === 'number'
              ? raw
              : raw === '' || raw == null
              ? NaN
              : Number(raw);

          if (required && (isNaN(num) || raw === '' || raw == null)) {
            setErr(name, 'Campo numérico requerido.');
            break;
          }

          if (!isNaN(num)) {
            if (min != null && num < min) {
              setErr(name, `Debe ser ≥ ${min}.`);
            }
            if (max != null && num > max) {
              setErr(name, `Debe ser ≤ ${max}.`);
            }
          }
          break;
        }

        case 'boolean': {
          // false es válido; solo invalidamos null/undefined si es requerido
          if (required && v === undefined) {
            setErr(name, 'Campo requerido.');
          }
          break;
        }

        case 'select': {
          const s =
            typeof v === 'string'
              ? v
              : v == null
              ? ''
              : String(v);
          if (required && s.trim() === '') {
            setErr(name, 'Selecciona un valor.');
          }
          break;
        }

        case 'multiselect': {
          const arr: any[] = Array.isArray(v)
            ? v
            : v == null
            ? []
            : [v];
          if (required && arr.length === 0) {
            setErr(name, 'Selecciona al menos un valor.');
          }
          break;
        }

        case 'object':
        case 'array': {
          const txt =
            typeof v === 'string'
              ? v
              : v == null
              ? ''
              : String(v);

          if (required && txt.trim() === '') {
            setErr(name, 'Campo requerido.');
            break;
          }

          if (txt.trim() !== '') {
            try {
              jsonParsed[name] = JSON.parse(txt);
            } catch {
              setErr(name, 'JSON inválido.');
            }
          } else {
            jsonParsed[name] = type === 'array' ? [] : {};
          }
          break;
        }

        default:
          break;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('validation');
      setSaving(false);
      return;
    }

    try {
      const ref = doc(
        FbDB,
        currentSchema.fsCollection,
        currentSchema.fsDocId,
      );

      const out: PanelData = {
        ...data,
        _updatedAt: Date.now(),
      };

      // Sustituimos los string JSON por objetos reales
      for (const field of currentSchema.fields) {
        if (field.type === 'object' || field.type === 'array') {
          if (field.name in jsonParsed) {
            out[field.name] = jsonParsed[field.name];
          }
        }
      }

      await setDoc(ref, out, { merge: true });
      setSaved(true);
      setError(null);
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
      const pattern = (field as any).pattern as string | undefined;

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
            placeholder={'URL'}
            value={strVal}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        );
      }

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
          pattern={pattern}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      );
    }

    // NUMBER
    if (type === 'number') {
      const min = (field as any).min as number | undefined;
      const max = (field as any).max as number | undefined;
      const step = (field as any).step as number | undefined;

      const placeholder =
        (field as any).placeholder ??
        (min != null && max != null ? `${min} – ${max}` : '');

      const numVal =
        typeof value === 'number' || typeof value === 'string' ? value : '';

      return (
        <INPUT
          type="number"
          value={numVal}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(e) => {
            // guardamos tal cual lo que escribe
            handleFieldChange(field, e.target.value);
          }}
          onBlur={(e) => {
            const raw = e.target.value.trim();
            if (!raw) {
              handleFieldChange(field, '');
              return;
            }
            let num = Number(raw);
            if (isNaN(num)) {
              handleFieldChange(field, '');
              return;
            }
            if (min != null && num < min) num = min;
            if (max != null && num > max) num = max;
            handleFieldChange(field, num);
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
      const opts: PanelFieldOption[] =
        isScalarField(field) && Array.isArray(field.options)
          ? field.options
          : [];

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

      if (widget === 'radio') {
        const curVal = value == null ? '' : String(value);
        return (
          <DIV className="flex flex-wrap gap-3">
            {opts.map((opt: PanelFieldOption) => (
              <label
                key={opt.value}
                className="flex.items-center gap-1 text-sm"
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

    // OBJECT / ARRAY → string JSON plano (sin parse en cada tecla)
    if (type === 'object' || type === 'array') {
      const txt =
        typeof value === 'string'
          ? value
          : value == null
          ? ''
          : String(value);

      return (
        <textarea
          className="w-full min-h-[120px] text-xs font-mono bg-black/60 text-white px-2 py-1 rounded"
          value={txt}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={type === 'array' ? '[ ]' : '{ }'}
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

  // Agrupar campos por groupKey solo para UI
  const groupedFields: [string, PanelField[]][] = useMemo(() => {
    if (!currentSchema) return [];
    const map = new Map<string, PanelField[]>();

    for (const f of currentSchema.fields) {
      const key =
        f.groupKey && f.groupKey.trim().length > 0 ? f.groupKey : 'General';
      const arr = map.get(key) ?? [];
      arr.push(f);
      map.set(key, arr);
    }

    return Array.from(map.entries());
  }, [currentSchema]);

  // -------------------- Render principal --------------------

  if (!availableSchemas.length) {
    return (
      <DIV className="p-4">
        <P className="text-sm">
          No hay esquemas de panel registrados en el core.
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
              setFieldErrors({});
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
          {error === 'validation' &&
            'Hay errores en el formulario. Revisa los campos marcados.'}
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
            ({currentSchema.id})
          </SPAN>

          {/* Grupos por groupKey con acordeón */}
          <DIV className="flex flex-col gap-4 mt-2">
            {groupedFields.map(([groupKey, fields]) => {
              const isOpen = openGroups[groupKey] ?? true;
              return (
                <DIV
                  key={groupKey}
                  className="border border-white/10 rounded-md bg-black/30"
                >
                  <button
                    type="button"
                    className="w-full flex justify-between items-center px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [groupKey]: !isOpen,
                      }))
                    }
                  >
                    <SPAN className="opacity-80">{groupKey}</SPAN>
                    <SPAN className="text-[10px] opacity-60">
                      {isOpen ? '▲' : '▼'}
                    </SPAN>
                  </button>

                  {isOpen && (
                    <DIV className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 px-3 pb-3">
                      {fields.map((field) => {
                        const err = fieldErrors[field.name];
                        const hasErr = !!err;
                        return (
                          <DIV
                            key={field.name}
                            className={`flex flex-col gap-1 rounded-md p-3 bg-black/40 border ${
                              hasErr
                                ? 'border-red-500'
                                : 'border-white/10'
                            }`}
                          >
                            <LABEL className="text-xs font-semibold flex justify-between">
                              <span className="flex items-center gap-1">
                                <FieldTitle field={field} />
                                {field.required && (
                                  <SPAN className="text-red-400">*</SPAN>
                                )}
                              </span>
                              <span className="opacity-60 font-mono text-[10px]">
                                {field.type}
                              </span>
                            </LABEL>

                            <FieldHint field={field} />

                            {renderFieldInput(field)}

                            {hasErr && (
                              <P className="text-[11px] text-red-400 mt-1">
                                {err}
                              </P>
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
