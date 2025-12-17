"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  loadSupportedLocales,
  loadMetaGlobal, loadMetaSite, loadMetaPage,
  saveMetaGlobal,  saveMetaSite,  saveMetaPage,
  deleteMetaGlobalFields, deleteMetaSiteFields, deleteMetaPageFields,
  loadMetaOrder, saveMetaOrder,
  type MetaRecord
} from "@/app/lib/i18n/store";
import FM from "../i18n/FM";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import AdminGuard from "./AdminGuard";
import { CapGuard } from "@/complements/admin/CapGuard";

const RECOMMENDED_FIELDS = [
  "title","description","canonical","robots",
  "og:title","og:description","og:image","og:type",
  "twitter:card","twitter:title","twitter:description","twitter:image",
];

type Scope = "global" | "site" | "page";
type Status = "green" | "yellow" | "red";

// Límites y validaciones suaves
const LIMITS: Record<string, number> = { title: 60, description: 160 };
const URL_FIELDS = new Set(["canonical","og:image","twitter:image"]);
const CARD_ENUM = new Set(["summary","summary_large_image"]);

function softValidate(field: string, val: string) {
  const v = (val ?? "").trim();
  const warns: string[] = [];
  if (field in LIMITS && v.length > LIMITS[field]) {
    warns.push(`Sugerencia: ${field} > ${LIMITS[field]} caracteres (${v.length}).`);
  }
  if (URL_FIELDS.has(field) && v && !/^https?:\/\//i.test(v)) {
    warns.push(`Sugerencia: ${field} debería ser URL absoluta (http/https).`);
  }
  if (field === "twitter:card" && v && !CARD_ENUM.has(v as any)) {
    warns.push(`Sugerencia: twitter:card suele ser "summary" o "summary_large_image".`);
  }
  return warns;
}

function statusIcon(s: Status) {
  if (s === "green") return "-";
  if (s === "yellow") return "-";
  return "-";
}

export default function MetaTab() {
  const [scope, setScope] = useState<Scope>("global");
  const [routeKey, setRouteKey] = useState<string>("home");
  const [locales, setLocales] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>(RECOMMENDED_FIELDS);
  const [data, setData] = useState<Record<string, MetaRecord>>({});
  const [filter, setFilter] = useState<"all"|"green"|"yellow"|"red">("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const lst = await loadSupportedLocales();
      setLocales(lst);
    })();
  }, []);

  // Estado de celda: rojo (vacío), amarillo (con warnings), verde (ok)
  function cellStatus(field: string, val?: string | null): Status {
    const v = (val ?? "").trim();
    if (v === "") return "red";
    const warns = softValidate(field, v);
    if (warns.length > 0) return "yellow";
    return "green";
  }

  // Estado de fila: peor estado entre sus celdas
  function rowStatus(field: string): Status {
    let worst: Status = "green";
    for (const loc of locales) {
      const s = cellStatus(field, data[loc]?.[field]);
      if (s === "red") return "red";
      if (s === "yellow") worst = "yellow";
    }
    return worst;
  }

  const filteredFields = useMemo(() => {
    if (filter === "all") return fields;
    return fields.filter((f) => rowStatus(f) === filter);
  }, [fields, filter, data, locales]);

  async function loadFromFirestore() {
    setLoading(true);
    try {
      const out: Record<string, MetaRecord> = {};
      for (const loc of locales) {
        let rec: MetaRecord = {};
        if (scope === "global") rec = await loadMetaGlobal(loc);
        if (scope === "site")   rec = await loadMetaSite(loc);
        if (scope === "page")   rec = await loadMetaPage(routeKey, loc);
        out[loc] = rec || {};
      }
      setData(out);

      // Extiende columnas con cualquier clave encontrada
      const keySet = new Set<string>(RECOMMENDED_FIELDS);
      for (const loc of locales) Object.keys(out[loc] || {}).forEach((k) => keySet.add(k));
      setFields(Array.from(keySet));
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    setLoading(true);
    try {
      for (const loc of locales) {
        const rec = data[loc] || {};
        if (scope === "global") await saveMetaGlobal(loc, rec);
        if (scope === "site")   await saveMetaSite(loc, rec);
        if (scope === "page")   await saveMetaPage(routeKey, loc, rec);
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteRow(field: string) {
    setLoading(true);
    try {
      for (const loc of locales) {
        if (scope === "global") await deleteMetaGlobalFields(loc, [field]);
        if (scope === "site")   await deleteMetaSiteFields(loc, [field]);
        if (scope === "page")   await deleteMetaPageFields(routeKey, loc, [field]);
      }
      const next = { ...data };
      for (const loc of locales) if (next[loc]) delete next[loc][field];
      setData(next);
      setFields((arr) => arr.filter((f) => f !== field));
    } finally {
      setLoading(false);
    }
  }

  function addFieldsFromTextarea(text: string) {
    const newOnes = text.split(/\r?\n|,|;/).map(s => s.trim()).filter(Boolean);
    const set = new Set([...fields, ...newOnes]);
    setFields(Array.from(set));
  }

  async function importJSON(file: File) {
    const text = await file.text();
    const payload = JSON.parse(text);
    setLoading(true);
    try {
      if (scope === "page" && typeof payload === "object" && !Array.isArray(payload) &&
          Object.values(payload).some(v => typeof v === "object" && !Array.isArray(v))) {
        for (const [rk, perLocale] of Object.entries<any>(payload)) {
          for (const loc of Object.keys(perLocale)) {
            await saveMetaPage(rk, loc, perLocale[loc] || {});
          }
        }
      } else {
        if (payload && !payload.es && !payload.en && !payload.fr) {
          for (const loc of locales) {
            if (scope === "global") await saveMetaGlobal(loc, payload);
            if (scope === "site")   await saveMetaSite(loc, payload);
            if (scope === "page")   await saveMetaPage(routeKey, loc, payload);
          }
        } else {
          for (const loc of Object.keys(payload)) {
            const rec = payload[loc] || {};
            if (scope === "global") await saveMetaGlobal(loc, rec);
            if (scope === "site")   await saveMetaSite(loc, rec);
            if (scope === "page")   await saveMetaPage(routeKey, loc, rec);
          }
        }
      }
      await loadFromFirestore();
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <CapGuard
      cap="CampaignsCenter"
      fallback={<DIV style={{ padding: 16 }}>No tienes contratado CampaignsCenter.</DIV>}
      loadingFallback={<DIV style={{ padding: 16 }}>Cargando licencias…</DIV>}
    >
      <AdminGuard>
        <div className="admin-tab meta-tab space-y-4">
          <header className="flex flex-wrap items-center gap-2">
            <SPAN className="text-lg font-semibold"><FM id="metaTab.title" defaultMessage="Metadatos"/></SPAN>

            <SELECT
              className="select text-black"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
            >
              <option value="global"><FM id="metaTab.scope.global" defaultMessage="Global"/></option>
              <option value="site"><FM id="metaTab.scope.site" defaultMessage="Site"/></option>
              <option value="page"><FM id="metaTab.scope.page" defaultMessage="Página"/></option>
            </SELECT>

            {scope === "page" && (
              <INPUT
                className="input placeholder:text-slate-400"
                placeholder="routeKey (p.ej. home, about, blog)"
                value={routeKey}
                onChange={(e) => setRouteKey(e.target.value)}
              />
            )}

            <LABEL className="btn border border-solid border-white rounded-md p-1 hover:text-black hover:bg-white">
              <FM id="metaTab.importJSON" defaultMessage="Importar JSON"/>
              <INPUT
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])}
              />
            </LABEL>

            <SELECT
              className="select text-black border border-solid border-white rounded-md p-1 hover:text-black hover:bg-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all"><FM id="metaTab.filter.all" defaultMessage="Todos"/></option>
              <option value="green"><FM id="metaTab.filter.complete" defaultMessage="✓ Completos"/></option>
              <option value="yellow"><FM id="metaTab.filter.warning" defaultMessage="! Avisos"/></option>
              <option value="red"><FM id="metaTab.filter.incomplete" defaultMessage="✗ Vacíos"/></option>
            </SELECT>

            <SPAN className="ml-auto flex items-center gap-3 text-sm">
              <SPAN className="inline-flex items-center gap-1"><SPAN className="badge status-green text-green-500  bg-green-500 rounded-lg">-</SPAN> OK</SPAN>
              <SPAN className="inline-flex items-center gap-1"><SPAN className="badge status-yellow text-yellow-500  bg-yellow-500 rounded-lg">-</SPAN> Avisos</SPAN>
              <SPAN className="inline-flex items-center gap-1"><SPAN className="badge status-red text-red-500  bg-red-500 rounded-lg">-</SPAN> Falta</SPAN>
            </SPAN>
          </header>

          <section className="flex items-start gap-4">
            <div className="card grow">
              <div className="overflow-auto">
                <table className="admin-table w-full">
                  <thead>
                    <tr>
                      <th className="w-[260px]"><FM id="metaTab.field" defaultMessage="Campo"/></th>
                      {locales.map((loc) => (<th key={loc}>{loc}</th>))}
                      <th className="w-20 text-center"><FM id="metaTab.status" defaultMessage="Estado"/></th>
                      <th className="w-16 text-center"><FM id="metaTab.actions" defaultMessage="Acciones"/></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFields.map((field) => {
                      const rStatus = rowStatus(field);
                      const rowClass =
                        rStatus === "red" ? "row-status-red" :
                        rStatus === "yellow" ? "row-status-yellow" :
                        "row-status-green";

                      return (
                        <tr key={field} className={rowClass}>
                          <td className="font-mono align-top">
                            <div className="flex items-center gap-2">
                              <SPAN className={`badge status-${rStatus} ${rStatus === "red" ? "text-red-500 bg-red-500 rounded-lg" : rStatus === "green" ? "text-green-500  bg-green-500 rounded-lg" : "text-yellow-500  bg-yellow-500 rounded-lg"}`}>{statusIcon(rStatus)}</SPAN>
                              {field}
                            </div>
                          </td>

                          {locales.map((loc) => {
                            const val = (data[loc]?.[field] ?? "") as string;
                            const warns = softValidate(field, val);
                            const cStatus = cellStatus(field, val);
                            return (
                              <td key={loc} className="align-top">
                                <div className="flex items-start gap-2">
                                  <SPAN className={`badge status-${cStatus} mt-2 ${cStatus === "red" ? "text-red-500 bg-red-500 rounded-lg" : cStatus === "green" ? "text-green-500  bg-green-500 rounded-lg" : "text-yellow-500  bg-yellow-500 rounded-lg"}`}>{statusIcon(cStatus)}</SPAN>
                                  <textarea
                                    className={`input w-full min-h-[40px] cell-status-${cStatus} placeholder:text-slate-400 text-black`}
                                    placeholder={field}
                                    value={val}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setData((prev) => ({
                                        ...prev,
                                        [loc]: { ...(prev[loc] || {}), [field]: v }
                                      }));
                                    }}
                                  />
                                </div>
                                {warns.length > 0 && (
                                  <div className="text-xs text-amber-500 mt-1 space-y-0.5">
                                    {warns.map((w, i) => <div key={i}>• {w}</div>)}
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          <td className="text-center align-top">
                            <SPAN className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold
                              ${rStatus === "green" ? "text-green-500  bg-green-500 rounded-lg" :
                                rStatus === "yellow" ? "text-yellow-500  bg-yellow-500 rounded-lg" :
                                "text-red-500 bg-red-500 rounded-lg"}
                                `}>
                              {statusIcon(rStatus)}
                            </SPAN>
                          </td>

                          <td className="text-center align-top">
                            <BUTTON
                              className="icon-btn"
                              title="Borrar campo en todos los locales"
                              onClick={() => deleteRow(field)}
                            >
                              🗑
                            </BUTTON>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="card w-[320px] p-3 space-y-3">
              <div className="text-sm font-semibold"><FM id="metaTab.addFields" defaultMessage="Añadir campos (pegado múltiple)"/></div>
              <textarea
                className="input w-full min-h-[90px] placeholder:text-slate-400"
                placeholder="title, description, og:image, ..."
                onBlur={(e) => e.target.value && addFieldsFromTextarea(e.target.value)}
              />
              <div className="text-xs text-muted">
                <FM id="metaTab.addFieldsAdvice" defaultMessage="Consejo: separa por coma, punto y coma o saltos de línea. Se agregan sin duplicar."/>
              </div>

              <div className="divider" />
              <div className="text-sm font-semibold"><FM id="metaTab.rowOrder" defaultMessage="Orden de filas"/></div>
              <BUTTON
                className="btn btn-light border border-solid border-white m-2 rounded-md p-2 hover:text-black hover:bg-white"
                onClick={async () => { await saveMetaOrder(fields); }}
              >
                <FM id="metaTab.saveOrder" defaultMessage="Guardar orden"/>
              </BUTTON>
              <BUTTON
                className="btn btn-light border border-solid border-white m-2 rounded-md p-2 hover:text-black hover:bg-white"
                onClick={async () => {
                  const order = await loadMetaOrder();
                  if (order.length) {
                    const set = new Set(order);
                    const merged = [...order, ...fields.filter(f => !set.has(f))];
                    setFields(merged);
                  }
                }}
              >
                <FM id="metaTab.loadOrder" defaultMessage="Cargar orden"/>
              </BUTTON>
            </aside>
          </section>
          <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <BUTTON
        className="btn btn-primary border border-solid border-white rounded-md p-2 hover:text-black hover:bg-white"
        onClick={saveAll}
        disabled={loading}
        title="Guardar metadatos en Firestore"
      >
        {loading ? "Guardando..." : "Guardar"}
      </BUTTON>

      <BUTTON
        className="btn btn-secondary border border-solid border-white rounded-md p-2 hover:text-black hover:bg-white"
        onClick={loadFromFirestore}
        disabled={loading}
        title="Recargar (seeds + Firestore)"
      >
        {loading ? "Cargando..." : "Cargar (seeds + Firestore)"}
      </BUTTON>
    </div>
        </div>
      </AdminGuard>
    </CapGuard>    
  );
}
