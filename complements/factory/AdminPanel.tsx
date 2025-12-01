// complements/factory/AdminPanel.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { FbDB, FbStorage } from '@/app/lib/services/firebase';

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
  PanelUploadConfig,
} from './panelSchema.types';

import {
  syncPwaAssetsIntoDoc,
  purgePwaIcons,
  purgePwaScreenshots,
} from './pwa.sync';

import { PANEL_SCHEMAS } from './panelSchemas';

// Locales soportados para campos translatable
const SUPPORTED_LOCALES = ['en', 'es', 'fr'];

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
    case 'object': {
      const subFields = (field as any).fields as PanelField[] | undefined;
      const obj: any = {};
      if (Array.isArray(subFields)) {
        for (const sf of subFields) {
          if (!sf.name) continue;
          obj[sf.name] = buildDefaultValue(sf);
        }
      }
      return obj;
    }
    case 'array': {
      return [];
    }
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

type ValidateOpts = {
  baseLocale: string;
};

/**
 * Validación recursiva de un field (incluye object/array y subcampos).
 * path = key lógico para mapear errores (p.ej. "products[0].price").
 */
function validateFieldValue(
  field: PanelField,
  value: any,
  path: string,
  errors: FieldErrors,
  opts: ValidateOpts,
) {
  const setErr = (msg: string) => {
    if (!errors[path]) errors[path] = msg;
  };

  const t: PanelFieldType = field.type;
  const required = !!field.required;
  const min = (field as any).min as number | undefined;
  const max = (field as any).max as number | undefined;

  switch (t) {
    case 'string':
    case 'text': {
      const isTrans = (field as any).translatable === true;

      // Campo translatable: valor como map { [locale]: string }
      if (
        isTrans &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        const map = value as Record<string, any>;
        const rawBase = map[opts.baseLocale];
        const base =
          typeof rawBase === 'string'
            ? rawBase
            : rawBase == null
            ? ''
            : String(rawBase);

        if (required && base.trim() === '') {
          setErr(`Campo requerido (${opts.baseLocale}).`);
        }
        return;
      }

      // Modo “simple”: string plano
      const s =
        typeof value === 'string'
          ? value
          : value == null
          ? ''
          : String(value);

      if (required && s.trim() === '') {
        setErr('Campo requerido.');
      }

      const pattern = (field as any).pattern as string | undefined;
      if (pattern && s.trim() !== '') {
        try {
          const re = new RegExp(pattern);
          if (!re.test(s)) {
            setErr('Formato inválido.');
          }
        } catch {
          // regex mal formado → ignoramos
        }
      }
      break;
    }

    case 'date': {
      const s =
        typeof value === 'string'
          ? value
          : value == null
          ? ''
          : String(value);
      if (required && s.trim() === '') {
        setErr('Campo requerido.');
      }
      break;
    }

    case 'number': {
      const raw = value;
      const num =
        typeof raw === 'number'
          ? raw
          : raw === '' || raw == null
          ? NaN
          : Number(raw);

      if (required && (isNaN(num) || raw === '' || raw == null)) {
        setErr('Campo numérico requerido.');
        break;
      }

      if (!isNaN(num)) {
        if (min != null && num < min) {
          setErr(`Debe ser ≥ ${min}.`);
        }
        if (max != null && num > max) {
          setErr(`Debe ser ≤ ${max}.`);
        }
      }
      break;
    }

    case 'boolean': {
      if (required && value === undefined) {
        setErr('Campo requerido.');
      }
      break;
    }

    case 'select': {
      const s =
        typeof value === 'string'
          ? value
          : value == null
          ? ''
          : String(value);
      if (required && s.trim() === '') {
        setErr('Selecciona un valor.');
      }
      break;
    }

    case 'multiselect': {
      const arr: any[] = Array.isArray(value)
        ? value
        : value == null
        ? []
        : [value];
      if (required && arr.length === 0) {
        setErr('Selecciona al menos un valor.');
      }
      break;
    }

    case 'object': {
      const obj =
        value && typeof value === 'object' && !Array.isArray(value)
          ? (value as Record<string, any>)
          : {};

      if (required && (!value || Object.keys(obj).length === 0)) {
        setErr('Campo requerido.');
      }

      const subFields = (field as any).fields as PanelField[] | undefined;
      if (Array.isArray(subFields)) {
        for (const sf of subFields) {
          if (!sf.name) continue;
          const subVal = obj[sf.name];
          const subPath = `${path}.${sf.name}`;
          validateFieldValue(sf, subVal, subPath, errors, opts);
        }
      }
      break;
    }

    case 'array': {
      const arr: any[] = Array.isArray(value) ? value : [];

      if (required && arr.length === 0) {
        setErr('Selecciona o agrega al menos un elemento.');
      }

      const elementField = (field as any).element as PanelField | undefined;
      if (!elementField) break;

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const itemPath = `${path}[${i}]`;

        if (elementField.type === 'object') {
          const subFields = (elementField as any).fields as
            | PanelField[]
            | undefined;
          const itemObj =
            item && typeof item === 'object' && !Array.isArray(item)
              ? (item as Record<string, any>)
              : {};
          if (Array.isArray(subFields)) {
            for (const sf of subFields) {
              if (!sf.name) continue;
              const subVal = itemObj[sf.name];
              const subPath = `${itemPath}.${sf.name}`;
              validateFieldValue(sf, subVal, subPath, errors, opts);
            }
          }
        } else {
          validateFieldValue(elementField, item, itemPath, errors, opts);
        }
      }
      break;
    }

    default:
      break;
  }
}

// -------------------- FieldControl (fuera de AdminPanel) --------------------
type FieldControlProps = {
  field: PanelField;
  value: any;
  onChange: (v: any) => void;
  path: string;
  baseLocale: string;
  supportedLocales: string[];
  globalSubToggle: 'expand' | 'collapse' | null;
  fieldErrors: FieldErrors;
};

function FieldControl({
  field,
  value,
  onChange,
  path,
  baseLocale,
  supportedLocales,
  globalSubToggle,
  fieldErrors,
}: FieldControlProps) {
  const widget: PanelFieldWidget | undefined = field.widget;
  const type: PanelFieldType = field.type;
  const isContainer = type === 'object' || type === 'array';

  const [open, setOpen] = useState<boolean>(true);
  const [activeLocale, setActiveLocale] = useState<string>(baseLocale);
  const [showJson, setShowJson] = useState<boolean>(false);
  const [itemsOpen, setItemsOpen] = useState<Record<number, boolean>>({});

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const err = fieldErrors[path];
  const hasErr = !!err;

  useEffect(() => {
    if (!isContainer || !globalSubToggle) return;
    if (globalSubToggle === 'expand') setOpen(true);
    if (globalSubToggle === 'collapse') setOpen(false);
  }, [isContainer, globalSubToggle]);

  // STRING / TEXT (incluye translatable)
  const renderStringOrText = () => {
    const isTrans = (field as any).translatable === true;
    const pattern = (field as any).pattern as string | undefined;

    const normalize = (val: any): string => {
      if (typeof val === 'string') return val;
      if (val == null) return '';
      return String(val);
    };

    if (isTrans) {
      const isTextarea =
        widget === 'textarea' ||
        widget === 'markdown' ||
        widget === 'code' ||
        widget === 'json';

      // Si llega como objeto { en, es, fr }, tomamos baseLocale o el primero
      const strVal =
        typeof value === 'string'
          ? value
          : value == null
          ? ''
          : typeof value === 'object' && !Array.isArray(value)
          ? (() => {
              const map = value as Record<string, any>;
              const maybe = map[baseLocale] ?? Object.values(map)[0];
              return typeof maybe === 'string' ? maybe : '';
            })()
          : String(value);

      if (isTextarea) {
        return (
          <textarea
            className="w-full min-h-[80px] text-sm bg-black/60 text-white px-2 py-1 rounded resize-y"
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      }

      return (
        <INPUT
          type="text"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }

    // No translatable
    const isTextarea =
      widget === 'textarea' ||
      widget === 'markdown' ||
      widget === 'code' ||
      widget === 'json';

    if (isTextarea) {
      const strVal = normalize(value);
      return (
        <textarea
          className="w-full min-h-[80px] text-sm bg-black/60 text-white px-2 py-1 rounded resize-y"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
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
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }

    if (widget === 'image' || widget === 'file') {
      const strVal = normalize(value);
      return (
        <INPUT
          type="text"
          placeholder="URL"
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }

    const strVal = normalize(value);
    return (
      <INPUT
        type="text"
        value={strVal}
        pattern={pattern}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };

  // Subida a Storage para widget === "upload"
  const renderUpload = () => {
    const uploadCfg = (field as any).uploadConfig as
      | PanelUploadConfig
      | undefined;
    const acceptProp = (field as any).accept as
      | string
      | string[]
      | undefined;

    // Por defecto, cualquier imagen
    const acceptAttr =
      (Array.isArray(acceptProp)
        ? acceptProp.join(',')
        : acceptProp) || 'image/*';

    const handleFileChange = async (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadError(null);

      // 0) Asegurarnos que es imagen
      if (!file.type.startsWith('image/')) {
        setUploadError('Solo se permiten archivos de imagen.');
        return;
      }

      // 1) Validar nombre base (opcional, según schema)
      if (uploadCfg?.validateBaseName) {
        const expected = uploadCfg.validateBaseName;
        const nameWithoutExt = file.name.replace(/\.[^.]+$/, ''); // sin extensión

        if (nameWithoutExt !== expected) {
          setUploadError(
            `El archivo debe llamarse "${expected}" (ej. ${expected}.png, ${expected}.jpg, ${expected}.webp).`,
          );
          return;
        }
      }

      setUploading(true);
      try {
        // 2) Construir ruta en Storage
        const folder = (uploadCfg?.storageFolder || '').replace(/\/+$/, '');
        const targetFileName = uploadCfg?.targetFileName || file.name;
        const path = folder ? `${folder}/${targetFileName}` : targetFileName;

        // 3) Purgar SOLO la carpeta correcta antes de subir
        if (folder === 'manifest/icons') {
          await purgePwaIcons();
        } else if (folder === 'manifest/screenshots') {
          await purgePwaScreenshots();
        }

        // 4) Subir el archivo
        const storageRef = ref(FbStorage, path);
        await uploadBytes(storageRef, file);

        // 5) Guardamos la ruta lógica en FS (el manifest ya sabe el bucket)
        onChange(path);
      } catch (err) {
        console.error('[AdminPanel] Error subiendo archivo', err);
        setUploadError('Error al subir el archivo a Storage.');
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept={acceptAttr}
          onChange={handleFileChange}
        />
        {uploading && (
          <SPAN className="text-[11px] opacity-70">
            Subiendo archivo…
          </SPAN>
        )}
        {typeof value === 'string' && value && (
          <SPAN className="text-[10px] opacity-70 break-all">
            Ruta actual: {value}
          </SPAN>
        )}
        {uploadError && (
          <P className="text-[11px] text-red-400">{uploadError}</P>
        )}
      </div>
    );
  };

  const renderScalarInput = () => {
    // Caso especial: widget "upload"
    if (type === 'string' && widget === 'upload') {
      return renderUpload();
    }

    if (type === 'string' || type === 'text') {
      return renderStringOrText();
    }

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
            onChange(e.target.value);
          }}
          onBlur={(e) => {
            const raw = e.target.value.trim();
            if (!raw) {
              onChange('');
              return;
            }
            let num = Number(raw);
            if (isNaN(num)) {
              onChange('');
              return;
            }
            if (min != null && num < min) num = min;
            if (max != null && num > max) num = max;
            onChange(num);
          }}
        />
      );
    }

    if (type === 'boolean') {
      const boolVal = value === true;
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={boolVal}
            onChange={(e) => onChange(e.target.checked)}
          />
          <SPAN className="text-xs opacity-70">
            {field.widget === 'switch' ? 'Switch' : 'Checkbox'}
          </SPAN>
        </div>
      );
    }

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
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }

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
              onChange(selected);
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
                className="flex items-center gap-1 text-sm"
              >
                <input
                  type="radio"
                  value={opt.value}
                  checked={curVal === opt.value}
                  onChange={() => onChange(opt.value)}
                />
                <SPAN>{opt.labelKey || opt.value}</SPAN>
              </label>
            ))}
          </DIV>
        );
      }

      const curVal = value == null ? '' : String(value);
      return (
        <SELECT value={curVal} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Selecciona —</option>
          {opts.map((opt: PanelFieldOption) => (
            <option key={opt.value} value={opt.value}>
              {opt.labelKey || opt.value}
            </option>
          ))}
        </SELECT>
      );
    }

    return (
      <INPUT
        type="text"
        value={value == null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };

  const renderObjectField = () => {
    const obj: Record<string, any> =
      value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};

    const subFields = (field as any).fields as PanelField[] | undefined;

    if (!Array.isArray(subFields) || subFields.length === 0) {
      return (
        <P className="text-xs opacity-60">
          (Este object no tiene subcampos definidos en el esquema.)
        </P>
      );
    }

    if (!open) return null;

    return (
      <DIV className="flex flex-col gap-3 border border-white/10 rounded-md p-2 bg-black/20 mt-1">
        {subFields.map((sf) => {
          if (!sf.name) return null;
          const subPath = `${path}.${sf.name}`;
          const subVal = obj[sf.name];
          return (
            <FieldControl
              key={subPath}
              field={sf}
              value={subVal}
              onChange={(newSubVal) => {
                const next = { ...obj, [sf.name]: newSubVal };
                onChange(next);
              }}
              path={subPath}
              baseLocale={baseLocale}
              supportedLocales={supportedLocales}
              globalSubToggle={globalSubToggle}
              fieldErrors={fieldErrors}
            />
          );
        })}
      </DIV>
    );
  };

  const renderArrayField = () => {
    const items: any[] = Array.isArray(value) ? value : [];
    const elementField = (field as any).element as PanelField | undefined;

    if (!elementField) {
      return (
        <P className="text-xs opacity-60">
          (Este array no tiene esquema de elemento definido.)
        </P>
      );
    }

    if (!open) return null;

    // ─────────────────────────────
    // Distinción: array raíz vs array anidado
    // ─────────────────────────────
    // Ej:
    //  - "notifications"          → raíz  (grilla 3 columnas)
    //  - "notifications[0].media" → anidado (columna vertical)
    const isRootArray = !path.includes('.') && !path.includes('[');

    const handleItemChange = (index: number, newItem: any) => {
      const next = [...items];
      next[index] = newItem;
      onChange(next);
    };

    const handleItemRemove = (index: number) => {
      const next = items.filter((_, i) => i !== index);
      onChange(next);
    };

    const handleAddItem = () => {
      const newItem = buildDefaultValue(elementField);
      onChange([...items, newItem]);
    };

    const containerClass = isRootArray
      ? 'mt-1 grid gap-3 md:grid-cols-2 xl:grid-cols-3'
      : 'mt-1 flex flex-col gap-3';

    const itemCardClass = isRootArray
      ? 'border border-white/15 rounded-md p-2 bg-black/30 h-full flex flex-col'
      : 'border border-white/15 rounded-md p-2 bg-black/30';

    return (
      <DIV className={containerClass}>
        {items.length === 0 && (
          <P
            className={`text-xs opacity-60 ${
              isRootArray ? 'col-span-full' : ''
            }`}
          >
            No hay elementos.
          </P>
        )}

        {items.map((item, idx) => {
          const itemPath = `${path}[${idx}]`;

          if (elementField.type === 'object') {
            const subFields = (elementField as any).fields as
              | PanelField[]
              | undefined;
            const itemObj =
              item && typeof item === 'object' && !Array.isArray(item)
                ? (item as Record<string, any>)
                : {};

            return (
              <DIV key={itemPath} className={itemCardClass}>
                <DIV className="flex justify-between items-center mb-1">
                  <SPAN className="text-xs opacity-70">Item #{idx + 1}</SPAN>
                  <button
                    type="button"
                    className="text-[10px] opacity-70 hover:opacity-100"
                    onClick={() => handleItemRemove(idx)}
                  >
                    Eliminar
                  </button>
                </DIV>

                {Array.isArray(subFields) && subFields.length > 0 ? (
                  <DIV className="flex flex-col gap-2">
                    {subFields.map((sf) => {
                      if (!sf.name) return null;
                      const subPath = `${itemPath}.${sf.name}`;
                      const subVal = itemObj[sf.name];
                      return (
                        <FieldControl
                          key={subPath}
                          field={sf}
                          value={subVal}
                          onChange={(newSubVal) => {
                            const nextItem = {
                              ...itemObj,
                              [sf.name]: newSubVal,
                            };
                            handleItemChange(idx, nextItem);
                          }}
                          path={subPath}
                          baseLocale={baseLocale}
                          supportedLocales={supportedLocales}
                          globalSubToggle={globalSubToggle}
                          fieldErrors={fieldErrors}
                        />
                      );
                    })}
                  </DIV>
                ) : (
                  <P className="text-xs opacity-60">
                    (El esquema del elemento no define subcampos.)
                  </P>
                )}
              </DIV>
            );
          }

          return (
            <DIV key={itemPath} className={itemCardClass}>
              <DIV className="flex justify-between items-center mb-1">
                <SPAN className="text-xs opacity-70">Item #{idx + 1}</SPAN>
                <button
                  type="button"
                  className="text-[10px] opacity-70 hover:opacity-100"
                  onClick={() => handleItemRemove(idx)}
                >
                  Eliminar
                </button>
              </DIV>
              <FieldControl
                field={elementField}
                value={item}
                onChange={(newVal) => handleItemChange(idx, newVal)}
                path={itemPath}
                baseLocale={baseLocale}
                supportedLocales={supportedLocales}
                globalSubToggle={globalSubToggle}
                fieldErrors={fieldErrors}
              />
            </DIV>
          );
        })}

        <DIV className={isRootArray ? 'col-span-full' : ''}>
          <BUTTON kind="button" type="button" onClick={handleAddItem}>
            + Agregar elemento
          </BUTTON>
        </DIV>
      </DIV>
    );
  };
  
  const renderControl = () => {
    if (type === 'object') return renderObjectField();
    if (type === 'array') return renderArrayField();
    return renderScalarInput();
  };

  return (
    <DIV
      className={`flex flex-col gap-1 rounded-md p-3 bg-black/40 border ${
        hasErr ? 'border-red-500' : 'border-white/10'
      }`}
    >
      <LABEL className="text-xs font-semibold flex justify-between">
        <span className="flex items-center gap-1">
          <FieldTitle field={field} />
          {field.required && <SPAN className="text-red-400">*</SPAN>}
          {(field as any).translatable && (
            <SPAN className="text-[10px] px-1 rounded bg-blue-500/30 text-blue-100">
              Translation i18n Required
            </SPAN>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className="opacity-60 font-mono text-[10px]">
            {field.type}
          </span>
          {isContainer && (
            <button
              type="button"
              className="text-[10px] opacity-60 hover:opacity-100"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? '▲' : '▼'}
            </button>
          )}
        </span>
      </LABEL>

      <FieldHint field={field} />

      {renderControl()}

      {hasErr && (
        <P className="text-[11px] text-red-400 mt-1">{err}</P>
      )}
    </DIV>
  );
}

// -------------------- Componente principal --------------------

export function AdminPanel({ locale }: AdminPanelProps) {
  const shortLocale = locale.split('-')[0].toLowerCase();

  const availableSchemas: PanelSchema[] = useMemo(
    () => Object.values(PANEL_SCHEMAS),
    [],
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [data, setData] = useState<PanelData>({});
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [globalSubToggle, setGlobalSubToggle] = useState<
    'expand' | 'collapse' | null
  >(null);
  const [subSchemasExpanded, setSubSchemasExpanded] =
    useState<boolean>(true);

  const allGroupsOpen =
    Object.keys(openGroups).length > 0 &&
    Object.keys(openGroups).every(
      (k) => openGroups[k] === undefined || openGroups[k] === true,
    );

  const [showI18nExport, setShowI18nExport] = useState<boolean>(false);
  const [copiedI18nExport, setCopiedI18nExport] =
    useState<boolean>(false);

  const [esJsonRaw, setEsJsonRaw] = useState<string>('');
  const [enJsonRaw, setEnJsonRaw] = useState<string>('');
  const [frJsonRaw, setFrJsonRaw] = useState<string>('');
  const [i18nJsonGlobalError, setI18nJsonGlobalError] =
    useState<string | null>(null);

  // Selección de schema por defecto
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

  // Cargar Firestore
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

        if (!cancelled) {
          setData(merged);

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

  const setFieldValue = (rootName: string, newValue: any) => {
    setData((prev) => ({
      ...prev,
      [rootName]: newValue,
    }));
    setSaved(false);
    setFieldErrors((prev) => {
      const copy: FieldErrors = { ...prev };
      const prefixDot = `${rootName}.`;
      const prefixArr = `${rootName}[`;
      for (const key of Object.keys(copy)) {
        if (
          key === rootName ||
          key.startsWith(prefixDot) ||
          key.startsWith(prefixArr)
        ) {
          delete copy[key];
        }
      }
      return copy;
    });
  };

  const toggleAllGroups = () => {
    setOpenGroups((prev) => {
      const keys = Object.keys(prev);
      if (!keys.length) return prev;

      const allOpen = keys.every(
        (k) => prev[k] === undefined || prev[k] === true,
      );

      const next: Record<string, boolean> = {};
      for (const k of keys) {
        next[k] = !allOpen;
      }
      return next;
    });
  };

  const toggleAllSubschemas = () => {
    setSubSchemasExpanded((prev) => {
      const next = !prev;
      setGlobalSubToggle(next ? 'expand' : 'collapse');
      return next;
    });
  };

  const handleCopyI18nExport = async () => {
    try {
      if (!i18nExportText) return;
      await navigator.clipboard.writeText(i18nExportText);
      setCopiedI18nExport(true);
      setTimeout(() => setCopiedI18nExport(false), 1500);
    } catch (e) {
      console.error('[AdminPanel] No se pudo copiar el JSON i18n', e);
    }
  };

  // Guardar
  const handleSave = async () => {
    if (!currentSchema) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    setI18nJsonGlobalError(null);

    const newErrors: FieldErrors = {};

    // 1) Validación de campos del panel
    for (const field of currentSchema.fields) {
      const v = data[field.name];
      validateFieldValue(field, v, field.name, newErrors, {
        baseLocale: shortLocale,
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('validation');
      setSaving(false);
      return;
    }

    // 2) Validación y parseo de JSON ES/EN/FR (solo si hay textos traducibles
    //    y el panel es provider, es decir, alimenta FDV)
    let esDoc: Record<string, string> | null = null;
    let enDoc: Record<string, string> | null = null;
    let frDoc: Record<string, string> | null = null;

    if (baseI18nKeys.length > 0 && currentSchema.isProvider) {
      const locales = [
        { label: 'ES', raw: esJsonRaw, info: esInfo },
        { label: 'EN', raw: enJsonRaw, info: enInfo },
        { label: 'FR', raw: frJsonRaw, info: frInfo },
      ];

      // Validar que los tres JSON existen, son válidos y tienen todas las keys
      for (const loc of locales) {
        if (!loc.raw.trim()) {
          setI18nJsonGlobalError(
            `Falta pegar el JSON traducido para ${loc.label}.`,
          );
          setError('validation');
          setSaving(false);
          return;
        }
        if (loc.info.error) {
          setI18nJsonGlobalError(
            `El JSON para ${loc.label} no es válido. Corrige el error antes de guardar.`,
          );
          setError('validation');
          setSaving(false);
          return;
        }
        if (loc.info.missingKeys.length > 0) {
          setI18nJsonGlobalError(
            `Al JSON de ${loc.label} le faltan ${loc.info.missingKeys.length} claves de las ${baseI18nKeys.length} requeridas.`,
          );
          setError('validation');
          setSaving(false);
          return;
        }
      }

      // Si todo está bien, parseamos los tres JSON a objetos plano { id: texto }
      try {
        esDoc = JSON.parse(esJsonRaw) as Record<string, string>;
        enDoc = JSON.parse(enJsonRaw) as Record<string, string>;
        frDoc = JSON.parse(frJsonRaw) as Record<string, string>;
      } catch (e) {
        console.error('[AdminPanel] JSON i18n no parseable:', e);
        setI18nJsonGlobalError(
          'No se pudieron parsear los JSON de traducciones. Revisa el formato.',
        );
        setError('validation');
        setSaving(false);
        return;
      }
    }

    // 3) Escritura en Firestore
    try {
      // Doc principal del panel, p.ej. Providers/pwa
      const ref = doc(
        FbDB,
        currentSchema.fsCollection,
        currentSchema.fsDocId,
      );

      const out: PanelData = {
        ...data,
        _updatedAt: Date.now(),
      };

      const writes: Promise<any>[] = [
        setDoc(ref, out, { merge: true }),
      ];

      // Si este esquema es provider y tenemos JSON válidos,
      // guardamos también Providers/es, Providers/en, Providers/fr
      if (currentSchema.isProvider && baseI18nKeys.length > 0) {
        if (esDoc) {
          writes.push(
            setDoc(
              doc(FbDB, 'Providers', 'es'),
              esDoc,
              { merge: true },
            ),
          );
        }
        if (enDoc) {
          writes.push(
            setDoc(
              doc(FbDB, 'Providers', 'en'),
              enDoc,
              { merge: true },
            ),
          );
        }
        if (frDoc) {
          writes.push(
            setDoc(
              doc(FbDB, 'Providers', 'fr'),
              frDoc,
              { merge: true },
            ),
          );
        }
      }

      await Promise.all(writes);

      // Si este schema es el PWA (Providers/pwa),
      // sincronizamos los assets desde Storage a Providers/pwa
      if (
        currentSchema.fsCollection === 'Providers' &&
        currentSchema.fsDocId === 'pwa'
      ) {
        try {
          await syncPwaAssetsIntoDoc();
        } catch (e) {
          console.error('[AdminPanel] Error en syncPwaAssetsIntoDoc:', e);
          // No frenamos el guardado si falla la sync; solo lo anotamos en consola
        }
      }

      setSaved(true);
      setError(null);
    } catch (e) {
      console.error('[AdminPanel] error al guardar:', e);
      setError('save');
    } finally {
      setSaving(false);
    }
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

  const i18nExportText = useMemo(() => {
    if (!currentSchema) return '';

    const out: Record<string, string> = {};
    const baseLocale = shortLocale;

    const getStringFromValue = (val: any): string => {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const maybe =
          (val as any)[baseLocale] ?? Object.values(val as any)[0];
        return typeof maybe === 'string' ? maybe : '';
      }
      return val == null ? '' : String(val);
    };

    const walk = (
      field: PanelField,
      value: any,
      path: string,
    ) => {
      const isTrans = (field as any).translatable === true;
      const t = field.type as PanelFieldType;

      // 1) Campos string/text marcados como translatable
      if ((t === 'string' || t === 'text') && isTrans) {
        const s = getStringFromValue(value);
        const key = `${currentSchema.id}.${path}`;
        // Siempre registramos la clave, aunque el valor esté vacío
        out[key] = s ?? '';
        return;
      }

      // 2) object: bajar a subcampos
      if (t === 'object') {
        const obj =
          value && typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, any>)
            : {};
        const subFields = (field as any).fields as PanelField[] | undefined;
        if (!Array.isArray(subFields)) return;

        for (const sf of subFields) {
          if (!sf.name) continue;
          walk(sf, obj[sf.name], `${path}.${sf.name}`);
        }
        return;
      }

      // 3) array: recorrer items
      if (t === 'array') {
        const arr: any[] = Array.isArray(value) ? value : [];
        const elementField = (field as any).element as PanelField | undefined;
        if (!elementField) return;

        arr.forEach((item, idx) => {
          const itemPath = `${path}[${idx}]`;

          if (elementField.type === 'object') {
            const itemObj =
              item && typeof item === 'object' && !Array.isArray(item)
                ? (item as Record<string, any>)
                : {};
            const subFields = (elementField as any).fields as
              | PanelField[]
              | undefined;
            if (!Array.isArray(subFields)) return;

            for (const sf of subFields) {
              if (!sf.name) continue;
              walk(sf, itemObj[sf.name], `${itemPath}.${sf.name}`);
            }
          } else {
            walk(elementField, item, itemPath);
          }
        });
        return;
      }
    };

    for (const field of currentSchema.fields) {
      const val = data[field.name];
      walk(field, val, field.name);
    }

    const keys = Object.keys(out);
    if (keys.length === 0) return '';

    return JSON.stringify(out, null, 2);
  }, [currentSchema, data, shortLocale]);

  const baseI18nKeys = useMemo(() => {
    if (!i18nExportText) return [] as string[];
    try {
      const obj = JSON.parse(i18nExportText) as Record<string, any>;
      return Object.keys(obj);
    } catch {
      return [];
    }
  }, [i18nExportText]);

  type LocaleJsonInfo = {
    error: string | null;
    missingKeys: string[];
  };

  const esInfo = useMemo<LocaleJsonInfo>(() => {
    if (!esJsonRaw.trim()) {
      return { error: null, missingKeys: baseI18nKeys };
    }
    try {
      const obj = JSON.parse(esJsonRaw) as Record<string, any>;
      const missing = baseI18nKeys.filter((k) => !(k in obj));
      return { error: null, missingKeys: missing };
    } catch {
      return {
        error: 'JSON inválido. Revisa comas, llaves y comillas dobles.',
        missingKeys: [],
      };
    }
  }, [esJsonRaw, baseI18nKeys]);

  const enInfo = useMemo<LocaleJsonInfo>(() => {
    if (!enJsonRaw.trim()) {
      return { error: null, missingKeys: baseI18nKeys };
    }
    try {
      const obj = JSON.parse(enJsonRaw) as Record<string, any>;
      const missing = baseI18nKeys.filter((k) => !(k in obj));
      return { error: null, missingKeys: missing };
    } catch {
      return {
        error: 'JSON inválido. Revisa comas, llaves y comillas dobles.',
        missingKeys: [],
      };
    }
  }, [enJsonRaw, baseI18nKeys]);

  const frInfo = useMemo<LocaleJsonInfo>(() => {
    if (!frJsonRaw.trim()) {
      return { error: null, missingKeys: baseI18nKeys };
    }
    try {
      const obj = JSON.parse(frJsonRaw) as Record<string, any>;
      const missing = baseI18nKeys.filter((k) => !(k in obj));
      return { error: null, missingKeys: missing };
    } catch {
      return {
        error: 'JSON inválido. Revisa comas, llaves y comillas dobles.',
        missingKeys: [],
      };
    }
  }, [frJsonRaw, baseI18nKeys]);

  // -------------------- Render principal --------------------

  if (!currentSchema) {
    return (
      <DIV className="p-4">
        <P className="text-sm">
          No hay un esquema de panel disponible para este AdminPanel.
        </P>
      </DIV>
    );
  }

  return (
    <DIV className="p-4 flex flex-col gap-6">
      {/* Header */}
      <DIV className="mb-2">
        <SPAN className="text-xl font-bold flex items-center gap-2">
          Admin Panel (FUI–PUI v3)
          <SPAN className="text-xs opacity-60 font-mono">
            ({currentSchema.id})
          </SPAN>
        </SPAN>
        <P className="text-sm opacity-75 mt-1">
          Este panel administra datos en Firestore para la colección{' '}
          <SPAN className="font-mono">
            {currentSchema.fsCollection}/{currentSchema.fsDocId}
          </SPAN>
          {currentSchema.isProvider && (
            <>
              {' '}
              y alimenta la FDV (
              <SPAN className="font-mono">isProvider = true</SPAN>).
            </>
          )}
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
            {availableSchemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.labelKey || s.id} {s.isProvider ? ' (FDV)' : ''}
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

      {/* Controles globales de grupos y subesquemas */}
      {!loadingDoc && (
        <DIV className="flex justify-end gap-2 text-xs">
          <BUTTON
            kind="button"
            type="button"
            onClick={toggleAllGroups}
          >
            {allGroupsOpen ? 'Colapsar grupos' : 'Expandir grupos'}
          </BUTTON>

          <BUTTON
            kind="button"
            type="button"
            onClick={toggleAllSubschemas}
          >
            {subSchemasExpanded
              ? 'Colapsar subesquemas'
              : 'Expandir subesquemas'}
          </BUTTON>
        </DIV>
      )}

      {/* Formulario dinámico */}
      {!loadingDoc && (
        <DIV className="border border-white/10 rounded-lg p-4 flex flex-col gap-4 bg-black/40">
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
                        // Arrays y objects ocupan toda la fila del grid
                        const isWide =
                          field.type === 'array' || field.type === 'object';

                        const colSpanClass = isWide ? 'md:col-span-2 lg:col-span-3' : '';

                        return (
                          <DIV key={field.name} className={colSpanClass}>
                            <FieldControl
                              field={field}
                              value={data[field.name]}
                              onChange={(newVal) =>
                                setFieldValue(field.name, newVal)
                              }
                              path={field.name}
                              baseLocale={shortLocale}
                              supportedLocales={SUPPORTED_LOCALES}
                              globalSubToggle={globalSubToggle}
                              fieldErrors={fieldErrors}
                            />
                          </DIV>
                        );
                      })}
                    </DIV>
                  )}
                </DIV>
              );
            })}

          </DIV>

          {/* Sección de export de textos traducibles */}
          {i18nExportText && (
            <DIV className="mt-4 border border-white/15 rounded-md bg-black/30">
              <button
                type="button"
                className="w-full flex justify-between items-center px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                onClick={() => setShowI18nExport((prev) => !prev)}
              >
                <SPAN className="opacity-80">
                  JSON de textos traducibles ({shortLocale.toUpperCase()})
                </SPAN>
                <SPAN className="text-[10px] opacity-60">
                  {showI18nExport ? '▲' : '▼'}
                </SPAN>
              </button>

              {showI18nExport && (
                <DIV className="p-3 flex flex-col gap-3">
                  {/* JSON original */}
                  <DIV className="flex justify-between items-center">
                    <SPAN className="text-[11px] opacity-70">
                      Copia este JSON y mándalo a traducir. Cada key es
                      <SPAN className="font-mono">
                        {' '}
                        {currentSchema.id}.path
                      </SPAN>{' '}
                      del campo en {shortLocale.toUpperCase()}.
                    </SPAN>
                    <BUTTON
                      kind="button"
                      type="button"
                      onClick={handleCopyI18nExport}
                    >
                      {copiedI18nExport ? 'Copiado' : 'Copiar JSON'}
                    </BUTTON>
                  </DIV>

                  <textarea
                    readOnly
                    className="w-full h-48 text-[11px] font-mono bg-black/70 text-white px-2 py-1 rounded resize-y"
                    value={i18nExportText}
                  />

                  {/* IDs requeridos */}
                  {baseI18nKeys.length > 0 && (
                    <DIV className="mt-2">
                      <SPAN className="text-[11px] opacity-80">
                        IDs requeridos ({baseI18nKeys.length}):
                      </SPAN>
                      <DIV className="max-h-32 overflow-auto border border-white/20 rounded mt-1 px-2 py-1 bg-black/40">
                        {baseI18nKeys.map((k) => (
                          <P key={k} className="text-[10px] font-mono break-all">
                            {k}
                          </P>
                        ))}
                      </DIV>
                    </DIV>
                  )}

                  {/* Instrucciones para ChatGPT */}
                  <DIV className="mt-2 border-t border-white/10 pt-3 flex flex-col gap-2">
                    <SPAN className="text-[11px] opacity-80">
                      1. Abre ChatGPT en una nueva pestaña y pega el JSON anterior.
                    </SPAN>
                    <SPAN className="text-[11px]">
                      URL:{' '}
                      <a
                        href="https://chatgpt.com"
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        https://chatgpt.com
                      </a>
                    </SPAN>

                    <SPAN className="text-[11px] opacity-80">
                      2. Pide algo similar a lo siguiente:
                    </SPAN>
                    <textarea
                      readOnly
                      className="w-full h-32 text-[11px] font-mono bg-black/60 text-white px-2 py-1 rounded resize-y"
                      value={`Toma este JSON donde las keys son IDs de i18n. Genera un JSON POR IDIOMA para los siguientes locales: es, en, fr.
              Cada resultado debe ser un objeto plano { "id": "texto traducido" } conservando placeholders, nombres propios y formato.

              Respóndeme en este formato exacto, sin explicaciones adicionales:

              === es ===
              { ...json para es... }

              === en ===
              { ...json para en... }

              === fr ===
              { ...json para fr... }`}
                    />

                    <SPAN className="text-[11px] opacity-80">
                      3. Cuando ChatGPT te devuelva las traducciones, copia cada bloque
                      de JSON y pégalo en los recuadros de abajo. Más adelante se podrán
                      importar estos valores al nodo.
                    </SPAN>

                    {i18nJsonGlobalError && (
                      <P className="text-[11px] text-red-400 mt-2">
                        {i18nJsonGlobalError}
                      </P>
                    )}

                    {/* Recuadros para pegar resultados por idioma */}
                    <DIV className="grid gap-2 md:grid-cols-3 mt-1">
                      {/* ES */}
                      <DIV className="flex flex-col gap-1 border border-blue-500/60 rounded-md p-2 bg-black/40">
                        <SPAN className="text-[11px] opacity-80">
                          Resultado ES (JSON) *
                        </SPAN>
                        <textarea
                          className="w-full h-32 text-[11px] font-mono bg-black/60 text-white px-2 py-1 rounded resize-y"
                          placeholder='Pega aquí el JSON traducido a "es"'
                          value={esJsonRaw}
                          onChange={(e) => setEsJsonRaw(e.target.value)}
                        />
                        {esInfo.error && (
                          <P className="text-[11px] text-red-400 mt-1">
                            {esInfo.error}
                          </P>
                        )}
                        {!esInfo.error && baseI18nKeys.length > 0 && (
                          <>
                            {esInfo.missingKeys.length === 0 ? (
                              <P className="text-[10px] text-emerald-400 mt-1">
                                Todas las claves base ({baseI18nKeys.length}) están
                                presentes.
                              </P>
                            ) : (
                              <DIV className="mt-1">
                                <SPAN className="text-[10px] opacity-70">
                                  Faltan {esInfo.missingKeys.length} claves:
                                </SPAN>
                                <DIV className="max-h-24 overflow-auto border border-yellow-500/40 rounded mt-1 px-1 py-1">
                                  {esInfo.missingKeys.map((k) => (
                                    <P
                                      key={k}
                                      className="text-[10px] font-mono break-all"
                                    >
                                      {k}
                                    </P>
                                  ))}
                                </DIV>
                              </DIV>
                            )}
                          </>
                        )}
                      </DIV>

                      {/* EN */}
                      <DIV className="flex flex-col gap-1 border border-blue-500/60 rounded-md p-2 bg-black/40">
                        <SPAN className="text-[11px] opacity-80">
                          Resultado EN (JSON) *
                        </SPAN>
                        <textarea
                          className="w-full h-32 text-[11px] font-mono bg-black/60 text-white px-2 py-1 rounded resize-y"
                          placeholder='Pega aquí el JSON traducido a "en"'
                          value={enJsonRaw}
                          onChange={(e) => setEnJsonRaw(e.target.value)}
                        />
                        {enInfo.error && (
                          <P className="text-[11px] text-red-400 mt-1">
                            {enInfo.error}
                          </P>
                        )}
                        {!enInfo.error && baseI18nKeys.length > 0 && (
                          <>
                            {enInfo.missingKeys.length === 0 ? (
                              <P className="text-[10px] text-emerald-400 mt-1">
                                Todas las claves base ({baseI18nKeys.length}) están
                                presentes.
                              </P>
                            ) : (
                              <DIV className="mt-1">
                                <SPAN className="text-[10px] opacity-70">
                                  Faltan {enInfo.missingKeys.length} claves:
                                </SPAN>
                                <DIV className="max-h-24 overflow-auto border border-yellow-500/40 rounded mt-1 px-1 py-1">
                                  {enInfo.missingKeys.map((k) => (
                                    <P
                                      key={k}
                                      className="text-[10px] font-mono break-all"
                                    >
                                      {k}
                                    </P>
                                  ))}
                                </DIV>
                              </DIV>
                            )}
                          </>
                        )}
                      </DIV>

                      {/* FR */}
                      <DIV className="flex flex-col gap-1 border border-green-500/60 rounded-md p-2 bg-black/40">
                        <SPAN className="text-[11px] opacity-80">
                          Resultado FR (JSON) *
                        </SPAN>
                        <textarea
                          className="w-full h-32 text-[11px] font-mono bg-black/60 text-white px-2 py-1 rounded resize-y"
                          placeholder='Pega aquí el JSON traducido a "fr"'
                          value={frJsonRaw}
                          onChange={(e) => setFrJsonRaw(e.target.value)}
                        />
                        {frInfo.error && (
                          <P className="text-[11px] text-red-400 mt-1">
                            {frInfo.error}
                          </P>
                        )}
                        {!frInfo.error && baseI18nKeys.length > 0 && (
                          <>
                            {frInfo.missingKeys.length === 0 ? (
                              <P className="text-[10px] text-emerald-400 mt-1">
                                Todas las claves base ({baseI18nKeys.length}) están
                                presentes.
                              </P>
                            ) : (
                              <DIV className="mt-1">
                                <SPAN className="text-[10px] opacity-70">
                                  Faltan {frInfo.missingKeys.length} claves:
                                </SPAN>
                                <DIV className="max-h-24 overflow-auto border border-yellow-500/40 rounded mt-1 px-1 py-1">
                                  {frInfo.missingKeys.map((k) => (
                                    <P
                                      key={k}
                                      className="text-[10px] font-mono break-all"
                                    >
                                      {k}
                                    </P>
                                  ))}
                                </DIV>
                              </DIV>
                            )}
                          </>
                        )}
                      </DIV>
                    </DIV>
                  </DIV>
                </DIV>
              )}
            </DIV>
          )}

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
