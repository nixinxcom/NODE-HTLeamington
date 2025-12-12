'use client';

import React, { useState } from 'react';
import { FbDB } from '@/app/lib/services/firebase';
import {
  collection, getDocs, query, where, orderBy, limit
} from 'firebase/firestore';
import TableComp from '@/complements/components/TableComp/TableComp';
import styles from './StylesQueries.module.css';
import { JsonLdClient as JsonLd } from '@/complements/components/Seo/JsonLdClient';
import { buildVenueSchema, buildWebSiteSchema } from '@/app/lib/seo/schema';
import FM from '@/complements/i18n/FM';
import {
  BUTTON,
  LINK,
  BUTTON2,
  LINK2,
  NEXTIMAGE,
  IMAGE,
  DIV,
  DIV2,
  DIV3,
  INPUT,
  SELECT,
  LABEL,
  INPUT2,
  SPAN,
  SPAN1,
  SPAN2,
  A,
  B,
  P,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
} from "@/complements/components/ui/wrappers";
import { useRouter } from "next/navigation";

type FieldKind = 'timestamp' | 'number' | 'unknown';

const CANDIDATES = [
  'ts',
  'fecha',
  'Fecha',
  'date',
  'createdAt',
  'created_at',
  'startAt',
  'start_at',
  'startDate',
  'updatedAt',
  '_updatedAt', // agregado
];

// yyyymmdd -> Date UTC 00:00
function yyyymmddToDate(s: string): Date | null {
  if (!/^\d{8}$/.test(s)) return null;
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6)) - 1;
  const d = Number(s.slice(6, 8));
  return new Date(Date.UTC(y, m, d, 0, 0, 0));
}

// Acepta 20250101 o 2025-01-01 o ISO
function parseInputDate(s: string): Date | null {
  if (!s) return null;
  const byNum = yyyymmddToDate(s);
  if (byNum) return byNum;
  const dt = new Date(s);
  return isNaN(+dt) ? null : dt;
}

// Detecta un campo tipo fecha (Timestamp o número yyyymmdd)
async function detectDateField(col: string): Promise<{ field: string | null; kind: FieldKind }> {
  try {
    const snap = await getDocs(query(collection(FbDB, col), limit(1)));
    if (snap.empty) return { field: null, kind: 'unknown' };
    const doc = snap.docs[0].data() as any;
    for (const key of CANDIDATES) {
      if (!(key in doc)) continue;
      const v = doc[key];
      // Timestamp
      // @ts-ignore
      if (v && typeof v === 'object' && typeof v?.toDate === 'function') {
        return { field: key, kind: 'timestamp' };
      }
      if (typeof v === 'number') {
        return { field: key, kind: 'number' };
      }
    }
    return { field: null, kind: 'unknown' };
  } catch {
    return { field: null, kind: 'unknown' };
  }
}

// Aplana objetos para la tabla
function flattenObject(data: any, parentKey = '', result: any = {}): any {
  for (const key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const value = data[key];
    const newKey = parentKey ? `${parentKey}.${key}` : key;

    // Timestamp
    // @ts-ignore
    if (value && typeof value === 'object' && typeof value?.toDate === 'function') {
      result[newKey] = value.toDate().toISOString();
      continue;
    }
    // GeoPoint
    if (value && value.latitude !== undefined && value.longitude !== undefined) {
      result[newKey] = `${value.latitude},${value.longitude}`;
      continue;
    }
    // DocumentReference
    if (value && value.path && value.id && value.parent) {
      result[newKey] = value.path;
      continue;
    }

    if (value === null || value === undefined) {
      result[newKey] = '';
      continue;
    }

    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      result[newKey] = value;
    } else if (Array.isArray(value)) {
      try {
        result[newKey] = JSON.stringify(value);
      } catch {
        result[newKey] = String(value);
      }
    } else if (t === 'object') {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = String(value);
    }
  }
  return result;
}

// Acceso seguro por path "a.b.c"
function getByPath(obj: any, path: string): any {
  if (!path) return obj;
  const parts = path.split('.').map((p) => p.trim()).filter(Boolean);
  let cur: any = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

export default function CloudQueriesPage() {
  const router = useRouter();
  const [coleccion, setColeccion] = useState('');
  const [start, setStart] = useState(''); // opcional
  const [end, setEnd] = useState('');     // opcional
  const [arrayField, setArrayField] = useState(''); // NUEVO: campo arreglo a expandir
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ field?: string | null; kind?: FieldKind }>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function consultar() {
    try {
      setErr(null);
      setLoading(true);
      setData([]);
      setMeta({});

      const col = coleccion.trim();
      if (!col) {
        setErr('Indica una colección.');
        return;
      }

      const { field, kind } = await detectDateField(col);
      setMeta({ field, kind });

      const cons: any[] = [];
      const startDate = parseInputDate(start);
      const endDate = parseInputDate(end);

      if (startDate || endDate) {
        if (!field || kind === 'unknown') {
          setErr('No encontré un campo de fecha en la colección.');
          return;
        }
        if (kind === 'timestamp') {
          if (startDate) cons.push(where(field, '>=', startDate));
          if (endDate) cons.push(where(field, '<=', endDate));
          cons.push(orderBy(field, 'desc'));
        } else if (kind === 'number') {
          // Convierte fechas a yyyymmdd numérico para comparar
          const toNum = (d: Date) =>
            Number(
              `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
                d.getUTCDate(),
              ).padStart(2, '0')}`,
            );
          if (startDate) cons.push(where(field, '>=', toNum(startDate)));
          if (endDate) cons.push(where(field, '<=', toNum(endDate)));
          cons.push(orderBy(field, 'desc'));
        }
      } else {
        // Sin rango: intenta ordenar por campo fecha si existe
        if (field) cons.push(orderBy(field, 'desc'));
      }

      cons.push(limit(500)); // tope amigable
      const q = query(collection(FbDB, col), ...cons);
      const snap = await getDocs(q);

      const rowsFlattened: any[] = [];
      const arrayPath = arrayField.trim();

      snap.forEach((d) => {
        const raw = d.data() as any;
        const baseMeta = { id: d.id, _path: d.ref.path };

        // Si se indicó un campo de arreglo (ej: "audiences")
        if (arrayPath) {
          const arr = getByPath(raw, arrayPath);
          if (Array.isArray(arr)) {
            arr.forEach((item, idx) => {
              rowsFlattened.push(
                flattenObject({
                  ...baseMeta,
                  _arrayField: arrayPath,
                  _index: idx,
                  ...item,
                }),
              );
            });
            return; // ya agregamos filas por cada elemento del array
          }
        }

        // Comportamiento normal: una fila por doc
        rowsFlattened.push(flattenObject({ ...baseMeta, ...raw }));
      });

      // ─────────────────────────────────────────────
      // Normalizar columnas: unión de todas las keys
      // ─────────────────────────────────────────────
      if (!rowsFlattened.length) {
        setData([]);
        return;
      }

      const keySet = new Set<string>();
      for (const row of rowsFlattened) {
        Object.keys(row).forEach((k) => keySet.add(k));
      }

      const preferredOrder = ['id', '_path', '_updatedAt', '_arrayField', '_index'];
      const restKeys = Array.from(keySet).filter((k) => !preferredOrder.includes(k)).sort();

      const allKeys = [
        ...preferredOrder.filter((k) => keySet.has(k)),
        ...restKeys,
      ];

      const normalizedRows = rowsFlattened.map((row) => {
        const out: Record<string, any> = {};
        for (const k of allKeys) {
          out[k] = row[k] ?? '';
        }
        return out;
      });

      setData(normalizedRows);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Error al consultar.');
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(coleccion || 'export')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportJSON = () => {
    if (!data.length) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(coleccion || 'export')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      {/* Botones de navegación superior */}
      <DIV className="flex justify-between items-center mb-2">
        <DIV className="flex gap-2">
          <BUTTON
            type="button"
            onClick={() => router.push("../admin")}
          >
            Admin Panel
          </BUTTON>
          <BUTTON
            type="button"
            onClick={() => router.push("../../")}
          >
            Home
          </BUTTON>
        </DIV>
      </DIV>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />

      <div className={styles.Contenedor}>
        <div className={styles.cqForm}>
          <div className={styles.cqGroup}>
            <LABEL className={styles.Label}>
              <FM id="cloudq.collection" defaultMessage="Colección Firestore" />
              <INPUT
                type="text"
                value={coleccion}
                onChange={(e) => setColeccion(e.target.value)}
                placeholder="events / surveys / encuesta / leads / Providers / ..."
              />
            </LABEL>
          </div>

          <div className={styles.cqGroup}>
            <LABEL className={styles.Label}>
              <FM
                id="cloudq.arrayField"
                defaultMessage="Campo de arreglo a expandir (opcional)"
              />
              <INPUT
                type="text"
                value={arrayField}
                onChange={(e) => setArrayField(e.target.value)}
                placeholder="audiences / notifications / items / ..."
              />
            </LABEL>
          </div>

          <div className={styles.cqGroupRow}>
            <LABEL className={styles.Label}>
              <FM id="cloudq.from" defaultMessage="Desde (opcional)" />
              <INPUT
                type="text"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="20250101 o 2025-01-01"
              />
            </LABEL>
            <LABEL className={styles.Label}>
              <FM id="cloudq.to" defaultMessage="Hasta (opcional)" />
              <INPUT
                type="text"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                placeholder="20251231 o 2025-12-31"
              />
            </LABEL>
          </div>

          <div className={styles.cqActions}>
            <BUTTON
              className={styles.Consultar}
              onClick={consultar}
              disabled={loading || !coleccion.trim()}
            >
              <FM id="cloudq.query" defaultMessage="Consultar" />
            </BUTTON>
            {data.length > 0 && (
              <>
                <BUTTON className={styles.Consultar} onClick={exportCSV}>
                  CSV
                </BUTTON>
                <BUTTON className={styles.Consultar} onClick={exportJSON}>
                  JSON
                </BUTTON>
              </>
            )}
          </div>

          {loading && (
            <div className={styles.cqInfo}>
              <FM id="cloudq.loading" defaultMessage="Cargando…" />
            </div>
          )}
          {err && <div className={styles.cqError}>{err}</div>}
          {meta.field && (
            <div className={styles.cqInfo}>
              <FM
                id="cloudq.usingField"
                defaultMessage="Usando campo de fecha:"
              />{' '}
              <B>{meta.field}</B> ({meta.kind})
            </div>
          )}
        </div>

        {data.length > 0 && <TableComp data={data} />}
      </div>
    </>
  );
}
