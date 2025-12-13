'use client';
import { useEffect, useMemo, useState } from 'react';
import { envSchema, envMeta, type iEnvVars } from '../../app/lib/env';
import { FbDB, FbAuth } from '../../app/lib/services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { resolveTenantFromHost } from '../../app/lib/tenant/resolve';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import SuperAdminOnly from './SuperAdminOnly';

// En UI todo se maneja como string
type EnvValues = Partial<Record<keyof iEnvVars, string>>;

// Precarga segura desde process.env (solo NEXT_PUBLIC_* y, si decides, NIXINX_LICENSE_TOKEN)
async function fetchCurrentEnv(): Promise<EnvValues> {
  try {
    const r = await fetch('/api/env/resolve');
    if (!r.ok) return {};
    const j = await r.json();
    return j as EnvValues;
  } catch {
    return {};
  }
}

export default function EnvWizard() {
  const [values, setValues] = useState<EnvValues>({});
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const tenant = useMemo(
    () =>
      resolveTenantFromHost(
        typeof window !== 'undefined' ? window.location.host : undefined
      ),
    []
  );

  // Carga inicial (process.env via /api/env/resolve)
  useEffect(() => {
    fetchCurrentEnv().then((v) => setValues(v || {}));
  }, []);

  // Keys requeridas según el schema
  const shape = (envSchema as any).shape as Record<string, unknown>;
  const requiredKeys = Object.keys(shape) as (keyof iEnvVars)[];

  function setVal(k: string, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  function addExtra() {
    const k = prompt('Nombre de variable (MAYUS, _ permitido)');
    if (!k) return;
    if ((requiredKeys as string[]).includes(k)) {
      alert('Ya existe como requerida.');
      return;
    }
    setExtra((e) => ({ ...e, [k]: '' }));
  }

  function rmExtra(k: string) {
    setExtra(({ [k]: _, ...rest }) => rest);
  }

  async function save() {
    setBusy(true);
    try {
      // 1) Validar/parsear -> acepta strings (usa coerce/transform en el schema)
      const parsed = envSchema.parse(values);

      // 2) Serializar TODO a string para guardar y respaldar
      const envAllStrings = Object.fromEntries(
        Object.entries({ ...parsed, ...extra })
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, typeof v === 'string' ? v : String(v)])
      ) as Record<string, string>;

      // 3) Auth anónima si rules lo requieren
      if (!FbAuth.currentUser) {
        const { ensureAnon } = await import('@/app/lib/services/firebase');
        await ensureAnon();
      }

      // 4) Persistencia por tenant
      const now = Date.now();
      const base = `tenants/${tenant}/private/env`;

      await setDoc(
        doc(FbDB, `${base}/current`),
        { env: envAllStrings, updatedAt: serverTimestamp(), ts: now },
        { merge: true }
      );

      await setDoc(
        doc(FbDB, `${base}/versions/${now}`),
        { env: envAllStrings, createdAt: serverTimestamp(), ts: now }
      );

      // 5) Backup write-only, append-only en FS del Core
      try {
        await fetch('/api/env/backup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ tenant, env: envAllStrings, versionTs: now }),
        });
      } catch {
        // opcional: log
      }

      alert('ENV guardadas y registradas.');
    } catch (e: any) {
      alert(`Error: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SuperAdminOnly>
      <section className="grid gap-6">
        <header className="space-y-1">
          <H2 className="text-xl font-semibold">Variables de Entorno</H2>
          <P className="text-sm text-muted-foreground">
            Requeridas por el Core. Las que comienzan con <code>NEXT_PUBLIC_</code>{' '}
            pueden mostrarse en UI; otras se tratan como secretas.
          </P>
        </header>

        <div className="grid gap-4">
          {requiredKeys.map((k) => {
            const meta = (envMeta as any)[k] as
              | { label?: string; placeholder?: string; doc?: string; secret?: boolean }
              | undefined;
            const label = meta?.label || (k as string);
            const placeholder = meta?.placeholder || '';
            const docUrl = meta?.doc;
            const secret = Boolean(meta?.secret) && !String(k).startsWith('NEXT_PUBLIC_');

            return (
              <LABEL key={String(k)} className="grid gap-2">
                <SPAN className="text-sm font-medium">
                  {label} <code className="opacity-70">({String(k)})</code>
                  {docUrl ? (
                    <>
                      {' '}
                      —{' '}
                      <a className="underline" href={docUrl} target="_blank" rel="noreferrer">
                        guía
                      </a>
                    </>
                  ) : null}
                </SPAN>
                <INPUT
                  type={secret ? 'password' : 'text'}
                  autoComplete="off"
                  className="border rounded px-3 py-2"
                  placeholder={placeholder}
                  value={(values[k] as string) ?? ''}
                  onChange={(e) => setVal(String(k), e.target.value)}
                />
              </LABEL>
            );
          })}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <H3 className="font-medium">Variables adicionales (opcionales)</H3>
            <BUTTON onClick={addExtra} className="px-3 py-1 rounded border">
              Añadir
            </BUTTON>
          </div>

          {Object.entries(extra).map(([k, v]) => (
            <div key={k} className="flex gap-2 items-center">
              <code className="min-w-56">{k}</code>
              <INPUT
                className="flex-1 border rounded px-3 py-2"
                value={v}
                onChange={(e) => setExtra((s) => ({ ...s, [k]: e.target.value }))}
              />
              <BUTTON onClick={() => rmExtra(k)} className="px-2 py-1 border rounded">
                Eliminar
              </BUTTON>
            </div>
          ))}
        </div>

        <div>
          <BUTTON
            disabled={busy}
            onClick={save}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {busy ? 'Guardando…' : 'Guardar ENV'}
          </BUTTON>
        </div>
      </section>
    </SuperAdminOnly>
  );
}
