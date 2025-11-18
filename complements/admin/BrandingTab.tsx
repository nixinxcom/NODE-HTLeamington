//complements\admin\BrandingTab.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';

import {
  brandingSchema,
  brandingSections,
  type FieldMeta,
  type FieldShape,
  type ScalarFieldMeta,
} from '@/complements/data/branding.schema';

import { loadBrandingGlobal, saveBrandingGlobal } from '@/complements/data/brandingFS';
import { ensureAnon } from '@/app/lib/services/firebase';
import { deepMerge } from '@/complements/utils/deep-merge';

import {
  BUTTON,
  INPUT,
  LABEL,
  SPAN,
  DIV,
  P,
  H2,
  H3,
} from '@/complements/components/ui/wrappers';

import FM from '@/complements/i18n/FM';

type PathValueChange = (path: string, value: any) => void;

// Placeholders neutrales por tipo (solo visual, NO se guarda)
const PLACEHOLDER_BY_KIND: Record<ScalarFieldMeta['kind'], string> = {
  string:   'string',
  textarea: 'text',
  number:   'number',
  lat:      'latitude',
  lng:      'longitude',
  zoom:     'zoom',
  angle:    'angle',
  bool:     '',
  url:      'url',
  email:    'email',
  phone:    'phone',
};

// ---------------------------------------------------------------------------
//  Componente principal
// ---------------------------------------------------------------------------

function BrandingTab() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureAnon();
      const existing = await loadBrandingGlobal();

      const defaults = buildDefaultsFromSchema(brandingSchema as FieldShape);
      const merged = deepMerge(defaults, (existing || {}) as any);

      setData(merged);
      setDirty(false);
    } catch (e) {
      console.error('[BrandingTab] error al cargar:', e);
      setError('load'); // flag interno, el texto lo pone <FM />
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange: PathValueChange = useCallback((path, value) => {
    setData((prev: any) => {
      if (!prev) return prev;
      return setValueAtPath(prev, path, value);
    });
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      await ensureAnon();
      await saveBrandingGlobal(data as any);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('[BrandingTab] error al guardar:', e);
      setError('save'); // flag interno
    } finally {
      setSaving(false);
    }
  }, [data]);

  if (loading) {
    return (
      <DIV className="p-4 text-sm text-neutral-300">
        <FM id="branding.loading" />
      </DIV>
    );
  }

  if (!data) {
    return (
      <DIV className="p-4 text-sm text-red-400">
        <FM id="branding.empty" />
      </DIV>
    );
  }

  return (
    <DIV className="relative space-y-4 pb-16">
      <H2 className="text-base font-semibold text-white mb-1">
        <FM id="branding.title" />
      </H2>

      <P className="text-sm text-neutral-400 mb-4">
        <FM id="branding.subtitle" />
      </P>

      {error && (
        <DIV className="border border-red-700 bg-red-950/40 text-red-200 text-xs px-3 py-2 rounded">
          {error === 'load' && <FM id="branding.error.load" />}
          {error === 'save' && <FM id="branding.error.save" />}
        </DIV>
      )}

      {/* Secciones definidas en el schema */}
      <DIV className="space-y-4">
        {brandingSections.map((section) => {
          const key = section.key as string;
          const meta = (brandingSchema as any)[key] as FieldMeta;
          const value = (data as any)[key];

          return (
            <Section
              key={key}
              sectionKey={key}
              titleId={section.titleId}
              translate={section.translate}
              descriptionId={section.descriptionId}
            >
              {renderField({
                fieldKey: key,
                meta,
                path: key,
                value,
                onChange: handleChange,
              })}
            </Section>
          );
        })}
      </DIV>

      {/* Barra flotante de guardado */}
      <DIV className="fixed bottom-3 right-3 z-50 flex flex-col items-end gap-2">
        {dirty && !saving && (
          <DIV className="text-xs text-amber-300 bg-amber-900/60 border border-amber-700 px-3 py-1 rounded">
            <FM id="branding.toast.unsaved" />
          </DIV>
        )}
        {saved && !dirty && (
          <DIV className="text-xs text-emerald-300 bg-emerald-900/60 border border-emerald-700 px-3 py-1 rounded">
            <FM id="branding.toast.saved" />
          </DIV>
        )}
        <BUTTON
          className="rounded px-4 py-2 bg-[#2563eb] text-white shadow-lg text-sm disabled:opacity-60"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <FM id="branding.button.saving" /> : <FM id="branding.button.save" />}
        </BUTTON>
      </DIV>
    </DIV>
  );
}

export default BrandingTab;

// ---------------------------------------------------------------------------
//  Sección wrapper (títulos vía FM si translate === true)
// ---------------------------------------------------------------------------

function Section(props: {
  sectionKey: string;
  titleId: string;
  translate?: boolean;
  descriptionId?: string;
  children: React.ReactNode;
}) {
  const { sectionKey, titleId, translate, descriptionId, children } = props;

  const titleNode =
    translate === true
      ? <FM id={titleId} defaultMessage={sectionKey} />
      : sectionKey;

  return (
    <DIV className="rounded-lg border border-neutral-800 bg-black/40 p-4 space-y-3">
      <DIV className="space-y-1">
        <H3 className="text-sm font-semibold text-white">
          {titleNode}
        </H3>
        {descriptionId && (
          <P className="text-xs text-neutral-400">
            {/* Para descripción no necesitas flag; siempre pasa por FM si hay id */}
            <FM id={descriptionId} defaultMessage={sectionKey} />
          </P>
        )}
      </DIV>
      <DIV className="space-y-3">
        {children}
      </DIV>
    </DIV>
  );
}

// ---------------------------------------------------------------------------
//  Render dinámico según schema
// ---------------------------------------------------------------------------

function renderField(args: {
  fieldKey: string;
  meta: FieldMeta;
  path: string;
  value: any;
  onChange: PathValueChange;
}): React.ReactNode {
  const { fieldKey, meta, path, value, onChange } = args;

  if (meta.kind === 'object') {
    const shape = meta.shape;
    return (
      <DIV className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(shape).map(([k, subMeta]) => (
          <React.Fragment key={k}>
            {renderField({
              fieldKey: k,
              meta: subMeta as FieldMeta,
              path: `${path}.${k}`,
              value: value ? (value as any)[k] : undefined,
              onChange,
            })}
          </React.Fragment>
        ))}
      </DIV>
    );
  }

  if (meta.kind === 'array') {
    const items: any[] = Array.isArray(value) ? value : [];

    const handleAdd = () => {
      const newItem = buildDefaultForField(meta.of);
      onChange(path, [...items, newItem]);
    };

    const handleRemove = (index: number) => {
      const next = items.slice();
      next.splice(index, 1);
      onChange(path, next);
    };

    return (
      <DIV className="space-y-2">
        <LABEL className="text-xs font-medium text-neutral-300">
          {getLabel(fieldKey, path)}
        </LABEL>

        {items.length === 0 && (
          <P className="text-xs text-neutral-500">
            <FM id="branding.array.empty" />
          </P>
        )}

        <DIV className="space-y-2">
          {items.map((item, idx) => (
            <DIV
              key={`${path}-${idx}`}
              className="border border-neutral-800 rounded-md p-3 space-y-2 bg-black/40"
            >
              <DIV className="flex items-center justify-between">
                <SPAN className="text-[11px] text-neutral-400">
                  {`#${idx + 1}`}
                </SPAN>
                <BUTTON
                  type="button"
                  className="text-[11px] px-2 py-1 rounded bg-[#7f1d1d] text-white"
                  onClick={() => handleRemove(idx)}
                >
                  <FM id="branding.array.remove" />
                </BUTTON>
              </DIV>

              {meta.of.kind === 'object' ? (
                <DIV className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(meta.of.shape).map(([k, subMeta]) => (
                    <React.Fragment key={k}>
                      {renderField({
                        fieldKey: k,
                        meta: subMeta as FieldMeta,
                        path: `${path}.${idx}.${k}`,
                        value: item ? (item as any)[k] : undefined,
                        onChange,
                      })}
                    </React.Fragment>
                  ))}
                </DIV>
              ) : (
                renderScalarField(meta.of as ScalarFieldMeta, `${path}.${idx}`, fieldKey, item, onChange)
              )}
            </DIV>
          ))}
        </DIV>

        <BUTTON
          type="button"
          className="mt-1 px-3 py-1 rounded bg-[#2563eb] text-white text-xs"
          onClick={handleAdd}
        >
          <FM id="branding.array.add" />
        </BUTTON>
      </DIV>
    );
  }

  return renderScalarField(meta as ScalarFieldMeta, path, fieldKey, value, onChange);
}

function renderScalarField(
  meta: ScalarFieldMeta,
  path: string,
  fieldKey: string,
  value: any,
  onChange: PathValueChange,
): React.ReactNode {
  // Label dinámico para campos individuales (id derivado del path)
  const segments = path.split('.');

  const lastNonNumeric =
    [...segments].reverse().find((seg) => Number.isNaN(Number(seg))) ?? fieldKey;

  const labelFallback = humanizeKey(lastNonNumeric);

  const fmBasePath = segments
    .filter((seg) => Number.isNaN(Number(seg)))
    .join('.');

  const fmId = `branding.field.${fmBasePath}`;
  const shouldTranslate = meta.translate !== false; // default: true

  const labelNode = shouldTranslate
    ? <FM id={fmId} defaultMessage={labelFallback} />
    : labelFallback;

  const id = path;
  const required = meta.required;
  const placeholder = PLACEHOLDER_BY_KIND[meta.kind];

  const baseLabel = (
    <LABEL htmlFor={id} className="text-xs font-medium text-neutral-300">
      {labelNode}{' '}
      {required && <SPAN className="text-red-400">*</SPAN>}
    </LABEL>
  );

  // Booleano → checkbox
  if (meta.kind === 'bool') {
    return (
      <DIV className="flex items-center gap-2 col-span-1">
        <input
          id={id}
          name={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(path, e.target.checked)}
        />
        {baseLabel}
      </DIV>
    );
  }

  // Textarea → ocupa 2 columnas en desktop
  if (meta.kind === 'textarea') {
    const safe =
      typeof value === 'string'
        ? value
        : value == null
        ? ''
        : typeof value === 'number'
        ? String(value)
        : '';

    return (
      <DIV className="flex flex-col gap-1 col-span-1 md:col-span-2">
        {baseLabel}
        <textarea
          id={id}
          name={id}
          placeholder={placeholder}
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100 resize-y min-h-[80px]"
          value={safe}
          onChange={(e) => onChange(path, e.target.value)}
        />
      </DIV>
    );
  }

  // Numéricos / coordenadas
  if (
    meta.kind === 'number' ||
    meta.kind === 'lat' ||
    meta.kind === 'lng' ||
    meta.kind === 'zoom' ||
    meta.kind === 'angle'
  ) {
    const { min, max } = meta;

    const numericValue =
      typeof value === 'number'
        ? value
        : value == null
        ? ''
        : typeof value === 'string'
        ? value
        : '';

    return (
      <DIV className="flex flex-col gap-1 col-span-1">
        {baseLabel}
        <INPUT
          id={id}
          name={id}
          type="number"
          placeholder={placeholder}
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
          value={numericValue}
          min={min !== undefined ? min : undefined}
          max={max !== undefined ? max : undefined}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            if (raw === '') {
              onChange(path, undefined);
              return;
            }
            let num = Number(raw);
            if (!Number.isFinite(num)) return;

            if (min !== undefined && num < min) num = min;
            if (max !== undefined && num > max) num = max;

            onChange(path, num);
          }}
        />
      </DIV>
    );
  }

  // Strings genéricos (string, url, email, phone)
  let inputType: React.HTMLInputTypeAttribute = 'text';
  if (meta.kind === 'email') inputType = 'email';
  if (meta.kind === 'url') inputType = 'url';
  if (meta.kind === 'phone') inputType = 'tel';

  const safe =
    typeof value === 'string'
      ? value
      : value == null
      ? ''
      : typeof value === 'number'
      ? String(value)
      : '';

  return (
    <DIV className="flex flex-col gap-1 col-span-1">
      {baseLabel}
      <INPUT
        id={id}
        name={id}
        type={inputType}
        placeholder={placeholder}
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
        value={safe}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(path, e.target.value)
        }
      />
    </DIV>
  );
}

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function getLabel(fieldKey: string, path: string): string {
  const segments = path.split('.');
  const last = segments[segments.length - 1] || fieldKey;
  return humanizeKey(last);
}

function buildDefaultsFromSchema(shape: FieldShape): any {
  const out: any = {};
  for (const [key, meta] of Object.entries(shape)) {
    out[key] = buildDefaultForField(meta as FieldMeta);
  }
  return out;
}

function buildDefaultForField(meta: FieldMeta): any {
  if (meta.kind === 'object') {
    return buildDefaultsFromSchema(meta.shape);
  }
  if (meta.kind === 'array') {
    return [];
  }

  switch (meta.kind) {
    case 'string':
    case 'textarea':
    case 'url':
    case 'email':
    case 'phone':
      return '';
    case 'bool':
      return false;
    case 'number':
    case 'lat':
    case 'lng':
    case 'zoom':
    case 'angle':
      return undefined;
    default:
      return '';
  }
}

function setValueAtPath(root: any, path: string, value: any): any {
  if (!root) return root;

  const cloned = JSON.parse(JSON.stringify(root));
  const segments = path.split('.');
  let curr: any = cloned;

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const idx = Number(seg);
    const isIndex = !Number.isNaN(idx) && seg === String(idx);

    if (isIndex && Array.isArray(curr)) {
      curr = curr[idx];
    } else {
      curr = curr[seg];
    }
    if (curr === undefined) {
      return cloned;
    }
  }

  const last = segments[segments.length - 1];
  const lastIdx = Number(last);
  const isLastIndex = !Number.isNaN(lastIdx) && last === String(lastIdx);

  if (isLastIndex && Array.isArray(curr)) {
    curr[lastIdx] = value;
  } else {
    curr[last] = value;
  }

  return cloned;
}
