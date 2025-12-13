'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, addDoc, getDocs, updateDoc, deleteDoc,  } from 'firebase/firestore';
import { FbDB } from '@/app/lib/services/firebase';
import type { Agreement, Contracted } from '@/app/lib/agreements/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import FM from '../i18n/FM';
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import SuperAdminOnly from './SuperAdminOnly';

// ── helpers ───────────────────────────────────────────────────────────────────
const emailsFromText = (txt: string) =>
  String(txt || '')
    .split(/[,\s;]+/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

function brandToCamelId(brand: string): string {
  const words = String(brand || '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/);
  if (!words.length) return '';
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

function tsFromDateInput(v: string): Timestamp | null {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}
function dateInputFromTs(t: Timestamp | null | undefined) {
  if (!t) return '';
  const d = t.toDate();
  // yyyy-mm-dd
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const defaultContracted: Contracted = {
  adminPanel: false,
  adminzone: true,
  adsense: true,
  advisory: true,
  agentAI: true,
  analitics: true,
  booking: true,
  branding: true,
  contact: true,
  ecommerce: true,
  geolocation: true,
  maps: true,
  notifications: true,
  payments: true,
  products: true,
  sellsplatforms: true,
  services: true,
  settings: true,
  socialmedia: true,
  styles: true,
  website: true,
};

const emptyAgreement: Agreement = {
  BrandName: '',
  LegalName: '',
  admins: [],
  domain: '',
  contracted: { ...defaultContracted },
  license: {
    active: true,
    clientid: '',
    expiredate: null,
    selfservice: true,
    suspended: false,
  },
};

// ── componente ────────────────────────────────────────────────────────────────
export default function AgreementTab() {
  const [form, setForm] = useState<Agreement>({ ...emptyAgreement });
  const [adminsText, setAdminsText] = useState(''); // text area → lista
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<null | 'new' | 'existing'>(null);
  const [status, setStatus] = useState<string>('');

  const docId = useMemo(() => brandToCamelId(form.BrandName), [form.BrandName]);

  // Cargar si el BrandName coincide con un doc existente
  useEffect(() => {
    if (!docId) {
      setLoaded(null);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        const snap = await getDoc(doc(FbDB, 'agreements', docId));
        if (!snap.exists() || ignore) {
          setLoaded('new');
          return;
        }
        const data = snap.data() as Agreement;
        if (ignore) return;
        setForm({
          ...emptyAgreement,
          ...data,
          contracted: { ...defaultContracted, ...(data.contracted || {}) },
        });
        setAdminsText((data.admins || []).join(', '));
        setLoaded('existing');
      } catch {
        setLoaded(null);
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const onToggle = (key: keyof Contracted) =>
    setForm(prev => ({ ...prev, Contracted: { ...prev.contracted, [key]: !prev.contracted[key] } }));

  async function onSave() {
    setStatus('');
    if (!docId) {
      setStatus('⚠️ Escribe un BrandName válido.');
      return;
    }
    if (!form.domain) {
      setStatus('⚠️ Escribe un dominio.');
      return;
    }
    setLoading(true);
    try {
      const payload: Agreement = {
        ...form,
        admins: emailsFromText(adminsText),
        license: {
          ...form.license,
          // asegurar tipo Timestamp
          expiredate: form.license.expiredate ?? null,
        },
      };

      // agreements/{docId}
      await setDoc(
        doc(FbDB, 'agreements', docId),
        {
          ...payload,
          createdAt: (loaded === 'existing' ? undefined : serverTimestamp()),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // tenants_hosts/{domain}  → { tenantId }
      if (form.domain) {
        await setDoc(
          doc(FbDB, 'tenants_hosts', form.domain.toLowerCase()),
          { tenantId: docId, updatedAt: serverTimestamp() },
          { merge: true }
        );
      }

      setStatus('✅ Guardado.');
      setLoaded('existing');
    } catch (e: any) {
      setStatus(`❌ Error: ${String(e?.message || e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SuperAdminOnly>
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <H1 className="text-2xl font-semibold">Agreement Editor</H1>
        <P className="text-sm text-gray-500">Colección: <code>agreements</code> · DocID (auto): <code>{docId || '—'}</code></P>

        {/* Identidad */}
        <section className="space-y-3">
          <H2 className="font-medium">Identidad</H2>
          <LABEL className="block">
            <SPAN className="text-sm">BrandName</SPAN>
            <INPUT
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.BrandName}
              onChange={e => setForm(v => ({ ...v, BrandName: e.target.value }))}
              placeholder="Nombre Comercial"
            />
          </LABEL>
          <LABEL className="block">
            <SPAN className="text-sm">LegalName</SPAN>
            <INPUT
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.LegalName}
              onChange={e => setForm(v => ({ ...v, LegalName: e.target.value }))}
              placeholder="Nombre Legal"
            />
          </LABEL>
          <LABEL className="block">
            <SPAN className="text-sm">Domain</SPAN>
            <INPUT
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.domain}
              onChange={e => setForm(v => ({ ...v, domain: e.target.value.trim().toLowerCase() }))}
              placeholder="dominio.com"
            />
          </LABEL>
          <LABEL className="block">
            <SPAN className="text-sm">Admins (coma o salto de línea)</SPAN>
            <textarea
              className="mt-1 w-full rounded border px-3 py-2 h-24"
              value={adminsText}
              onChange={e => setAdminsText(e.target.value)}
              placeholder="admin@dominio.com, otro@dominio.com"
            />
          </LABEL>
        </section>

        {/* Contracted */}
        <section className="space-y-2">
          <H2 className="font-medium">Contracted</H2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.keys(form.contracted) as (keyof Contracted)[]).map(k => (
              <LABEL key={String(k)} className="inline-flex items-center gap-2">
                <INPUT
                  type="checkbox"
                  checked={!!form.contracted[k]}
                  onChange={() => onToggle(k)}
                />
                <SPAN className="text-sm">{String(k)}</SPAN>
              </LABEL>
            ))}
          </div>
        </section>

        {/* Licencia */}
        <section className="space-y-3">
          <H2 className="font-medium">License</H2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <LABEL className="block">
              <SPAN className="text-sm">Active</SPAN>
              <INPUT
                type="checkbox"
                className="ml-2"
                checked={form.license.active}
                onChange={e => setForm(v => ({ ...v, license: { ...v.license, active: e.target.checked } }))}
              />
            </LABEL>

            <LABEL className="block">
              <SPAN className="text-sm">Self Service</SPAN>
              <INPUT
                type="checkbox"
                className="ml-2"
                checked={form.license.selfservice}
                onChange={e => setForm(v => ({ ...v, license: { ...v.license, selfservice: e.target.checked } }))}
              />
            </LABEL>

            <LABEL className="block">
              <SPAN className="text-sm">Suspended</SPAN>
              <INPUT
                type="checkbox"
                className="ml-2"
                checked={form.license.suspended}
                onChange={e => setForm(v => ({ ...v, license: { ...v.license, suspended: e.target.checked } }))}
              />
            </LABEL>
          </div>

          <LABEL className="block">
            <SPAN className="text-sm">Client ID</SPAN>
            <INPUT
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.license.clientid}
              onChange={e => setForm(v => ({ ...v, license: { ...v.license, clientid: e.target.value } }))}
              placeholder="73onfo8yqiouhwp9f58ehw"
            />
          </LABEL>

          <LABEL className="block">
            <SPAN className="text-sm">Expire Date</SPAN>
            <INPUT
              type="date"
              className="mt-1 rounded border px-3 py-2"
              value={dateInputFromTs(form.license.expiredate)}
              onChange={e => setForm(v => ({ ...v, license: { ...v.license, expiredate: tsFromDateInput(e.target.value) } }))}
            />
          </LABEL>
        </section>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <BUTTON
            className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
            disabled={loading || !docId}
            onClick={onSave}
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </BUTTON>
          {status && <SPAN className="text-sm">{status}</SPAN>}
        </div>

        {loaded === 'existing' && (
          <P className="text-xs text-gray-500">
            Documento existente cargado desde <code>agreements/{docId}</code>.
          </P>
        )}
      </div>
    </SuperAdminOnly>
  );
}