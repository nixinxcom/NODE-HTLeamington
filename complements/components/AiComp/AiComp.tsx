'use client';

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from 'react';
import s from './AiComp.module.css';

import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FbDB, FbStorage } from '@/app/lib/services/firebase';

import { renderWithLinks } from '@/app/lib/ui/linkify';

import { getSettingsEffective } from '@/complements/data/settingsFS';
import { getBrandingEffectivePWA } from '@/complements/data/brandingFS';

import { usePathname } from 'next/navigation';
import { useIntl } from 'react-intl';
import FM from '@/complements/i18n/FM';

import { resolveFMToStrings } from '@/complements/utils/resolveFM';
import { getI18nEffective } from '@/complements/data/i18nFS';
import { toShortLocale, DEFAULT_LOCALE_SHORT } from '@/app/lib/i18n/locale';
import { useAppContext } from '@/context/AppContext';
import { Settings } from 'lucide-react';

// ===== Caché por sesión (solo pestaña abierta) =====
const SS = typeof window !== 'undefined' ? window.sessionStorage : null;
function ssGet<T = any>(k: string): T | null {
  try { return SS ? JSON.parse(SS.getItem(k) || 'null') : null; } catch { return null; }
}
function ssSet(k: string, v: any) {
  try { SS?.setItem(k, JSON.stringify(v)); } catch {}
}
function ssDel(k: string) { try { SS?.removeItem(k); } catch {} }

// ===== Telemetría por sesión =====
const TELEMETRY_KEY = 'aai.telemetry';
function pushTelemetry(e: Record<string, any>) {
  const arr = ssGet<any[]>(TELEMETRY_KEY) || [];
  arr.push({ ...e, ts: Date.now() });
  ssSet(TELEMETRY_KEY, arr);
}
function flushTelemetry() {
  const arr = ssGet<any[]>(TELEMETRY_KEY) || [];
  if (!arr.length) return;

  let sent = false;
  try {
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      sent = (navigator as any).sendBeacon('/api/log-aai', JSON.stringify(arr));
    }
  } catch {}

  if (!sent) {
    try {
      // Fallback con keepalive (por si Beacon no está disponible o falla)
      fetch('/api/log-aai', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(arr),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  ssDel(TELEMETRY_KEY);
}

// ==== tipos mínimos ====
type AgentCfg = {
  displayName: string;
  welcome?: string;
  domain: string;
  languages: string[];
  showLeadForm: boolean;
  openai: { model: string; temperature: number; max_tokens: number };
  assets: { avatarPath: string; fabIconPath: string };
  params: Record<string, any>;
};

type AiCompProps = {
  locale?: string;
  OpenAIConfigAgentId?: string;
};

// ===== idioma (persistencia/local) =====
const LS_LANG = 'aai.lang';
function shortFromLocale(l: string): 'es' | 'en' | 'fr' {
  const low = (l || 'es').toLowerCase();
  if (low.startsWith('en')) return 'en';
  if (low.startsWith('fr')) return 'fr';
  return 'es';
}
function fullFromShort(s: 'es' | 'en' | 'fr'): 'es' | 'en' | 'fr' {
  return s === 'en' ? 'en' : s === 'fr' ? 'fr' : 'es';
}
function detectLangClient(text: string): 'es' | 'en' | 'fr' {
  const t = (text || '').toLowerCase();
  const score = { es: 0, en: 0, fr: 0 } as Record<'es'|'en'|'fr', number>;
  ' el la los las un una de y que para en con hola gracias ¿ ¡ á é í ó ú ñ '
    .trim().split(/\s+/).forEach(w => { if (t.includes(w)) score.es++; });
  ' the and of to for in hello hi thanks you your is are '
    .trim().split(/\s+/).forEach(w => { if (t.includes(w)) score.en++; });
  ' le la les des et pour bonjour merci vous votre êtes '
    .trim().split(/\s+/).forEach(w => { if (t.includes(w)) score.fr++; });
  const max = (Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0] || 'es') as 'es'|'en'|'fr';
  return max;
}

// ===== helpers para cortar branding por paths "a.b.c" =====
const getByPath = (obj: any, path: string) =>
  path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

const buildContextSlice = (doc: any, paths: string | string[]) => {
  const list = Array.isArray(paths) ? paths : [paths];
  const out: Record<string, any> = {};
  if (!doc) return out;
  for (const p of list) {
    const val = getByPath(doc, p);
    if (val !== undefined) out[p] = val;
  }
  return out;
};

export default function AiComp(props: AiCompProps) {
  const intl = useIntl();
  const { Branding, Settings } = useAppContext();

  // ===== Locale activo (prop → URL → navegador) =====
  const pathname = usePathname();
  const urlSegment = useMemo(() => {
    if (!pathname) return undefined;
    const seg = pathname.split('/').filter(Boolean)[0]; // /es, /en, /fr...
    return seg;
  }, [pathname]);

  const fallback = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || DEFAULT_LOCALE_SHORT;

  const initialLocale =
    props.locale ||
    (urlSegment && (urlSegment === 'es' || urlSegment === 'en' || urlSegment === 'fr' ? urlSegment : undefined)) ||
    (typeof navigator !== 'undefined' ? navigator.language : fallback);

  const initialShort = shortFromLocale(initialLocale);
  const [lang, setLang] = useState<'es' | 'en' | 'fr'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LS_LANG) as 'es' | 'en' | 'fr' | null;
      if (saved === 'es' || saved === 'en' || saved === 'fr') return saved;
    }
    return initialShort;
  });
  useEffect(() => {
    const next = shortFromLocale(initialLocale);
    if (next !== lang) setLang(next);
  }, [initialLocale]);
  const activeLocale = toShortLocale(lang);
  const [dict, setDict] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    getI18nEffective(activeLocale).then(d => { if (alive) setDict(d || {}); });
    return () => { alive = false; };
  }, [activeLocale]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(LS_LANG, lang);
  }, [lang]);

  const [open, setOpen] = useState(false);

  // Firestore agent + assets
  const [cfg, setCfg] = useState<AgentCfg | null>(null);
  const [avatar, setAvatar] = useState<string>('/Icons/ClustersIconMap.png');
  const [fabIcon, setFabIcon] = useState<string>('/Icons/NIXINIcon.png');

  // RDD
  const [settingsFS, setSettingsFS] = useState<any | null>(null);
  const [brandingFS, setBrandingFS] = useState<any | null>(null);

  const brandingStr = useMemo(
    () => (brandingFS ? resolveFMToStrings(brandingFS, dict) : null),
    [brandingFS, dict]
  );
  // Settings con FMs resueltos al locale vigente
  const settingsStr = useMemo(
    () => (settingsFS ? resolveFMToStrings(settingsFS, dict) : null),
    [settingsFS, dict]
  );

  // Chat state
  const [msgs, setMsgs] = useState<{ from: 'user' | 'bot'; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [lead, setLead] = useState({ name: '', email: '', consent: false, sent: false });

  // ===== RDD: settings efectivos (FS → sesión; se invalida al cerrar pestaña) =====
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const short = lang; // 'es' | 'en' | 'fr'
        const SKEY = `aai:settings:${short}`;
        // 1) pinta rápido si hay caché de esta sesión
        const cached = ssGet(SKEY);
        if (cached && alive) setSettingsFS(cached);
        // 2) lectura FRESCA de FS al abrir / cambiar de locale
        const eff = await getSettingsEffective(undefined, short);
        if (!alive) return;
        setSettingsFS(eff);
        ssSet(SKEY, eff);
      } catch (e) {
        console.error('getSettingsEffective() failed', e);
      }
    })();
    return () => { alive = false; };
  }, [lang]);


  // ===== RDD: branding efectivo (FS → sesión; se invalida al cerrar pestaña) =====
  useEffect(() => {
    let alive = true;
    (async () => {
      const short = lang;
      const BKEY = `aai:branding:${short}`;
      try {
        // 1) pinta rápido si hay caché de esta sesión
        const cached = ssGet(BKEY);
        if (cached && alive) setBrandingFS(cached);

        // 2) lectura FRESCA de FS al abrir / cambiar de locale
        let doc: any | null = null;
        try {
          doc = await getBrandingEffectivePWA(short);
        } catch {
          doc = await getBrandingEffectivePWA(fullFromShort(short));
        }
        if (!alive || !doc) return;
        setBrandingFS(doc);
        ssSet(BKEY, doc);
      } catch (e) {
        console.error('getBrandingEffectivePWA() failed', e);
      }
    })();
    return () => { alive = false; };
  }, [lang]);

  const indiceAI = useMemo(() => settingsFS?.agentAI?.indiceAI || {}, [settingsFS]);

  // ===== autoscroll =====
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const computeAtBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
  }, []);
  const updateAtBottom = useCallback(() => {
    const atBottom = computeAtBottom();
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  }, [computeAtBottom]);
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
  }, []);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    updateAtBottom();
    el.addEventListener('scroll', updateAtBottom, { passive: true } as any);
    return () => el.removeEventListener('scroll', updateAtBottom as any);
  }, [updateAtBottom]);
  useLayoutEffect(() => { if (isAtBottomRef.current) scrollToBottom(true); }, [msgs, typing, scrollToBottom]);
  // Enviar telemetría al cerrar pestaña / ocultar
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushTelemetry(); };
    const onBeforeUnload = () => flushTelemetry();
    window.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      flushTelemetry(); // por si desmonta el componente
    };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { if (isAtBottomRef.current) scrollToBottom(false); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollToBottom]);

  // ===== carga de agent (Firestore) + assets (Storage) =====
  const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || "default";
  useEffect(() => {
    (async () => {
      let merged: AgentCfg = {
        displayName: '',
        welcome: undefined,
        domain: '',
        languages: ['es', 'en', 'fr'],
        showLeadForm: false,
        openai: { model: 'gpt-5-nano', temperature: 0.7, max_tokens: 500 },
        assets: {
          avatarPath: 'Agents/default/assets/avatar_700x700.webp',
          fabIconPath: 'Agents/default/assets/fab_700x700.webp',
        },
        params: {},
      };

      try {
        const snap = await getDoc(doc(FbDB, 'ai_agents', AGENT_ID));
        if (snap.exists()) {
          const data = snap.data() as Partial<AgentCfg>;
          merged = {
            displayName: data.displayName || merged.displayName,
            welcome: data.welcome || merged.welcome,
            domain: data.domain || merged.domain,
            languages: Array.isArray(data.languages) ? data.languages : merged.languages,
            showLeadForm: !!data.showLeadForm,
            openai: { ...merged.openai, ...(data.openai || {}) },
            assets: {
              avatarPath: data?.assets?.avatarPath || merged.assets.avatarPath,
              fabIconPath: data?.assets?.fabIconPath || merged.assets.fabIconPath,
            },
            params: data.params || {},
          };
        }
      } catch { /* keep defaults */ }

      setCfg(merged);

      // assets desde Storage
      try {
        const url = await getDownloadURL(storageRef(FbStorage, merged.assets.avatarPath));
        setAvatar(url);
      } catch { /* usa default */ }
      try {
        const url2 = await getDownloadURL(storageRef(FbStorage, merged.assets.fabIconPath));
        setFabIcon(url2);
      } catch { /* usa default */ }

      // bienvenida (FM si RDD no trae)
      const welcomeText =
        typeof merged.welcome === 'string' && merged.welcome.trim()
          ? merged.welcome
          : intl.formatMessage({ id: 'aai.welcome', defaultMessage: '¡Hola! ¿En qué puedo ayudarte hoy?' });
      setMsgs([{ from: 'bot', text: welcomeText }]);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [AGENT_ID, intl, lang]);

  // ===== envío libre =====
  async function send() {
    const text = input.trim();
    if (!text) return;

    setMsgs(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setTyping(true);

    try {
      const msgLang = detectLangClient(text);
      if (msgLang !== lang) setLang(msgLang);
      const sendLocale = fullFromShort(msgLang);
      const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': sendLocale },
        body: JSON.stringify({
          userMessage: text,
          message: text,       // compat
          locale: sendLocale,
          indiceAI,            // catálogo para decisión en backend
        }),
      });

      const json = await res.json().catch(() => ({} as any));
      const latency = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
      pushTelemetry({
        kind: 'free',
        topic: json?.topic || null,
        ok: !!json?.ok,
        latency,
        status: res.status,
        // Si en el futuro devuelves usage desde backend, se rellenan:
        tokensIn: json?.usage?.prompt_tokens ?? null,
        tokensOut: json?.usage?.completion_tokens ?? null,
      });

      if (!res.ok || json?.ok === false) {
        const msg = json?.error ? String(json.error) : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      setMsgs(prev => [...prev, { from: 'bot', text: String(json?.reply ?? json?.message ?? '') }]);
    } catch (e: any) {
      setMsgs(prev => [...prev, { from: 'bot', text: `⚠️ ${String(e?.message || e)}` }]);
    } finally {
      setTyping(false);
    }
  }

  // 1) raw desde settings *resuelto* (ya traducido si hay FMs)
  const shortcutsRaw = useMemo(() => {
    const sc = settingsStr?.agentAI?.shortcuts;
    return Array.isArray(sc) ? sc : (Array.isArray(sc?.items) ? sc.items : sc) || [];
  }, [settingsStr]);

  // ===== click en shortcut: enviar SOLO el slice del branding =====
  const handleShortcut = async (payload: { text?: string; context?: any; meta?: any; paths?: string[] }) => {
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (payload?.meta?.label) {
      setMsgs(prev => [...prev, { from: 'user', text: String(payload.meta.label) }]);
    }
    setTyping(true);

    try {
      const paths = (payload as any)?.meta?.paths || payload?.paths || [];
      const brandDoc = brandingStr ?? brandingFS;
      const ctx =
        payload.context ??
        (brandDoc && paths.length ? buildContextSlice(brandDoc, paths as string[]) : undefined);

      const sendLocale = fullFromShort(lang);
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': sendLocale },
        body: JSON.stringify({
          userMessage:
            payload.text ||
            intl.formatMessage({ id: 'aai.query.useContext', defaultMessage: 'Responde basado SOLO en el contexto adjunto.' }),
          message:
            payload.text ||
            intl.formatMessage({ id: 'aai.query.useContext', defaultMessage: 'Responde basado SOLO en el contexto adjunto.' }),
          locale: sendLocale,
          context: ctx || {},
          indiceAI,
          meta: payload.meta || { source: 'shortcut', paths },
        }),
      });

      const json = await res.json().catch(() => ({} as any));
      const latency = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);
      pushTelemetry({
        kind: 'shortcut',
        topic: json?.topic || null,
        ok: !!json?.ok,
        latency,
        status: res.status,
        // opcional: qué rutas slice usamos
        paths,
        tokensIn: json?.usage?.prompt_tokens ?? null,
        tokensOut: json?.usage?.completion_tokens ?? null,
      });
      if (!res.ok || json?.ok === false) {
        const msg = json?.error ? String(json.error) : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      setMsgs(prev => [...prev, { from: 'bot', text: String(json?.reply ?? json?.message ?? '') }]);
    } catch (e: any) {
      setMsgs(prev => [...prev, { from: 'bot', text: `⚠️ ${String(e?.message || e)}` }]);
    } finally {
      setTyping(false);
    }
  };

  // ===== Lead form =====
  async function submitLead() {
    if (!lead.name || !lead.email || !lead.consent) return;
    const id = cryptoRandomId();
    await setDoc(doc(FbDB, 'ai_contacts', id), {
      name: lead.name, email: lead.email, consent: true, createdAt: serverTimestamp(),
    });
    setLead(prev => ({ ...prev, sent: true }));
  }

  // UI i18n
  const placeholderText = intl.formatMessage({ id: 'aai.ui.placeholder', defaultMessage: 'Escribe tu mensaje…' });
  const sendLabel = intl.formatMessage({ id: 'aai.ui.send', defaultMessage: 'Enviar' });
  const titleText =
    cfg?.displayName?.trim()
      ? cfg.displayName
      : Branding.agentAI?.name;

  return (
    <div className={s.container}>
      {/* FAB */}
      {!open && (
        <button className={s.fab} onClick={() => setOpen(true)} aria-label="Open AI Agent">
          <img src={avatar} alt="AI" className={s.fabImg} />
        </button>
      )}

      {open && (
        <div className={`${s.panel} ${open ? s.panelOpen : ''}`}>
          <div className={s.header}>
            <img className={s.brand} src={fabIcon} alt="brand" />
            <div className={s.title}>{titleText}</div>
            <button
              className={s.close}
              onClick={() => { flushTelemetry(); setOpen(false); }}
              aria-label="Close"
            >✕</button>
          </div>

          {/* Lead form opcional */}
          {cfg?.showLeadForm && !lead.sent && (
            <div className={s.lead}>
              <input
                className={s.input}
                placeholder={intl.formatMessage({ id: 'aai.ui.name', defaultMessage: 'Nombre' })}
                value={lead.name}
                onChange={e => setLead({ ...lead, name: e.target.value })}
              />
              <input
                className={s.input}
                placeholder="email@example.com"
                value={lead.email}
                onChange={e => setLead({ ...lead, email: e.target.value })}
              />
              <label className={s.leadConsent}>
                <input
                  type="checkbox"
                  checked={lead.consent}
                  onChange={e => setLead({ ...lead, consent: e.target.checked })}
                />
                <span><FM id="aai.ui.consent" defaultMessage="Acepto" /></span>
              </label>
              <button className={s.btnAccent} onClick={submitLead}>
                <FM id="aai.ui.send" defaultMessage="Enviar" />
              </button>
            </div>
          )}

          {/* Mensajes */}
          <div className={s.body} ref={listRef}>
            {msgs.map((m, i) => (
              <div key={i} className={m.from === 'user' ? s.msgUser : s.msgBot}>
                {m.from === 'bot' && <img className={s.msgAvatar} src={avatar} alt="" aria-hidden />}
                <div className={s.msgBubble}>
                  <span className={s.messageText}>{renderWithLinks(m.text ?? '')}</span>
                </div>
              </div>
            ))}
            {typing && (
              <div className={s.msgBot}>
                <img className={s.msgAvatar} src={avatar} alt="" aria-hidden />
                <div className={`${s.msgBubble} ${s.typing}`}>
                  <span className={s.dot}></span>
                  <span className={s.dot}></span>
                  <span className={s.dot}></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className={s.inputBar}>
            <input
              className={s.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={placeholderText}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            />
            <button className={s.btnPrimary} onClick={send}>
              {sendLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function cryptoRandomId() {
  if (typeof window !== 'undefined' && 'crypto' in window && 'getRandomValues' in crypto) {
    const buf = new Uint8Array(8); crypto.getRandomValues(buf);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2, 10);
}
