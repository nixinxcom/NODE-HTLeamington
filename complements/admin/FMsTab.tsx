"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  loadSupportedLocales,
  loadFMsGlobal,
  loadFMsPage,
  loadFMsSite,
  saveFMsGlobal,
  saveFMsPage,
  saveFMsSite,
  deleteFMsSiteFields,
  deleteFMsGlobalFields,
  deleteFMsPageFields,
  loadFMsOrder,
  saveFMsOrder,
} from "@/app/lib/i18n/store";
import { normalizeRouteKey } from "@/app/lib/i18n/utils";
import FM from "../i18n/FM";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";


/* Wrappers defensivos (por si el store aún no exporta algo) */
const _noop = async (..._args: any[]) => {};
const _emptyA = async (..._args: any[]) => [] as string[];
const delGlobal = (deleteFMsGlobalFields ?? (async () => {})) as typeof deleteFMsGlobalFields;
const delPage = (deleteFMsPageFields ?? (async () => {})) as typeof deleteFMsPageFields;
const loadOrder = (loadFMsOrder ?? _emptyA) as typeof loadFMsOrder;
const saveOrder = (saveFMsOrder ?? _noop) as typeof saveFMsOrder;

/* ===== Estilos DARK-first (drop-in) ===== */
const ring =
  "focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:ring-offset-0";

const surface =
  "rounded-xl border p-4 " +
  /* Dark por defecto */
  "bg-neutral-900 text-neutral-100 border-neutral-700 " +
  /* Fallback light */
  "dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 " +
  "bg-white text-neutral-900 border-neutral-200";

const inputBase =
  "w-full rounded-md border px-3 py-2 text-sm " +
  /* Dark */
  "bg-neutral-800 text-neutral-100 placeholder:text-neutral-400 border-neutral-700 " +
  /* Light fallback */
  "dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:border-neutral-700 " +
  "bg-white text-neutral-900 placeholder:text-neutral-400 border-neutral-300 " +
  ring;

const btnBase =
  "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition " +
  /* Dark */
  "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border-neutral-700 " +
  /* Light fallback */
  "dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:border-neutral-700 " +
  "bg-white text-neutral-900 hover:bg-neutral-50 border-neutral-300 " +
  ring;

const btnPrimary =
  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm " +
  /* Dark-lean */
  "bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-60 " +
  "dark:bg-indigo-500 dark:hover:bg-indigo-400 " +
  ring;

const pill =
  "px-2.5 py-1 rounded-full border text-sm transition " +
  "data-[active=true]:bg-indigo-600 data-[active=true]:text-white data-[active=true]:border-indigo-600 " +
  /* Dark */
  "bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-100 " +
  /* Light fallback */
  "dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:border-neutral-700 " +
  "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-900";

const label =
  "text-[11px] uppercase tracking-wide text-neutral-400 dark:text-neutral-400";

const h6 = "text-base font-semibold text-neutral-100 dark:text-neutral-100";

/* ===== Helpers visuales (semáforo) ===== */
type Traffic = "red" | "yellow" | "green";
function Badge({ s, size = 12 }: { s: Traffic; size?: number }) {
  const bg =
    s === "red"    ? "#ef4444" : // red-500
    s === "yellow" ? "#f59e0b" : // amber/yellow-500
                     "#10b981";  // emerald-500
  return (
    <SPAN
      className="inline-block rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: bg }}
    />
  );
}

/* ===== Rutas conocidas ===== */
const KNOWN_ROUTES = new Set(["home", "aboutus", "menu", "contact", "kiosk-encuesta", "blog", "offline"]);
const detectRouteFromId = (id: string): string | null => {
  const prefix = (id.split(".")[0] || "").trim().toLowerCase();
  if (!prefix) return null;
  const norm = normalizeRouteKey(prefix);
  return KNOWN_ROUTES.has(norm) ? norm : null;
};
const approxSizeBytes = (obj: Record<string, any>) => {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch {
    return 0;
  }
};

/* ===== Tipos ===== */
type Scope = "page" | "site" | "global";
type Row = { id: string; values: Record<string, string | null> };
type ImportMode = "global" | "site" | "split";

/* ===== Heurística global (para sugerir) ===== */
const GLOBAL_PREFIXES = ["global.", "button.", "btn.", "uploader.", "offline.", "404.", "login.", "table.", "share.", "bgmedia.", "footer.auth."];
const GLOBAL_SUFFIXES = [
  ".submit",
  ".cancel",
  ".save",
  ".send",
  ".retry",
  ".back",
  ".next",
  ".previous",
  ".ok",
  ".yes",
  ".no",
  ".close",
  ".open",
  ".loading",
  ".error",
  ".success",
  ".install",
  ".installApp",
  ".later",
  ".logout",
  ".login",
  ".download",
];
const isGlobalId = (id: string) => GLOBAL_PREFIXES.some((p) => id.startsWith(p)) || GLOBAL_SUFFIXES.some((s) => id.endsWith(s));

/* ===== Estado de celda/fila (semáforo) ===== */
function statusFor(id: string, v: string | null | undefined): Traffic {
  if (v == null) return "red";
  const t = String(v).trim();
  if (!t) return "red";
  if (t === id) return "red";
  return "green";
}
function rowStatusFor(locales: string[], id: string, committed: Record<string, Record<string, string | null>>): Traffic {
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

  /* Estado principal */
  const [scope, setScope] = useState<Scope>("page");
  const [routeKey, setRouteKey] = useState<string>("home");
  const [locales, setLocales] = useState<string[]>([urlLocale || "es"]);
  const [activeLocales, setActiveLocales] = useState<string[]>([]);
  const [search, setSearch] = useState<string>("");
  const [colorFilter, setColorFilter] = useState<"all" | Traffic>("all");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [inlineStatus, setInlineStatus] = useState("");

  const [data, setData] = useState<Record<string, Record<string, string | null>>>({});
  const [committed, setCommitted] = useState<Record<string, Record<string, string | null>>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [newKey, setNewKey] = useState("");
  const [bulkIds, setBulkIds] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [importMode, setImportMode] = useState<ImportMode>("global");

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

  /* ----------- CARGA con fallback (page -> site -> global) ----------- */
  const doLoadFor = useCallback(
    async (sc: Scope): Promise<Record<string, Record<string, string | null>>> => {
      const matrix: Record<string, Record<string, string | null>> = {};
      for (const loc of activeLocales) {
        const pack =
          sc === "global" ? await loadFMsGlobal(loc) : sc === "site" ? await loadFMsSite(loc) : await loadFMsPage(routeKey, loc);
        for (const k of Object.keys(pack)) {
          matrix[k] = matrix[k] || {};
          matrix[k][loc] = pack[k];
        }
      }
      for (const k of Object.keys(matrix)) {
        for (const loc of activeLocales) if (!(loc in matrix[k])) matrix[k][loc] = null;
      }
      return matrix;
    },
    [activeLocales, routeKey]
  );

  const reloadData = useCallback(
    async (withFallback = true) => {
      if (!activeLocales.length) return;
      setLoading(true);
      setStatus("Cargando…");

      // 1) intenta el scope actual
      let sc: Scope = scope;
      let matrix = await doLoadFor(sc);

      // 2) si no hay claves y está permitido, prueba site y luego global
      if (withFallback && Object.keys(matrix).length === 0) {
        if (sc === "page") {
          const mSite = await doLoadFor("site");
          if (Object.keys(mSite).length > 0) {
            sc = "site";
            matrix = mSite;
            setScope("site");
          } else {
            const mGlobal = await doLoadFor("global");
            if (Object.keys(mGlobal).length > 0) {
              sc = "global";
              matrix = mGlobal;
              setScope("global");
            }
          }
        } else if (sc === "site") {
          const mGlobal = await doLoadFor("global");
          if (Object.keys(mGlobal).length > 0) {
            sc = "global";
            matrix = mGlobal;
            setScope("global");
          }
        }
      }

      // orden
      const ord = await loadOrder(sc, routeKey);
      const keys = Object.keys(matrix);
      const merged = [...ord.filter((id) => keys.includes(id)), ...keys.filter((id) => !ord.includes(id))];
      setOrder(merged);

      setData(matrix);
      setCommitted(matrix);
      setSelected(new Set());

      setLoading(false);
      setStatus("");
    },
    [activeLocales, scope, routeKey, doLoadFor]
  );

  useEffect(() => {
    void reloadData(true);
  }, [reloadData]);

  /* Derivados */
  const sortedKeys = useMemo(() => {
    const keys = Object.keys(data).filter((k) => (!search ? true : k.toLowerCase().includes(search.toLowerCase())));
    const pos = new Map(order.map((id, i) => [id, i]));
    return [...keys].sort((a, b) => {
      const ia = pos.has(a) ? (pos.get(a) as number) : Number.MAX_SAFE_INTEGER;
      const ib = pos.has(b) ? (pos.get(b) as number) : Number.MAX_SAFE_INTEGER;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b);
    });
  }, [data, order, search]);

  const rows: Row[] = useMemo(() => sortedKeys.map((id) => ({ id, values: data[id] || {} })), [sortedKeys, data]);

  const filteredRows = useMemo(() => {
    if (colorFilter === "all") return rows;
    return rows.filter((r) => rowStatusFor(activeLocales, r.id, committed) === colorFilter);
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

  /* Edición (blur para actualizar semáforo) */
  const setCell = (id: string, locale: string, val: string) => {
    setData((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [locale]: val } }));
  };
  const confirmCell = (id: string, locale: string) => {
    setCommitted((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [locale]: data[id]?.[locale] ?? "" } }));
  };

  const addKey = (id: string) => {
    const k = id.trim();
    if (!k) return;
    setData((prev) => {
      if (prev[k]) return prev;
      const row: Record<string, string | null> = {};
      for (const loc of activeLocales) row[loc] = k;
      setOrder((o) => [...o, k]);
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
    for (const r of rows)
      for (const loc of activeLocales) {
        const v = r.values[loc];
        if (v != null) (partialByLocale[loc] ||= {})[r.id] = v;
      }
    for (const loc of Object.keys(partialByLocale)) {
      if (scope === "global") await saveFMsGlobal(loc, partialByLocale[loc]);
      else if (scope === "site") await saveFMsSite(loc, partialByLocale[loc]);
      else await saveFMsPage(routeKey, loc, partialByLocale[loc]);
    }
    await saveOrder(scope, routeKey, order);
    setStatus("✓ Guardado");
    setLoading(false);
    try {
      window.dispatchEvent(new CustomEvent("i18n:invalidate", { detail: { locales: Object.keys(partialByLocale), routeKey } }));
    } catch {}
    setTimeout(() => setStatus(""), 1200);
  };

// ↓ Pega esto dentro del componente FMsTab (por ejemplo debajo de saveAll)
async function deleteIdHere(id: string) {
  setLoading(true);
  setStatus("Eliminando…");

  const ids = [id];

  try {
    if (scope === "global") {
      // i18n_global/{locale}
      for (const loc of activeLocales) {
        await deleteFMsGlobalFields(loc, ids);
      }
    } else if (scope === "site") {
      // i18n_site/{locale}
      for (const loc of activeLocales) {
        await deleteFMsSiteFields(loc, ids);
      }
    } else {
      // i18n_pages/{routeKey}/locales/{locale}
      for (const loc of activeLocales) {
        await deleteFMsPageFields(routeKey, loc, ids);
      }
    }
  } catch (err) {
    console.warn("Error al eliminar:", err);
  }

  // Actualiza estado local (UI)
  setData(prev => {
    const copy = { ...prev };
    delete copy[id];
    return copy;
  });
  setCommitted(prev => {
    const copy = { ...prev };
    delete copy[id];
    return copy;
  });
  setOrder(prev => prev.filter(x => x !== id));
  setSelected?.(prev => {
    try {
      const nx = new Set(prev);
      nx.delete(id);
      return nx;
    } catch { return prev as any; }
  });

  setStatus("✓ Eliminado");
  setLoading(false);
  setTimeout(() => setStatus(""), 900);
}


  /* Selección y batch (se conserva) */
  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const nx = new Set(prev);
      nx.has(id) ? nx.delete(id) : nx.add(id);
      return nx;
    });
  };
  const allDisplayedIds = useMemo(() => filteredRows.map((r) => r.id), [filteredRows]);
  const allChecked = allDisplayedIds.length > 0 && allDisplayedIds.every((id) => selected.has(id));
  const toggleSelectAll = () => {
    setSelected((prev) => {
      const nx = new Set(prev);
      if (allChecked) allDisplayedIds.forEach((id) => nx.delete(id));
      else allDisplayedIds.forEach((id) => nx.add(id));
      return nx;
    });
  };

  async function batchMove(to: "global" | "site" | "page") {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setLoading(true);
    setStatus("Moviendo selección…");
    const byLocale: Record<string, Record<string, string>> = {};
    for (const id of ids)
      for (const loc of activeLocales) {
        const v = data[id]?.[loc];
        if (v != null) (byLocale[loc] ||= {})[id] = v;
      }
    for (const [loc, pack] of Object.entries(byLocale)) {
      if (to === "global") await saveFMsGlobal(loc, pack);
      else if (to === "site") await saveFMsSite(loc, pack);
      else await saveFMsPage(routeKey, loc, pack);
    }
    if (to !== "global") for (const loc of activeLocales) await delGlobal(loc, ids).catch(() => {});
    if (to !== "site") for (const loc of activeLocales) await deleteFMsSiteFields(loc, ids).catch(() => {});
    if (to !== "page") for (const loc of activeLocales) await delPage(routeKey, loc, ids).catch(() => {});
    setStatus("✓ Movidos");
    setLoading(false);
    setSelected(new Set());
    setTimeout(() => setStatus(""), 1200);
  }

  /* Sugerir globales desde site (se conserva) */
  async function suggestAndMoveGlobalsFromSite() {
    setLoading(true);
    setStatus("Analizando site y moviendo a global…");
    const siteByLocale: Record<string, Record<string, string>> = {};
    for (const loc of activeLocales) siteByLocale[loc] = await loadFMsSite(loc);
    const allIds = new Set<string>();
    for (const loc of Object.keys(siteByLocale)) Object.keys(siteByLocale[loc] || {}).forEach((k) => allIds.add(k));
    const candidates = Array.from(allIds).filter(isGlobalId);
    if (!candidates.length) {
      setLoading(false);
      setStatus("No se detectaron globales por heurística.");
      setTimeout(() => setStatus(""), 1500);
      return;
    }
    const globalsPerLocale: Record<string, Record<string, string>> = {};
    for (const loc of Object.keys(siteByLocale)) {
      const src = siteByLocale[loc] || {};
      for (const id of candidates) {
        const v = src[id];
        if (v != null) (globalsPerLocale[loc] ||= {})[id] = v;
      }
    }
    for (const [loc, pack] of Object.entries(globalsPerLocale)) if (Object.keys(pack).length) await saveFMsGlobal(loc, pack);
    for (const loc of Object.keys(siteByLocale)) await deleteFMsSiteFields(loc, candidates);
    setStatus(`✓ Movidos ${candidates.length} ids a global y eliminados de site`);
    setLoading(false);
    setTimeout(() => setStatus(""), 1800);
    await reloadData(true);
  }

  /* Import JSON (archivo) — sin cambios de estilos */
  async function handleJsonImport(files: FileList | null) {
    if (!files || files.length === 0) return;
    setLoading(true);
    setStatus("Procesando JSON…");
    setInlineStatus("Procesando JSON…");

    const perLocaleGlobal: Record<string, Record<string, string>> = {};
    const perLocaleSite: Record<string, Record<string, string>> = {};
    const perLocalePages: Record<string, Record<string, Record<string, string>>> = {};

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

      if (importMode === "global") perLocaleGlobal[loc] = { ...(perLocaleGlobal[loc] || {}), ...json };
      else if (importMode === "site") perLocaleSite[loc] = { ...(perLocaleSite[loc] || {}), ...json };
      else {
        for (const [id, val] of Object.entries(json)) {
          const rk = detectRouteFromId(id) || "__global__";
          if (rk === "__global__") perLocaleGlobal[loc] = { ...(perLocaleGlobal[loc] || {}), [id]: val };
          else {
            perLocalePages[loc] = perLocalePages[loc] || {};
            perLocalePages[loc][rk] = perLocalePages[loc][rk] || {};
            perLocalePages[loc][rk][id] = val;
          }
        }
      }
    }

    let willSplit = importMode === "split";
    if (!willSplit) {
      for (const [loc, pack] of Object.entries(perLocaleGlobal)) {
        const size = approxSizeBytes(pack);
        if (size > 900_000) {
          const splitPages: Record<string, Record<string, string>> = {};
          const restGlobal: Record<string, string> = {};
          for (const [id, val] of Object.entries(pack)) {
            const rk = detectRouteFromId(id) || "__global__";
            if (rk === "__global__") restGlobal[id] = val;
            else {
              splitPages[rk] = splitPages[rk] || {};
              splitPages[rk][id] = val;
            }
          }
          perLocalePages[loc] = { ...(perLocalePages[loc] || {}), ...splitPages };
          perLocaleGlobal[loc] = restGlobal;
          willSplit = true;
        }
      }
    }

    setStatus("Importando en Firestore…");
    setInlineStatus("Importando en Firestore…");

    for (const [loc, pack] of Object.entries(perLocaleGlobal)) if (Object.keys(pack).length) await saveFMsGlobal(loc, pack);
    for (const [loc, pack] of Object.entries(perLocaleSite)) if (Object.keys(pack).length) await saveFMsSite(loc, pack);
    for (const [loc, pages] of Object.entries(perLocalePages)) {
      for (const [rk, pack] of Object.entries(pages)) if (Object.keys(pack).length) await saveFMsPage(rk, loc, pack);
    }

    if (importMode === "global") setScope("global");
    else if (importMode === "site") setScope("site");
    else setScope("page");

    await reloadData(true);

    setStatus("✓ Importación completa");
    setInlineStatus("✓ Importación completa");
    setLoading(false);

    const fi = document.getElementById("i18n-json-file") as HTMLInputElement | null;
    if (fi) fi.value = "";

    try {
      window.dispatchEvent(
        new CustomEvent("i18n:invalidate", {
          detail: { locales: [...Object.keys(perLocaleGlobal), ...Object.keys(perLocalePages)], routeKey },
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
      {/* Top bar (mismos estilos) */}
      <div className="sticky top-0 z-20 bg-neutral-100/20 dark:bg-neutral-900/90 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-3 py-2 flex flex-wrap items-center gap-3">
          <div className="text-sm flex items-center gap-2">
            <Badge s="red" /> <SPAN><FM id="metaTab.filter.red" defaultMessage="id = valor" /></SPAN>
            <Badge s="yellow" /> <SPAN><FM id="metaTab.filter.yellow" defaultMessage="vacío / incompleto" /></SPAN>
            <Badge s="green" /> <SPAN><FM id="metaTab.filter.green" defaultMessage="ok" /></SPAN>
          </div>
          <div className="text-sm opacity-80">
            {loading ? status || "Procesando…" : `Celdas: ${counts.total} · ✓ ${counts.green} · ! ${counts.yellow} · × ${counts.red}`}
          </div>
          <div className="ml-auto flex gap-2">
            {/* NUEVO: recarga manual desde Firestore */}
            <BUTTON onClick={() => reloadData(true)} className={btnBase} disabled={loading}>
              <FM id="metaTab.reload" defaultMessage="Cargar desde Firestore" />
            </BUTTON>
            {scope === "site" && (
              <BUTTON onClick={suggestAndMoveGlobalsFromSite} className={btnBase} disabled={loading}>
                <FM id="metaTab.suggest" defaultMessage="Sugerir globales y mover" />
              </BUTTON>
            )}
            <BUTTON onClick={saveAll} className={btnPrimary} disabled={loading}>
              <FM id="metaTab.saveAll" defaultMessage="Guardar todo" />
            </BUTTON>
          </div>
        </div>
      </div>

      {/* Controles (mismos estilos) */}
      <section className={surface}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className={label}><FM id="metaTab.scope" defaultMessage="Ámbito" /></div>
            <SELECT className={inputBase + " mt-1"} value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
              <option value="page"><FM id="metaTab.scope.page" defaultMessage="Por página" /></option>
              <option value="site"><FM id="metaTab.scope.site" defaultMessage="Site (todas las páginas)" /></option>
              <option value="global"><FM id="metaTab.scope.global" defaultMessage="Global (componentes)" /></option>
            </SELECT>
          </div>

          {scope === "page" && (
            <div>
              <div className={label}>Ruta (subsección)</div>
              <div className="flex gap-2 mt-1">
                <SELECT className={inputBase} value={routeKey} onChange={(e) => setRouteKey(normalizeRouteKey(e.target.value))}>
                  {Array.from(KNOWN_ROUTES).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </SELECT>
                <INPUT
                  className={inputBase}
                  placeholder="o escribe: /, /aboutus, /(kiosk)/encuesta"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v) setRouteKey(normalizeRouteKey(v));
                    e.currentTarget.value = "";
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <div className={label}><FM id="metaTab.activeLocales" defaultMessage="Locales activos" /></div>
            <div className="flex flex-wrap gap-2 mt-1">
              {locales.map((loc) => {
                const active = activeLocales.includes(loc);
                return (
                  <BUTTON
                    key={loc}
                    data-active={active}
                    className={pill}
                    onClick={() => setActiveLocales((prev) => (prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]))}
                  >
                    {loc}
                  </BUTTON>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className={label}><FM id="metaTab.searchId" defaultMessage="Buscar ID" /></div>
            <INPUT className={inputBase + " mt-1"} placeholder="filtra por texto del ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div>
            <div className={label}><FM id="metaTab.filterByStatus" defaultMessage="Filtrar por estado" /></div>
            <div className="flex items-center gap-2 mt-1">
              <BUTTON className={pill} data-active={colorFilter === "all"} onClick={() => setColorFilter("all")}>
                <FM id="metaTab.filter.all" defaultMessage="Todos" />
              </BUTTON>
              <BUTTON className={pill + " flex items-center gap-2"} data-active={colorFilter === "green"} onClick={() => setColorFilter("green")}>
                <Badge s="green" /> <FM id="metaTab.filter.green" defaultMessage="Verde" />
              </BUTTON>
              <BUTTON className={pill + " flex items-center gap-2"} data-active={colorFilter === "yellow"} onClick={() => setColorFilter("yellow")}>
                <Badge s="yellow" /> <FM id="metaTab.filter.yellow" defaultMessage="Amarillo" />
              </BUTTON>
              <BUTTON className={pill + " flex items-center gap-2"} data-active={colorFilter === "red"} onClick={() => setColorFilter("red")}>
                <Badge s="red" /> <FM id="metaTab.filter.red" defaultMessage="Rojo" />
              </BUTTON>
            </div>
          </div>
        </div>
      </section>

      {/* Añadir & Importar IDs (pegar varios) */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className={surface}>
          <div className={h6}><FM id="metaTab.addId" defaultMessage="Añadir ID" /></div>
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
            <BUTTON className={btnBase} onClick={() => { addKey(newKey); setNewKey(""); }}>
              <FM id="metaTab.addId" defaultMessage="Añadir" />
            </BUTTON>
          </div>
          <P className="text-xs opacity-70 mt-2"><FM id="metaTab.addId.description" defaultMessage="Se crea una fila por cada locale activo. Por defecto, el valor = id (rojo) para ubicarlo en la UI." /></P>
        </div>

        <div className={surface}>
          <div className={h6}><FM id="metaTab.importIds" defaultMessage="Importar IDs (pegar varios)" /></div>
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

      {/* Importar JSON (archivo) */}
      <section className={surface}>
        <div className={h6}><FM id="metaTab.importJson" defaultMessage="Importar JSON masivo (es/en/fr)" /></div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end mt-2">
          <div className="space-y-2">
            <div className={label}><FM id="metaTab.mode" defaultMessage="Modo" /></div>
            <div className="flex flex-wrap gap-4">
              <LABEL className="flex items-center gap-2 text-sm">
                <INPUT type="radio" name="importMode" checked={importMode === "global"} onChange={() => setImportMode("global")} />
                <SPAN><FM id="metaTab.mode.global" defaultMessage="Global (1 documento por idioma)" /></SPAN>
              </LABEL>
              <LABEL className="flex items-center gap-2 text-sm">
                <INPUT type="radio" name="importMode" checked={importMode === "site"} onChange={() => setImportMode("site")} />
                <SPAN><FM id="metaTab.mode.site" defaultMessage="Site (1 documento por idioma)" /></SPAN>
              </LABEL>
              <LABEL className="flex items-center gap-2 text-sm">
                <INPUT type="radio" name="importMode" checked={importMode === "split"} onChange={() => setImportMode("split")} />
                <SPAN><FM id="metaTab.mode.split" defaultMessage="Dividir por página (home, aboutus…)" /></SPAN>
              </LABEL>
            </div>
            <P className="text-xs opacity-70">
              <FM id="metaTab.uploadFiles" defaultMessage="Sube archivos <code>es.json</code>, <code>en.json</code>, <code>fr.json</code>. Si un JSON excede ~0.9 MiB, se divide por página automáticamente." />
            </P>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <INPUT id="i18n-json-file" type="file" accept=".json" multiple className={btnBase + " cursor-pointer"} onChange={(e) => handleJsonImport(e.currentTarget.files)} />
            {inlineStatus && <SPAN className="text-xs text-emerald-600 dark:text-emerald-400">{inlineStatus}</SPAN>}
          </div>
        </div>
      </section>

      {/* Toolbar batch (se conserva) */}
      {selected.size > 0 && (
        <section className={surface + " flex items-center justify-between"}>
          <div className="text-sm">
            <FM id="metaTab.selected" defaultMessage="Seleccionados: {count}" values={{ count: selected.size }} />
          </div>
          <div className="flex gap-2">
            <BUTTON className={btnBase} onClick={() => batchMove("global")}>
              <FM id="metaTab.moveToGlobal" defaultMessage="Mover a Global" />
            </BUTTON>
            <BUTTON className={btnBase} onClick={() => batchMove("site")}>
              <FM id="metaTab.moveToSite" defaultMessage="Mover a Site" />
            </BUTTON>
            <BUTTON className={btnBase} onClick={() => batchMove("page")}>
              <FM id="metaTab.moveToPage" defaultMessage="Mover a Página" values={{ routeKey }} />
            </BUTTON>
          </div>
        </section>
      )}

      {/* Tabla (misma UI + semáforo) */}
      <section className={surface}>
        <div className="overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-sm border-collapse table-fixed">
            <thead className="bg-neutral-900/80">
              <tr>
                <th className="text-left p-2 w-[30px]">
                  <INPUT type="checkbox" checked={allChecked} onChange={toggleSelectAll} />
                </th>
                <th className="text-left p-2 w-[360px] text-neutral-700 dark:text-neutral-200"><FM id="metaTab.id" defaultMessage="ID" /></th>
                {activeLocales.map((loc) => (
                  <th key={loc} className="text-left p-2 text-neutral-700 dark:text-neutral-200">
                    {loc}
                  </th>
                ))}
                <th className="text-left p-2 w-[80px] text-neutral-700 dark:text-neutral-200"><FM id="metaTab.delete" defaultMessage="Borrar" /></th>
                <th className="text-left p-2 w-[80px] text-neutral-700 dark:text-neutral-200"><FM id="metaTab.status" defaultMessage="Estado" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredRows.length === 0 && (
                <tr>
                  <td className="p-4 text-neutral-500 dark:text-neutral-400" colSpan={2 + activeLocales.length + 2}>
                    {loading ? status || "Cargando…" : "Sin claves (cambia filtro, añade o importa JSON)"}
                  </td>
                </tr>
              )}
              {filteredRows.map((r, idx) => (
                <tr key={r.id} className="odd:bg-neutral-900/40">
                  <td className="p-2 align-top">
                    <INPUT type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelectOne(r.id)} />
                  </td>

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
                          <INPUT className={inputBase} value={val} onChange={(e) => setCell(r.id, loc, e.target.value)} onBlur={() => confirmCell(r.id, loc)} placeholder={r.id} />
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-2 align-top">
                    <BUTTON className={btnBase + " px-2 py-1"} onClick={() => deleteIdHere(r.id)} title="Eliminar">🗑</BUTTON>
                  </td>

                  <td className="p-2 align-top">
                    <div className="flex items-center justify-center">
                      <Badge s={rowStatusFor(activeLocales, r.id, committed)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <P className="text-xs opacity-70 mt-2">
          <FM id="metaTab.importTip" defaultMessage="Tip: <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd> en “Importar IDs” para agregar rápido." />
        </P>
      </section>
    </div>
  );
}
