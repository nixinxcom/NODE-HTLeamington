'use client';

import React from 'react';
import type iSettings from '@/app/lib/settings/interface';
// Carga por regla (FS > TSX(FM) > JSON > TSX). En settings normalmente no hay FM, pero respetamos el orden.
import { getSettingsEffectiveForUI } from '@/complements/data/ruleUI';
import { saveSettingsClient } from '@/app/lib/settings/client';       // writer a FS
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

// ----------------- helpers -----------------
const setByPath = (obj: any, path: string, value: any) => {
  const parts = path.split('.');
  const last = parts.pop()!;
  const target = parts.reduce((acc, k) => (acc[k] ??= {}), obj);
  target[last] = value;
  return obj;
};

const SECTION_LABELS: Record<string, string> = {
  website: 'Sitio web',
  company: 'Empresa',
  pwa: 'Manifiesto PWA',
  agentAI: 'Agente de IA',
  directUrls: 'URLs directas',
  domain: 'Dominio',
  faculties: 'Facultades',
};

type ArrKind = 'string' | 'number' | 'boolean' | 'object' | 'mixed' | 'unknown';

const kindOf = (v: any): ArrKind =>
  Array.isArray(v) ? 'unknown'
  : v === null ? 'mixed'
  : typeof v === 'object' ? 'object'
  : (typeof v as ArrKind);

// ----------------- Array editor -----------------
function ArrayField({
  path,
  label,
  value,
  onChange,
}: {
  path: string;
  label?: string;
  value: any[];
  onChange: (path: string, v: any[]) => void;
}) {
  // inferir tipo global si todos coinciden
  const itemKinds = value.map(kindOf);
  const uniform =
    itemKinds.length > 0 && itemKinds.every((k) => k === itemKinds[0])
      ? (itemKinds[0] as ArrKind)
      : (itemKinds.length ? 'mixed' : 'unknown');

  const [emptyKind, setEmptyKind] = React.useState<ArrKind>('string');

  const addItem = (k: ArrKind) => {
    const next = [...value];
    switch (k) {
      case 'string': next.push(''); break;
      case 'number': next.push(0); break;
      case 'boolean': next.push(false); break;
      case 'object': next.push({}); break;
      default: next.push(''); break;
    }
    onChange(path, next);
  };

  const removeItem = (i: number) => {
    const next = value.slice();
    next.splice(i, 1);
    onChange(path, next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    onChange(path, next);
  };

  const updateItem = (i: number, newVal: any) => {
    const next = value.slice();
    next[i] = newVal;
    onChange(path, next);
  };

  return (
    <fieldset className="rounded-2xl border border-[#1f2937] px-4 py-3 my-3">
      <legend className="px-2 text-sm opacity-80">{label ?? path}</legend>

      {/* Array vacío: selector de tipo para primer ítem */}
      {value.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <SPAN className="opacity-80">Tipo de elementos:</SPAN>
          <SELECT
            className="rounded-lg px-3 py-2 bg-[#0f172a] border border-[#1f2937]"
            value={emptyKind}
            onChange={(e) => setEmptyKind(e.target.value as ArrKind)}
          >
            <option value="string">Texto</option>
            <option value="number">Número</option>
            <option value="boolean">Booleano</option>
            <option value="object">Objeto</option>
          </SELECT>
          <BUTTON
            className="rounded-lg px-3 py-2 bg-[#2563eb] text-white"
            onClick={() => addItem(emptyKind)}
            type="button"
          >
            Añadir elemento
          </BUTTON>
        </div>
      ) : (
        <>
          {/* Lista de elementos */}
          <div className="flex flex-col gap-3">
            {value.map((item, i) => {
              const k = kindOf(item);
              const id = `${path}-${i}`;

              if (k === 'string') {
                return (
                  <div key={id} className="flex items-center gap-2">
                    <SPAN className="text-sm opacity-70 w-14">#{i + 1}</SPAN>
                    <INPUT
                      type="text"
                      className="flex-1 rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937]"
                      value={item as string}
                      onChange={(e) => updateItem(i, e.target.value)}
                    />
                    <div className="flex gap-1">
                      <BUTTON className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, -1)} type="button">↑</BUTTON>
                      <BUTTON className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, +1)} type="button">↓</BUTTON>
                      <BUTTON className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => removeItem(i)} type="button">✕</BUTTON>
                    </div>
                  </div>
                );
              }

              if (k === 'number') {
                return (
                  <div key={id} className="flex items-center gap-2">
                    <SPAN className="text-sm opacity-70 w-14">#{i + 1}</SPAN>
                    <INPUT
                      type="number"
                      className="flex-1 rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937]"
                      value={item as number}
                      onChange={(e) => updateItem(i, Number(e.target.value))}
                    />
                    <div className="flex gap-1">
                      <BUTTON className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, -1)} type="button">↑</BUTTON>
                      <BUTTON className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, +1)} type="button">↓</BUTTON>
                      <BUTTON className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => removeItem(i)} type="button">✕</BUTTON>
                    </div>
                  </div>
                );
              }

              if (k === 'boolean') {
                return (
                  <div key={id} className="flex items-center gap-2">
                    <SPAN className="text-sm opacity-70 w-14">#{i + 1}</SPAN>
                    <LABEL className="flex items-center gap-2">
                      <INPUT
                        type="checkbox"
                        checked={!!item}
                        onChange={(e) => updateItem(i, e.target.checked)}
                      />
                      <SPAN>Activo</SPAN>
                    </LABEL>
                    <div className="flex gap-1 ml-auto">
                      <BUTTON className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, -1)} type="button">↑</BUTTON>
                      <BUTTON className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, +1)} type="button">↓</BUTTON>
                      <BUTTON className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => removeItem(i)} type="button">✕</BUTTON>
                    </div>
                  </div>
                );
              }

              // objeto o mixto: render recursivo por item
              return (
                <div key={id} className="rounded-xl border border-[#1f2937] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <SPAN className="text-sm opacity-70">Elemento #{i + 1}</SPAN>
                    <div className="flex gap-1">
                      <BUTTON className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, -1)} type="button">↑</BUTTON>
                      <BUTTON className="px-2 py-1 rounded bg-[#111827]" onClick={() => move(i, +1)} type="button">↓</BUTTON>
                      <BUTTON className="px-2 py-1 rounded bg-[#7f1d1d] text-white" onClick={() => removeItem(i)} type="button">✕</BUTTON>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(item || {}).map((subKey) => (
                      <Field
                        key={`${id}-${subKey}`}
                        path={`${path}.${i}.${subKey}`}
                        label={subKey}
                        value={(item as any)[subKey]}
                        onChange={(p, v) => {
                          // delega al padre a través de onChange con setByPath
                          // lo maneja el Field principal
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <SPAN className="opacity-70">Añadir elemento</SPAN>
            <BUTTON className="px-3 py-2 rounded bg-[#2563eb] text-white" onClick={() => addItem(uniform === 'unknown' || uniform === 'mixed' ? 'string' : uniform)} type="button">
              + {uniform === 'unknown' || uniform === 'mixed' ? 'Texto' : uniform}
            </BUTTON>
            {(uniform === 'unknown' || uniform === 'mixed') && (
              <>
                <BUTTON className="px-3 py-2 rounded bg-[#111827]" onClick={() => addItem('number')} type="button">+ Número</BUTTON>
                <BUTTON className="px-3 py-2 rounded bg-[#111827]" onClick={() => addItem('boolean')} type="button">+ Booleano</BUTTON>
                <BUTTON className="px-3 py-2 rounded bg-[#111827]" onClick={() => addItem('object')} type="button">+ Objeto</BUTTON>
              </>
            )}
          </div>
        </>
      )}
    </fieldset>
  );
}

// ----------------- Field genérico (con overrides para PWA) -----------------
function Field({
  path,
  value,
  label,
  onChange,
}: {
  path: string;
  value: any;
  label?: string;
  onChange: (path: string, v: any) => void;
}) {
  const id = `fld-${path.replace(/\./g, '-')}`;

  // --- OVERRIDES: no mostrar JSON para manifest ---
  if (path.endsWith('pwa.icons')) {
    return (
      <fieldset className="rounded-2xl border border-[#1f2937] px-4 py-3 my-3">
        <legend className="px-2 text-sm opacity-80">{label ?? path}</legend>
        <PWAIconsUpload
          value={Array.isArray(value) ? (value as any) : []}
          onChange={(icons) => onChange(path, icons)}
        />
      </fieldset>
    );
  }
  if (path.endsWith('pwa.screenshots')) {
    return (
      <fieldset className="rounded-2xl border border-[#1f2937] px-4 py-3 my-3">
        <legend className="px-2 text-sm opacity-80">{label ?? path}</legend>
        <PWAScreenshotsUpload
          value={Array.isArray(value) ? (value as any) : []}
          onChange={(shots) => onChange(path, shots)}
        />
      </fieldset>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <LABEL className="flex items-center gap-2 py-2">
        <INPUT
          id={id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(path, e.target.checked)}
        />
        <SPAN>{label ?? path}</SPAN>
      </LABEL>
    );
  }

  if (typeof value === 'number') {
    return (
      <div className="flex flex-col gap-1 py-2">
        <LABEL htmlFor={id}>{label ?? path}</LABEL>
        <INPUT
          id={id}
          type="number"
          className="rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937] w-full"
          value={value}
          onChange={(e) => onChange(path, Number(e.target.value))}
        />
      </div>
    );
  }

  if (typeof value === 'string') {
    return (
      <div className="flex flex-col gap-1 py-2">
        <LABEL htmlFor={id}>{label ?? path}</LABEL>
        <INPUT
          id={id}
          type="text"
          className="rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937] w-full"
          value={value}
          onChange={(e) => onChange(path, e.target.value)}
        />
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ArrayField
        path={path}
        label={label}
        value={value}
        onChange={(p, v) => onChange(p, v)}
      />
    );
  }

  if (value && typeof value === 'object') {
    return (
      <fieldset className="rounded-2xl border border-[#1f2937] px-4 py-3 my-3">
        <legend className="px-2 text-sm opacity-80">{label ?? path}</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(value).map((k) => (
            <Field
              key={k}
              path={`${path}.${k}`}
              label={k}
              value={(value as any)[k]}
              onChange={onChange}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      <LABEL htmlFor={id}>{label ?? path} (JSON)</LABEL>
      <textarea
        id={id}
        className="rounded-xl px-3 py-2 bg-[#0f172a] border border-[#1f2937] min-h-24"
        value={JSON.stringify(value ?? null, null, 2)}
        onChange={(e) => {
          try { onChange(path, JSON.parse(e.target.value)); } catch {}
        }}
      />
    </div>
  );
}

/* ======================== BLOQUE MANIFEST (uploader + detección) ======================== */

const _FALLBACK_ICON = "/manifest/default-icon.png";
const FALLBACK_W = "/manifest/default-screenshot-wide.png";
const FALLBACK_N = "/manifest/default-screenshot-narrow.png";
const _bn = (p:string)=>{const f=p.split("/").pop()||"asset"; const i=f.lastIndexOf("."); return i>0?f.slice(0,i):f;}
const _dn = (p:string)=>{const i=p.lastIndexOf("/"); return i>0?p.slice(0,i):""}

// Busca una variante redimensionada (.webp) en los patrones típicos de la extensión
async function _findResizedURL(
  storage: ReturnType<typeof getStorage>,
  o: { outputBase:string; originalDir:string; baseName:string; w:number; h:number }
){
  const dim = `${o.w}x${o.h}`;
  const candidates = [
    `${o.outputBase}/${dim}/${o.baseName}.webp`,     // patrón folder
    `${o.outputBase}/${o.baseName}_${dim}.webp`,     // patrón suffix
    `${o.originalDir}/resized/${dim}/${o.baseName}.webp`,
    `${o.originalDir}/resized/${o.baseName}_${dim}.webp`,
  ];
  for (const p of Array.from(new Set(candidates))) {
    try { return await getDownloadURL(ref(storage, p)); } catch {}
  }
  return "";
}

/* ---- ICONOS (sube a manifest/icons y detecta variantes por listAll) ---- */
type _Icon = { src:string; sizes:string; type:string; purpose:"any"|"maskable" };

const _ICON_SPECS = [48,72,96,128,144,192,256,384,512] as const; // webp fijas
const _MASKABLE = new Set([192,512]); // duplicamos con purpose: 'maskable'

function PWAIconsUpload({
  value,
  onChange,
}:{ value?: _Icon[]; onChange:(v:_Icon[])=>void }) {

  // Asegúrate de que tu app de Firebase esté inicializada antes (si tienes un init, impórtalo arriba)
  const storage = getStorage(); // bucket por defecto del proyecto del cliente
  const OUTPUT_DIR = process.env.NEXT_PUBLIC_MANIFEST_OUTPUT_STORAGE_PATH || "manifest/icons";

  const [file, setFile] = React.useState<File|null>(null);
  const [preview, setPreview] = React.useState<string>(_FALLBACK_ICON);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [lastBase, setLastBase] = React.useState<string>(""); // nombre base del último upload

  // inicial: previsualiza lo que ya esté en FS (si existe) o fallback
  React.useEffect(() => {
    const fromFS = value?.find(v => v.sizes === "192x192" && v.purpose === "any")?.src
                || value?.[0]?.src
                || "";
    setPreview(fromFS || _FALLBACK_ICON);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setMsg("");
    if (f) setPreview(URL.createObjectURL(f));
  };

  // subimos el ORIGINAL directo a manifest/icons conservando el nombre elegido
  async function uploadOriginal() {
    if (!file) { setMsg("Selecciona un icono (png/jpg/svg/webp)."); return; }
    setBusy(true); setMsg("Subiendo icono base…");

    // normaliza extensión a .png si viene .svg/.jpg para que la ext lo procese sin drama
    const originalName = (file.name || "icon.png").replace(/\.(svg|jpeg|jpg|webp)$/i, ".png");
    const base = originalName.replace(/\.[^.]+$/,"");
    setLastBase(base);

    try {
      const r = ref(storage, `${OUTPUT_DIR}/${originalName}`); // ⬅️ mismo folder que vigila tu extensión
      await uploadBytes(r, file, {
        contentType: file.type || "image/png",
        cacheControl: "public, max-age=60",
      });
      setMsg("Icono subido. Buscando variantes…");
      await detectVariants(true, base); // poll hasta que la ext termine
    } catch (e:any) {
      setMsg(`Error subiendo: ${e?.message || "desconocido"}`);
    } finally {
      setBusy(false);
    }
  }

  // lista el folder y arma el array de manifest a partir de nombres *_WxH.webp
  async function detectVariants(poll=false, baseHint?: string) {
    setBusy(true);
    try {
      const base = baseHint || lastBase || inferBaseFromExistingName(value) || "";
      const need = new Set(_ICON_SPECS.map(s => `${s}x${s}`));
      const build = async () => {
        const dirRef = ref(storage, OUTPUT_DIR);
        const l = await listAll(dirRef);
        const icons: _Icon[] = [];
        for (const it of l.items) {
          // buscamos <base>_<WxH>.webp  (ej: NIXINLogo700_192x192.webp)
          const m = it.name.match(new RegExp(`^${base ? base : `(.+?)`}_([0-9]+)x([0-9]+)\\.webp$`));
          if (!m) continue;
          const w = parseInt(m[2] ?? m[1], 10);
          const h = parseInt(m[3] ?? m[2], 10);
          if (Number.isNaN(w) || w !== h) continue;
          if (!_ICON_SPECS.includes(w as any)) continue;

          const url = await getDownloadURL(it);
          const sizes = `${w}x${w}`;
          need.delete(sizes);

          // purpose any
          if (!icons.find(x => x.sizes===sizes && x.purpose==="any")) {
            icons.push({ src: url, sizes, type: "image/webp", purpose: "any" });
          }
          // duplicado maskable (si lo pides para 192/512)
          if (_MASKABLE.has(w) && !icons.find(x => x.sizes===sizes && x.purpose==="maskable")) {
            icons.push({ src: url, sizes, type: "image/webp", purpose: "maskable" });
          }
        }
        return { icons, ready: need.size === 0 };
      };

      if (!poll) {
        const { icons } = await build();
        if (icons.length) onChange(mergeIcons(value||[], icons));
        setMsg(icons.length ? "Variantes detectadas." : "Aún no hay variantes.");
        return;
      }

      // poll simple 30s
      const deadline = Date.now() + 30_000;
      let merged: _Icon[] = value || [];
      while (Date.now() < deadline) {
        const { icons, ready } = await build();
        if (icons.length) {
          merged = mergeIcons(merged, icons);
          onChange(merged); // actualiza SUI sin tocar otras secciones
        }
        if (ready) break;
        await new Promise(r => setTimeout(r, 1500));
      }
      setMsg("Detección finalizada.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <INPUT type="file" accept="image/*" onChange={onPick} />
        <BUTTON onClick={uploadOriginal} disabled={!file || busy}
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50">
          Subir icono
        </BUTTON>
        <BUTTON onClick={() => detectVariants(true)} disabled={busy}
          className="px-3 py-2 rounded bg-slate-700 text-white disabled:opacity-50">
          Detectar variantes
        </BUTTON>
        {busy && <SPAN className="opacity-70">Procesando…</SPAN>}
      </div>

      <div className="flex items-center gap-4">
        <SPAN className="text-xs opacity-70">Preview:</SPAN>
        {preview ? (
          <img src={preview} alt="pwa-icon" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} />
        ) : null}
      </div>

      {msg ? <div className="text-xs opacity-80">{msg}</div> : null}
      <P className="text-[11px] opacity-60">
        Al detectar, este panel setea <code>settings.pwa.icons</code>. Luego dale “Guardar cambios” (usa tu <code>saveSettingsClient</code>) para que pase a FS y se respete la RDD.
      </P>
    </div>
  );
}

// helpers para merge y “adivinar” base desde lo que ya hay en settings
function mergeIcons(prev: _Icon[], found: _Icon[]) {
  const next: _Icon[] = [];
  const key = (i:_Icon)=>`${i.sizes}:${i.purpose}`;
  const seen = new Set<string>();
  for (const i of [...found, ...prev]) {
    const k = key(i); if (seen.has(k)) continue; seen.add(k); next.push(i);
  }
  // ordena por tamaño asc y purpose any -> maskable
  next.sort((a,b)=>{
    const sa=parseInt(a.sizes), sb=parseInt(b.sizes);
    if (sa!==sb) return sa-sb;
    if (a.purpose===b.purpose) return 0;
    return a.purpose==="any" ? -1 : 1;
  });
  return next;
}
function inferBaseFromExistingName(value?: _Icon[]) {
  const src = value?.[0]?.src || "";
  const m = src.match(/\/([A-Za-z0-9._-]+)_(\d+)x(\d+)\.webp/);
  return m ? m[1] : "";
}


/* ---- SCREENSHOTS ---- */
type _Shot = { src:string; sizes:string; type:string; label?:string; form_factor?:"wide"|"narrow" };
const _WIDE = [[1280,720],[1920,1080]] as const;
const _NARR = [[1080,1920],[750,1334]] as const;

function PWAScreenshotsUpload({ value, onChange }:{ value?:_Shot[]; onChange:(v:_Shot[])=>void }) {
  const storage = getStorage();
  const OUT = process.env.NEXT_PUBLIC_MANIFEST_SHOTS_STORAGE_PATH || "manifest/screenshots";
  const ORIG_WIDE   = "manifest/screenshots/wide.png";
  const ORIG_NARROW = "manifest/screenshots/narrow.png";

  const [fileW, setFileW] = React.useState<File|null>(null);
  const [fileN, setFileN] = React.useState<File|null>(null);
  const [pvW, setPvW] = React.useState<string>(FALLBACK_W);
  const [pvN, setPvN] = React.useState<string>(FALLBACK_N);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    const anyW = (value as any[])?.find?.(s => s?.form_factor === "wide")?.src;
    const anyN = (value as any[])?.find?.(s => s?.form_factor === "narrow")?.src;
    if (anyW) setPvW(anyW);
    if (anyN) setPvN(anyN);
  }, [value]);

  // al elegir archivo, usa blob para preview inmediato
  const pickWide: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]; if (f) setPvW(URL.createObjectURL(f));
  };
  const pickNarrow: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]; if (f) setPvN(URL.createObjectURL(f));
  };

  async function upload(kind:"wide"|"narrow") {
    const f = kind==="wide" ? fileW : fileN;
    const path = kind==="wide" ? ORIG_WIDE : ORIG_NARROW;
    if (!f) { setMsg(`Selecciona ${kind}.`); return; }
    setBusy(true); setMsg(`Subiendo ${kind}…`);
    try {
      await uploadBytes(ref(storage, path), f, { contentType: f.type||"image/png", cacheControl:"public, max-age=60" });
      setMsg(`${kind} subido. Buscando variantes…`);
      await detect(true);
    } catch (e:any){ setMsg(`Error ${kind}: ${e?.message||"desconocido"}`); }
    finally { setBusy(false); }
  }

  async function detect(poll=false){
    setBusy(true);
    try{
      const shots:_Shot[] = [];

      const bW=_bn(ORIG_WIDE), dW=_dn(ORIG_WIDE);
      const onceW = async () => {
        for (const [w,h] of _WIDE){
          const url = await _findResizedURL(storage,{ outputBase:OUT, originalDir:dW, baseName:bW, w, h });
          if (!url) continue;
          if (!shots.find(s => s.sizes===`${w}x${h}` && s.form_factor==="wide")){
            shots.push({ src:url, sizes:`${w}x${h}`, type:"image/webp", form_factor:"wide", label:`${w}×${h}` });
          }
        }
      };

      const bN=_bn(ORIG_NARROW), dN=_dn(ORIG_NARROW);
      const onceN = async () => {
        for (const [w,h] of _NARR){
          const url = await _findResizedURL(storage,{ outputBase:OUT, originalDir:dN, baseName:bN, w, h });
          if (!url) continue;
          if (!shots.find(s => s.sizes===`${w}x${h}` && s.form_factor==="narrow")){
            shots.push({ src:url, sizes:`${w}x${h}`, type:"image/webp", form_factor:"narrow", label:`${w}×${h}` });
          }
        }
      };

      const run = async()=>{ await onceW(); await onceN(); };
      if (!poll) await run(); else {
        const deadline = Date.now()+30_000;
        while (Date.now()<deadline){
          await run();
          if (shots.length>=(_WIDE.length+_NARR.length)) break;
          await new Promise(r=>setTimeout(r,1500));
        }
      }

      if (shots.length){
        const prev = value||[];
        const merged:_Shot[] = [];
        const key = (s:_Shot)=>`${s.sizes}:${s.form_factor}`;
        const seen = new Set<string>();
        for (const s of [...shots, ...prev]) { const k=key(s); if (seen.has(k)) continue; seen.add(k); merged.push(s); }
        onChange(merged);
        setMsg("Screenshots listos.");
      } else setMsg("Aún sin variantes.");
    } finally { setBusy(false); }
  }

  const box = (w:number,h:number)=>({ width:240, height:Math.round(240*h/w) });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <LABEL className="text-sm opacity-80">Screenshot <B>wide</B></LABEL>
          <INPUT type="file" accept="image/*" onChange={pickWide} />
          <BUTTON className="px-3 py-2 rounded bg-black text-white disabled:opacity-50" disabled={!fileW||busy} onClick={()=>upload("wide")}>Subir wide</BUTTON>
          <div className="border rounded-lg bg-white overflow-hidden" style={box(1280,720)}>
            {pvW ? <img src={pvW || FALLBACK_W} alt="wide"  style={{width:"100%",height:"100%",objectFit:"cover"}} /> : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <LABEL className="text-sm opacity-80">Screenshot <B>narrow</B></LABEL>
          <INPUT type="file" accept="image/*" onChange={pickNarrow} />
          <BUTTON className="px-3 py-2 rounded bg-black text-white disabled:opacity-50" disabled={!fileN||busy} onClick={()=>upload("narrow")}>Subir narrow</BUTTON>
          <div className="border rounded-lg bg-white overflow-hidden" style={box(1080,1920)}>
            {pvN ? <img src={pvN || FALLBACK_N} alt="narrow" style={{width:"100%",height:"100%",objectFit:"cover"}} /> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <BUTTON className="px-3 py-2 rounded bg-slate-700 text-white disabled:opacity-50" disabled={busy} onClick={()=>detect(true)}>Detectar variantes</BUTTON>
        {busy && <SPAN className="opacity-70">Procesando…</SPAN>}
        {msg && <SPAN className="text-xs opacity-80">{msg}</SPAN>}
      </div>
      <P className="text-[11px] opacity-60">Se actualiza <code>settings.pwa.screenshots</code>.</P>
    </div>
  );
}

/* ======================== FIN BLOQUE MANIFEST ======================== */

// ----------------- Page -----------------
export default function SettingsTab() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<iSettings | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  // --- NUEVO: estado para sync con Google Profile ---
  const [syncing, setSyncing] = React.useState(false);
  const [syncMsg, setSyncMsg] = React.useState<string | null>(null);

  const handleSyncFromGoogleProfile = async () => {
    setSyncing(true);
    setSyncMsg("Sincronizando horarios y datos desde Google…");
    try {
      const res = await fetch("/api/admin/sync-gprofile", {
        method: "POST",
        headers: {
          // misma “llave” que el servidor
          "x-admin-key": process.env.NEXT_PUBLIC_GBP_LOCATION_NAME ?? "",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setSyncMsg("Sincronización completada. Revisa horarios y dirección.");
    } catch (err: any) {
      setSyncMsg(
        `Error al sincronizar: ${err?.message ?? "error desconocido"}`
      );
    } finally {
      setSyncing(false);
    }
  };


  // NUEVO: vista previa por regla (para validar que respeta FS > TSX(FM) > JSON > TSX)
  const [previewProv, setPreviewProv] = React.useState<any | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      // Carga por regla exacta (en settings normalmente == FS > JSON > TSX)
      const { effective, provenance } = await getSettingsEffectiveForUI();
      setData(effective as iSettings);
      setPreviewProv(provenance);
      const defaults: Record<string, boolean> = {};
      Object.keys(effective || {}).forEach((k) => (defaults[k] = true));
      setOpen(defaults);
      setLoading(false);
    })();
  }, []);

  const handleChange = (path: string, v: any) => {
    setData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev ?? {}));
      setByPath(clone, path, v);
      return clone;
    });
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await saveSettingsClient(data);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return <div className="opacity-70">Cargando…</div>;

  const topLevelKeys = Object.keys(data);

  return (
    <div className="relative space-y-6">
      {/* Botón flotante fijo en esquina inferior derecha */}
      <div className="fixed bottom-4 right-4 flex flex-col items-end gap-1 z-50">
        <BUTTON
          type="button"
          className="rounded-full px-4 py-2 text-xs bg-white/90 text-slate-900 shadow-lg shadow-black/40 hover:bg-white disabled:opacity-60"
          onClick={handleSyncFromGoogleProfile}
          disabled={syncing}
        >
          {syncing ? "Sincronizando…" : "Actualizar horarios desde Google"}
        </BUTTON>
        {syncMsg && (
          <SPAN className="mt-1 max-w-xs text-[11px] text-right text-white/80 drop-shadow">
            {syncMsg}
          </SPAN>
        )}
      </div>
      <div className="flex items-center gap-2">
        <H1 className="text-2xl font-semibold">Configuración (Manifiesto PWA)</H1>
        <BUTTON
          type="button"
          className="ml-auto rounded px-3 py-1 text-sm border border-[#1f2937] bg-[#0d1326]"
          onClick={() => setShowPreview(v => !v)}
        >
          {showPreview ? 'Ocultar vista previa' : 'Ver provenance efectivo'}
        </BUTTON>
      </div>

      {showPreview && (
        <details open className="rounded-lg border border-[#1f2937] bg-[#0b1220]">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium bg-[#0d1326]">
            Vista previa (provenance) — Regla: FS &gt; TSX(FM) &gt; JSON &gt; TSX
          </summary>
          <div className="px-4 pb-4 pt-2">
            <pre className="whitespace-pre-wrap text-[11px] opacity-80">
{JSON.stringify(previewProv ?? {}, null, 2)}
            </pre>
          </div>
        </details>
      )}

      {topLevelKeys.map((k) => {
        const label = SECTION_LABELS[k] ?? k;
        const sectionValue = (data as any)[k];
        const isOpen = !!open[k];

        return (
          <details
            key={k}
            open={isOpen}
            onToggle={(e) =>
              setOpen((prev) => ({ ...prev, [k]: (e.target as HTMLDetailsElement).open }))
            }
            className="rounded-2xl border border-[#1f2937] bg-[#0b1220] overflow-hidden"
          >
            <summary className="cursor-pointer select-none px-4 py-3 text-lg font-medium bg-[#0d1326]">
              {label}
            </summary>
            <div className="px-4 pb-4 pt-2">
              <Field path={k} value={sectionValue} label={label} onChange={handleChange} />
            </div>
          </details>
        );
      })}

      <div className="flex gap-3">
        <BUTTON
          className="rounded-xl px-4 py-2 bg-[#2563eb] text-white disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </BUTTON>
      </div>
    </div>
  );
}
