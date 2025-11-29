"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  loadSupportedLocales,
  loadFMsGlobal,
  saveFMsGlobal,
  deleteFMsGlobalFields,
} from "@/app/lib/i18n/store";
import FM from "../i18n/FM";
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
  SELECT2,
  LABEL2,
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

/* Wrappers defensivos */
const delGlobal =
  (deleteFMsGlobalFields ??
    (async () => {})) as typeof deleteFMsGlobalFields;

/* Clave fija solo para el invalidate event */
const GLOBAL_ROUTE_KEY = "__global__";

/* ===== Estilos DARK-first (drop-in) ===== */
const ring =
  "focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:ring-offset-0";

const surface =
  "rounded-xl border p-4 " +
  "bg-neutral-900 text-neutral-100 border-neutral-700 " +
  "dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 " +
  "bg-white text-neutral-900 border-neutral-200";

const inputBase =
  "w-full rounded-md border px-3 py-2 text-sm " +
  "bg-neutral-800 text-neutral-100 placeholder:text-neutral-400 border-neutral-700 " +
  "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:border-neutral-700 " +
  "bg-white text-neutral-900 placeholder:text-neutral-400 border-neutral-300 " +
  ring;

const btnBase =
  "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition " +
  "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border-neutral-700 " +
  "dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:border-neutral-700 " +
  "bg-white text-neutral-900 hover:bg-neutral-50 border-neutral-300 " +
  ring;

const btnPrimary =
  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm " +
  "bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-60 " +
  "dark:bg-indigo-500 dark:hover:bg-indigo-400 " +
  ring;

const pill =
  "px-2.5 py-1 rounded-full border text-sm transition " +
  "data-[active=true]:bg-indigo-600 data-[active=true]:text-white data-[active=true]:border-indigo-600 " +
  "bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100 " +
  "dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700 " +
  "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-900";

const label =
  "text-[11px] uppercase tracking-wide text-neutral-400 dark:text-neutral-400";

const h6 = "text-base font-semibold text-neutral-100 dark:text-neutral-100";

/* ===== Helpers visuales (semáforo) ===== */
type Traffic = "red" | "yellow" | "green";

function Badge({ s, size = 12 }: { s: Traffic; size?: number }) {
  const bg =
    s === "red"
      ? "#ef4444"
      : s === "yellow"
      ? "#f59e0b"
      : "#10b981";
  return (
    <SPAN
      className="inline-block rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: bg }}
    />
  );
}

/* ===== Tipos ===== */
type Row = { id: string; values: Record<string, string | null> };

/* ===== Estado de celda/fila (semáforo) ===== */
function statusFor(id: string, v: string | null | undefined): Traffic {
  if (v == null) return "red";
  const t = String(v).trim();
  if (!t) return "red";
  if (t === id) return "red";
  return "green";
}

function rowStatusFor(
  locales: string[],
  id: string,
  committed: Record<string, Record<string, string | null>>
): Traffic {
  let anyGreen = false,
    anyRed = false;
  for (const loc of locales) {
    const st = statusFor(id, committed[id]?.[loc]);
    if (st === "red") anyRed = true;
    else anyGreen = true;
  }
  if (anyRed && anyGreen) return "yellow";
  return anyRed ? "red" : "green";
}

export default function FMsTab() {
  const { locale: urlLocale } = useParams<{ locale: string }>();

  /* Estado principal (solo GLOBAL) */
  const [locales, setLocales] = useState<string[]>([urlLocale || "es"]);
  const [activeLocales, setActiveLocales] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");
  const [colorFilter, setColorFilter] = useState<"all" | Traffic>("all");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [inlineStatus, setInlineStatus] = useState("");

  const [data, setData] = useState<
    Record<string, Record<string, string | null>>
  >({});
  const [committed, setCommitted] = useState<
    Record<string, Record<string, string | null>>
  >({});
  const [order, setOrder] = useState<string[]>([]);
  const [newKey, setNewKey] = useState("");
  const [bulkIds, setBulkIds] = useState("");

  /* Locales soportados */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supported = await loadSupportedLocales();
      if (!mounted) return;
      setLocales(supported);
      setActiveLocales(supported);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------- CARGA GLOBAL ----------- */
  const doLoadGlobal = useCallback(
    async (): Promise<Record<string, Record<string, string | null>>> => {
      const matrix: Record<string, Record<string, string | null>> = {};
      for (const loc of activeLocales) {
        const pack = await loadFMsGlobal(loc);
        for (const k of Object.keys(pack)) {
          matrix[k] = matrix[k] || {};
          matrix[k][loc] = pack[k];
        }
      }
      // Rellena faltantes con null
      for (const k of Object.keys(matrix)) {
        for (const loc of activeLocales) {
          if (!(loc in matrix[k])) matrix[k][loc] = null;
        }
      }
      return matrix;
    },
    [activeLocales]
  );

  const reloadData = useCallback(async () => {
    if (!activeLocales.length) return;
    setLoading(true);
    setStatus("Cargando…");

    const matrix = await doLoadGlobal();

    // Orden puramente de UI: alfabético por ID
    const keys = Object.keys(matrix).sort((a, b) =>
      a.localeCompare(b)
    );
    setOrder(keys);

    setData(matrix);
    setCommitted(matrix);

    setLoading(false);
    setStatus("");
  }, [activeLocales, doLoadGlobal]);

  useEffect(() => {
    void reloadData();
  }, [reloadData]);

  /* Derivados */
  const sortedKeys = useMemo(() => {
    const keys = Object.keys(data).filter((k) =>
      !search ? true : k.toLowerCase().includes(search.toLowerCase())
    );
    const pos = new Map(order.map((id, i) => [id, i]));
    return [...keys].sort((a, b) => {
      const ia = pos.has(a) ? (pos.get(a) as number) : Number.MAX_SAFE_INTEGER;
      const ib = pos.has(b) ? (pos.get(b) as number) : Number.MAX_SAFE_INTEGER;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b);
    });
  }, [data, order, search]);

  const rows: Row[] = useMemo(
    () => sortedKeys.map((id) => ({ id, values: data[id] || {} })),
    [sortedKeys, data]
  );

  const filteredRows = useMemo(() => {
    if (colorFilter === "all") return rows;
    return rows.filter(
      (r) => rowStatusFor(activeLocales, r.id, committed) === colorFilter
    );
  }, [rows, colorFilter, activeLocales, committed]);

  const counts = useMemo(() => {
    let red = 0,
      yellow = 0,
      green = 0;
    for (const r of rows) {
      for (const loc of activeLocales) {
        const st = statusFor(r.id, committed[r.id]?.[loc]);
        if (st === "red") red++;
        else green++;
      }
      const rowSt = rowStatusFor(activeLocales, r.id, committed);
      if (rowSt === "yellow") yellow++;
    }
    return { red, yellow, green, total: rows.length * activeLocales.length };
  }, [rows, activeLocales, committed]);

  /* Edición */
  const setCell = (id: string, locale: string, val: string) => {
    setData((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [locale]: val },
    }));
  };
  const confirmCell = (id: string, locale: string) => {
    setCommitted((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [locale]: data[id]?.[locale] ?? "",
      },
    }));
  };

  const addKey = (id: string) => {
    const k = id.trim();
    if (!k) return;
    setData((prev) => {
      if (prev[k]) return prev;
      const row: Record<string, string | null> = {};
      for (const loc of activeLocales) row[loc] = k;
      setOrder((o) => [...o, k]); // se agrega al final de la lista
      setCommitted((prevC) => ({ ...prevC, [k]: { ...row } }));
      return { ...prev, [k]: row };
    });
  };

  const importIds = () => {
    const ids = bulkIds
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const id of ids) addKey(id);
    setBulkIds("");
  };

  const saveAll = async () => {
    setLoading(true);
    setStatus("Guardando…");

    const partialByLocale: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      for (const loc of activeLocales) {
        const v = r.values[loc];
        if (v != null) (partialByLocale[loc] ||= {})[r.id] = v;
      }
    }

    for (const loc of Object.keys(partialByLocale)) {
      await saveFMsGlobal(loc, partialByLocale[loc]);
    }

    setStatus("✓ Guardado");
    setLoading(false);

    try {
      window.dispatchEvent(
        new CustomEvent("i18n:invalidate", {
          detail: {
            locales: Object.keys(partialByLocale),
            routeKey: GLOBAL_ROUTE_KEY,
          },
        })
      );
    } catch {}

    setTimeout(() => setStatus(""), 1200);
  };

  // Elimina solo en GLOBAL
  async function deleteIdHere(id: string) {
    setLoading(true);
    setStatus("Eliminando…");

    const ids = [id];

    try {
      for (const loc of activeLocales) {
        await delGlobal(loc, ids);
      }
    } catch (err) {
      console.warn("Error al eliminar:", err);
    }

    setData((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setCommitted((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setOrder((prev) => prev.filter((x) => x !== id));

    setStatus("✓ Eliminado");
    setLoading(false);
    setTimeout(() => setStatus(""), 900);
  }

  /* Import JSON (archivo) — TODO va a GLOBAL */
  async function handleJsonImport(files: FileList | null) {
    if (!files || files.length === 0) return;
    setLoading(true);
    setStatus("Procesando JSON…");
    setInlineStatus("Procesando JSON…");

    const perLocaleGlobal: Record<string, Record<string, string>> = {};

    const inferLocale = (name: string) => {
      const m = name.toLowerCase().match(/(es|en|fr)([-_][a-z]{2})?\.json$/);
      return m ? m[1] : null;
    };

    for (const f of Array.from(files)) {
      const loc = inferLocale(f.name);
      if (!loc) continue;
      const text = await f.text();
      let json: Record<string, string> = {};
      try {
        json = JSON.parse(text);
      } catch {
        console.warn("JSON inválido:", f.name);
        continue;
      }
      perLocaleGlobal[loc] = { ...(perLocaleGlobal[loc] || {}), ...json };
    }

    setStatus("Importando en Firestore…");
    setInlineStatus("Importando en Firestore…");

    for (const [loc, pack] of Object.entries(perLocaleGlobal)) {
      if (Object.keys(pack).length) await saveFMsGlobal(loc, pack);
    }

    await reloadData();

    setStatus("✓ Importación completa");
    setInlineStatus("✓ Importación completa");
    setLoading(false);

    const fi = document.getElementById(
      "i18n-json-file"
    ) as HTMLInputElement | null;
    if (fi) fi.value = "";

    try {
      window.dispatchEvent(
        new CustomEvent("i18n:invalidate", {
          detail: {
            locales: Object.keys(perLocaleGlobal),
            routeKey: GLOBAL_ROUTE_KEY,
          },
        })
      );
    } catch {}

    setTimeout(() => {
      setInlineStatus("");
      setStatus("");
    }, 1800);
  }

  /* ============================== UI ============================== */
  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-neutral-100/20 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-3 py-2 flex flex-wrap items-center gap-3">
          <div className="text-sm flex items-center gap-2">
            <Badge s="red" />{" "}
            <SPAN>
              <FM id="metaTab.filter.red" defaultMessage="id = valor" />
            </SPAN>
            <Badge s="yellow" />{" "}
            <SPAN>
              <FM
                id="metaTab.filter.yellow"
                defaultMessage="vacío / incompleto"
              />
            </SPAN>
            <Badge s="green" />{" "}
            <SPAN>
              <FM id="metaTab.filter.green" defaultMessage="ok" />
            </SPAN>
          </div>
          <div className="text-sm opacity-80">
            {loading
              ? status || "Procesando…"
              : `Celdas: ${counts.total} · ✓ ${counts.green} · ! ${counts.yellow} · × ${counts.red}`}
          </div>
          <div className="ml-auto flex gap-2">
            <BUTTON
              onClick={() => reloadData()}
              className={btnBase}
              disabled={loading}
            >
              <FM
                id="metaTab.reload"
                defaultMessage="Cargar desde Firestore"
              />
            </BUTTON>
            <BUTTON
              onClick={saveAll}
              className={btnPrimary}
              disabled={loading}
            >
              <FM id="metaTab.saveAll" defaultMessage="Guardar todo" />
            </BUTTON>
          </div>
        </div>
      </div>

      {/* Controles */}
      <section className={surface}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className={label}>
              <FM
                id="metaTab.activeLocales"
                defaultMessage="Locales activos"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {locales.map((loc) => {
                const active = activeLocales.includes(loc);
                return (
                  <BUTTON
                    key={loc}
                    data-active={active}
                    className={pill}
                    onClick={() =>
                      setActiveLocales((prev) =>
                        prev.includes(loc)
                          ? prev.filter((x) => x !== loc)
                          : [...prev, loc]
                      )
                    }
                  >
                    {loc}
                  </BUTTON>
                );
              })}
            </div>
          </div>

          <div>
            <div className={label}>
              <FM id="metaTab.searchId" defaultMessage="Buscar ID" />
            </div>
            <INPUT
              className={inputBase + " mt-1"}
              placeholder="filtra por texto del ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <div className={label}>
              <FM
                id="metaTab.filterByStatus"
                defaultMessage="Filtrar por estado"
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <BUTTON
                className={pill}
                data-active={colorFilter === "all"}
                onClick={() => setColorFilter("all")}
              >
                <FM id="metaTab.filter.all" defaultMessage="Todos" />
              </BUTTON>
              <BUTTON
                className={pill + " flex items-center gap-2"}
                data-active={colorFilter === "green"}
                onClick={() => setColorFilter("green")}
              >
                <Badge s="green" />{" "}
                <FM id="metaTab.filter.green" defaultMessage="Verde" />
              </BUTTON>
              <BUTTON
                className={pill + " flex items-center gap-2"}
                data-active={colorFilter === "yellow"}
                onClick={() => setColorFilter("yellow")}
              >
                <Badge s="yellow" />{" "}
                <FM id="metaTab.filter.yellow" defaultMessage="Amarillo" />
              </BUTTON>
              <BUTTON
                className={pill + " flex items-center gap-2"}
                data-active={colorFilter === "red"}
                onClick={() => setColorFilter("red")}
              >
                <Badge s="red" />{" "}
                <FM id="metaTab.filter.red" defaultMessage="Rojo" />
              </BUTTON>
            </div>
          </div>
        </div>
      </section>

      {/* Añadir & Importar IDs */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className={surface}>
          <div className={h6}>
            <FM id="metaTab.addId" defaultMessage="Añadir ID" />
          </div>
          <div className="flex gap-2 mt-2">
            <INPUT
              className={inputBase}
              placeholder="ej: home.welcome"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addKey(newKey);
                  setNewKey("");
                }
              }}
            />
            <BUTTON
              className={btnBase}
              onClick={() => {
                addKey(newKey);
                setNewKey("");
              }}
            >
              <FM id="metaTab.addId" defaultMessage="Añadir" />
            </BUTTON>
          </div>
          <P className="text-xs opacity-70 mt-2">
            <FM
              id="metaTab.addId.description"
              defaultMessage="Se crea una fila por cada locale activo. Por defecto, el valor = id (rojo) para ubicarlo en la UI."
            />
          </P>
        </div>

        <div className={surface}>
          <div className={h6}>
            <FM
              id="metaTab.importIds"
              defaultMessage="Importar IDs (pegar varios)"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <textarea
              className={inputBase + " h-9"}
              rows={1}
              placeholder="Pega IDs (uno por línea) y pulsa Importar o Ctrl/Cmd+Enter"
              value={bulkIds}
              onChange={(e) => setBulkIds(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) importIds();
              }}
            />
            <BUTTON className={btnBase} onClick={importIds}>
              <FM id="metaTab.import" defaultMessage="Importar" />
            </BUTTON>
          </div>
        </div>
      </section>

      {/* Importar JSON (archivo) — GLOBAL */}
      <section className={surface}>
        <div className={h6}>
          <FM
            id="metaTab.importJson"
            defaultMessage="Importar JSON masivo (es/en/fr)"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end mt-2">
          <div className="space-y-2">
            <div className={label}>
              <FM
                id="metaTab.mode.global"
                defaultMessage="Global (1 documento por idioma)"
              />
            </div>
            <P className="text-xs opacity-70">
              <FM
                id="metaTab.uploadFiles"
                defaultMessage="Sube archivos es.json, en.json, fr.json. Todo se guardará en el ámbito Global por idioma."
              />
            </P>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <INPUT
              id="i18n-json-file"
              type="file"
              accept=".json"
              multiple
              className={btnBase + " cursor-pointer"}
              onChange={(e) => handleJsonImport(e.currentTarget.files)}
            />
            {inlineStatus && (
              <SPAN className="text-xs text-emerald-600 dark:text-emerald-400">
                {inlineStatus}
              </SPAN>
            )}
          </div>
        </div>
      </section>

      {/* Tabla */}
      <section className={surface}>
        <div className="overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-sm border-collapse table-fixed">
            <thead className="bg-neutral-900/80">
              <tr>
                <th className="text-left p-2 w-[360px] text-neutral-700 dark:text-neutral-200">
                  <FM id="metaTab.id" defaultMessage="ID" />
                </th>
                {activeLocales.map((loc) => (
                  <th
                    key={loc}
                    className="text-left p-2 text-neutral-700 dark:text-neutral-200"
                  >
                    {loc}
                  </th>
                ))}
                <th className="text-left p-2 w-[80px] text-neutral-700 dark:text-neutral-200">
                  <FM id="metaTab.delete" defaultMessage="Borrar" />
                </th>
                <th className="text-left p-2 w-[80px] text-neutral-700 dark:text-neutral-200">
                  <FM id="metaTab.status" defaultMessage="Estado" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    className="p-4 text-neutral-500 dark:text-neutral-400"
                    colSpan={1 + activeLocales.length + 2}
                  >
                    {loading
                      ? status || "Cargando…"
                      : "Sin claves (cambia filtro, añade o importa JSON)"}
                  </td>
                </tr>
              )}
              {filteredRows.map((r) => (
                <tr key={r.id} className="odd:bg-neutral-900/40">
                  <td className="p-2 align-top">
                    <code className="text-xs opacity-80 break-all">{r.id}</code>
                  </td>

                  {activeLocales.map((loc) => {
                    const val = (data[r.id]?.[loc] ?? "") as string;
                    const st = statusFor(r.id, committed[r.id]?.[loc]);
                    return (
                      <td key={loc} className="p-2 align-top">
                        <div className="flex items-center gap-2">
                          <Badge s={st} />
                          <INPUT
                            className={inputBase}
                            value={val}
                            onChange={(e) =>
                              setCell(r.id, loc, e.target.value)
                            }
                            onBlur={() => confirmCell(r.id, loc)}
                            placeholder={r.id}
                          />
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-2 align-top">
                    <BUTTON
                      className={btnBase + " px-2 py-1"}
                      onClick={() => deleteIdHere(r.id)}
                      title="Eliminar"
                    >
                      🗑
                    </BUTTON>
                  </td>

                  <td className="p-2 align-top">
                    <div className="flex items-center justify-center">
                      <Badge
                        s={rowStatusFor(activeLocales, r.id, committed)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <P className="text-xs opacity-70 mt-2">
          <FM
            id="metaTab.importTip"
            defaultMessage="Tip: Ctrl/Cmd + Enter en “Importar IDs” para agregar rápido."
          />
        </P>
      </section>
    </div>
  );
}
