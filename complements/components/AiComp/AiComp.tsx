//complements\components\AiComp\AiComp.tsx
'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import s from './AiComp.module.css';

import { useIntl } from 'react-intl';
import { renderWithLinks } from '@/app/lib/ui/linkify';

import { useFdvData } from '@/app/providers/FdvProvider';
import { PANEL_SCHEMAS } from '@/complements/factory/panelSchemas';

import { BUTTON, INPUT, SPAN } from "@/complements/components/ui/wrappers";

/* ╔══════════════════════════════════════════╗
   ║           TELEMETRÍA POR SESIÓN          ║
   ╚══════════════════════════════════════════╝ */

const SS: Storage | null =
  typeof window !== 'undefined' ? window.sessionStorage : null;

function ssGet<T = any>(k: string): T | null {
  try {
    return SS ? JSON.parse(SS.getItem(k) || 'null') : null;
  } catch {
    return null;
  }
}

function ssSet(k: string, v: any) {
  try {
    SS?.setItem(k, JSON.stringify(v));
  } catch {
    // ignore
  }
}

function ssDel(k: string) {
  try {
    SS?.removeItem(k);
  } catch {
    // ignore
  }
}

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
      sent = (navigator as any).sendBeacon(
        '/api/log-aai',
        JSON.stringify(arr),
      );
    }
  } catch {
    // ignore
  }

  if (!sent) {
    try {
      fetch('/api/log-aai', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(arr),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  ssDel(TELEMETRY_KEY);
}

/* ╔══════════════════════════════════════════╗
   ║         DETECCIÓN SIMPLE DE IDIOMA       ║
   ╚══════════════════════════════════════════╝ */

type ShortLang = 'es' | 'en' | 'fr';

function normalizeShortLocale(l: string | undefined | null): ShortLang {
  const low = String(l || 'es').toLowerCase();
  if (low.startsWith('en')) return 'en';
  if (low.startsWith('fr')) return 'fr';
  return 'es';
}

/** Heurística ligera basada en el texto del usuario */
function detectLangClient(text: string): ShortLang {
  const t = (text || '').toLowerCase();
  let es = 0, en = 0, fr = 0;

  if (/[¿¡ñáéíóú]/.test(t)) es += 2;
  if (/[àâçéèêëîïôùûüÿœ]/.test(t)) fr += 2;

  ['hola','gracias','horario','horarios','dirección','direccion','teléfono','telefono','sitio','web','menú','menu','reservar']
    .forEach(k => { if (t.includes(k)) es += 2; });

  ['bonjour','merci','horaire','horaires','adresse','téléphone','telephone','site','web','réserver','reserver']
    .forEach(k => { if (t.includes(k)) fr += 2; });

  ['hi','hello','thanks','hours','address','phone','website','menu','reserve','open','close']
    .forEach(k => { if (t.includes(k)) en += 2; });

  const max = Math.max(es, en, fr);
  if (max === 0) return 'en';
  if (es === max && es >= en + 1 && es >= fr + 1) return 'es';
  if (fr === max && fr >= en + 1 && fr >= es + 1) return 'fr';
  return 'en';
}

/* ╔══════════════════════════════════════════╗
   ║                TYPES & PROPS             ║
   ╚══════════════════════════════════════════╝ */

type ChatMessage = {
  from: 'user' | 'bot';
  text: string;
};

type AiCompProps = {
  /** Identificador lógico del agente (para logs/back-end) */
  agentId?: string;

  /** Paneles FDV a usar como contexto (branding, settings, training, etc.) */
  sources?: string[];

  /** Rol / propósito del agente (system prompt en el back-end) */
  role?: string;

  /** Título visible en el header del panel */
  title?: string;

  /** Avatar del bot dentro del panel */
  avatarUrl?: string;

  /** Icono de la marca / agente en el header y FAB */
  fabIconUrl?: string;

  /** Locale base; si no se indica, se toma de react-intl */
  localeOverride?: string;

  /** Panel abierto por defecto */
  defaultOpen?: boolean;
};

/**
 * AiComp:
 * - UI igual (FAB + panel + mensajes + input).
 * - Contexto desde FDV (FdvProvider) filtrado por isAgentFDV y `sources`.
 * - Envía `context`, `agentId`, `role`, `locale` a `/api/ai-chat`.
 * - Telemetría por sesión a `/api/log-aai`.
 * - Locale que se manda al backend = detectLangClient(text) o locale de UI.
 */
export default function AiComp({
  agentId = 'default-agent',
  sources,
  role,
  title,
  avatarUrl,
  fabIconUrl,
  localeOverride,
  defaultOpen = false,
}: AiCompProps) {
  const intl = useIntl();

  const [open, setOpen] = useState(defaultOpen);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');

  // ===== Locale base (UI) =====
  const uiShort: ShortLang = normalizeShortLocale(localeOverride || intl.locale || 'es');

  // ===== Contexto FDV para el agente =====
  const { data } = useFdvData();

  // Solo tomamos schemas marcados para uso de agentes (isAgentFDV)
  const agentSchemas = useMemo(
    () => Object.values(PANEL_SCHEMAS).filter((s: any) => s.isAgentFDV),
    [],
  );

  // Si no se pasan `sources`, usamos todos los paneles marcados isAgentFDV.
  // Si sí se pasan, filtramos contra los permitidos.
  const panelIds = useMemo(() => {
    const allowedIds =
      agentSchemas.length > 0
        ? agentSchemas.map((s: any) => s.id)
        : Object.keys(data || {});
    const requested = sources && sources.length ? sources : allowedIds;
    return requested.filter((id) => allowedIds.includes(id));
  }, [agentSchemas, data, sources]);

  // armamos el contexto que se enviará al back-end
  const context = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const id of panelIds) {
      if (data[id] !== undefined) {
        out[id] = data[id];
      }
    }
    return out;
  }, [data, panelIds]);

  // ===== Autoscroll sencillo =====
  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs, typing]);

  // ===== Telemetría: flush al cerrar pestaña / ocultar =====
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushTelemetry();
    };
    const onBeforeUnload = () => flushTelemetry();

    window.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      flushTelemetry();
    };
  }, []);

  // ===== Envío de mensaje libre (con telemetría + detección de idioma) =====
  async function send() {
    const text = input.trim();
    if (!text) return;

    setMsgs((prev) => [...prev, { from: 'user', text }]);
    setInput('');
    setTyping(true);

    // Detectamos idioma del mensaje; si no hay señal clara, usamos el de UI
    const detected: ShortLang = detectLangClient(text);
    const sendShort: ShortLang = detected || uiShort;
    const sendLocale = sendShort; // 'es' | 'en' | 'fr'

    const t0 =
      typeof performance !== 'undefined'
        ? performance.now()
        : Date.now();

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-locale': sendLocale,
        },
        body: JSON.stringify({
          agentId,
          role,
          locale: sendLocale,
          context,
          message: text,
          userMessage: text,
          meta: {
            source: 'chat',
            panels: panelIds,
          },
        }),
      });

      const json = await res.json().catch(() => ({} as any));
      const t1 =
        typeof performance !== 'undefined'
          ? performance.now()
          : Date.now();
      const latency = Math.round(t1 - t0);

      const botText =
        typeof json?.reply === 'string'
          ? json.reply
          : (json?.reply?.text ?? json?.message ?? '');

      // Telemetría
      const usage = json?.usage || {};
      pushTelemetry({
        kind: 'chat',
        agentId,
        locale: sendLocale,
        panels: panelIds,
        ok: res.ok && json?.ok !== false,
        status: res.status,
        latency,
        tokensIn: usage.prompt ?? null,
        tokensOut: usage.completion ?? null,
        topic: json?.topic ?? null,
      });

      if (!res.ok || json?.ok === false) {
        const msg = json?.error
          ? String(json.error)
          : `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setMsgs((prev) => [
        ...prev,
        { from: 'bot', text: String(botText || '') },
      ]);
    } catch (e: any) {
      setMsgs((prev) => [
        ...prev,
        { from: 'bot', text: `⚠️ ${String(e?.message || e)}` },
      ]);
    } finally {
      setTyping(false);
    }
  }

  // ===== Textos UI =====
  const placeholderText = intl.formatMessage({
    id: 'aai.ui.placeholder',
    defaultMessage: 'Escribe tu mensaje…',
  });

  const sendLabel = intl.formatMessage({
    id: 'aai.ui.send',
    defaultMessage: 'Enviar',
  });

  const titleText =
    title ||
    intl.formatMessage({
      id: 'aai.ui.title',
      defaultMessage: 'Asistente de IA',
    });

  return (
    <div className={s.container}>
      {/* FAB */}
      {!open && (
        <BUTTON
          className={s.fab}
          onClick={() => setOpen(true)}
          aria-label="Open AI Agent"
        >
          <img src={avatarUrl} alt="AI" className={s.fabImg} />
        </BUTTON>
      )}

      {/* Panel */}
      {open && (
        <div className={`${s.panel} ${open ? s.panelOpen : ''}`}>
          <div className={s.header}>
            <img className={s.brand} src={fabIconUrl} alt="brand" />
            <div className={s.title}>{titleText}</div>
            <BUTTON
              className={s.close}
              onClick={() => {
                flushTelemetry();
                setOpen(false);
              }}
              aria-label="Close"
            >
              ✕
            </BUTTON>
          </div>

          {/* Mensajes */}
          <div className={s.body} ref={listRef}>
            {msgs.map((m, i) => (
              <div
                key={i}
                className={m.from === 'user' ? s.msgUser : s.msgBot}
              >
                {m.from === 'bot' && (
                  <img
                    className={s.msgAvatar}
                    src={avatarUrl}
                    alt=""
                    aria-hidden
                  />
                )}
                <div className={s.msgBubble}>
                  <SPAN className={s.messageText}>
                    {renderWithLinks(m.text ?? '')}
                  </SPAN>
                </div>
              </div>
            ))}

            {/* Indicador de typing */}
            {typing && (
              <div className={s.msgBot}>
                <img
                  className={s.msgAvatar}
                  src={avatarUrl}
                  alt=""
                  aria-hidden
                />
                <div className={`${s.msgBubble} ${s.typing}`}>
                  <SPAN className={s.dot}></SPAN>
                  <SPAN className={s.dot}></SPAN>
                  <SPAN className={s.dot}></SPAN>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className={s.inputBar}>
            <INPUT
              className={s.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholderText}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
            />
            <BUTTON className={s.btnPrimary} onClick={send}>
              {sendLabel}
            </BUTTON>
          </div>
        </div>
      )}
    </div>
  );
}
