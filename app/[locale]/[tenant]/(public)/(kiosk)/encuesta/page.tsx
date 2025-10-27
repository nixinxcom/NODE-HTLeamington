'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FbDB } from '@/app/lib/services/firebase';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'next/navigation';
import FM from "@/complements/i18n/FM";

type YesNo = true | false | null;
type Channel =
  | 'recomendacion'
  | 'walk_in'
  | 'social_media'
  | 'flyer'
  | 'medios_digitales'
  | 'otro'
  | null;

// ID único por dispositivo
const DEVICE_ID = (() => {
  if (typeof window === 'undefined') return 'server';
  try {
    const k = 'kiosk_device_id';
    const v = localStorage.getItem(k);
    if (v) return v;
    const nv = crypto.randomUUID();
    localStorage.setItem(k, nv);
    return nv;
  } catch {
    return 'unknown';
  }
})();

// Los conceptos (claves); los labels se renderizan vía i18n
const concepts = [
  { key: 'experiencia' },
  { key: 'sabor' },
  { key: 'servicio' },
  { key: 'tiempo_espera' },
  { key: 'ambiente' },
  { key: 'recomendacion' },
  { key: 'precio' },
  { key: 'regresaria' },
] as const;

type ConceptKey = (typeof concepts)[number]['key'];
type Answers = Record<ConceptKey, YesNo>;
const OPINION_KEYS: ConceptKey[] = concepts.map(c => c.key);

const initialAnswers: Answers = concepts.reduce((acc, c) => {
  (acc as any)[c.key] = null;
  return acc;
}, {} as Answers);

// Mapeos i18n
const conceptMsg: Record<ConceptKey, { id: string; defaultMessage: string }> = {
  experiencia:   { id: 'kiosk.survey.concept.experiencia',             defaultMessage: 'Experiencia' },
  sabor:         { id: 'kiosk.survey.concept.sabor',                   defaultMessage: 'Sabor' },
  servicio:      { id: 'kiosk.survey.concept.servicio',                defaultMessage: 'Servicio' },
  tiempo_espera: { id: 'kiosk.survey.concept.tiempo_espera',           defaultMessage: 'Tiempo de espera' },
  ambiente:      { id: 'kiosk.survey.concept.ambiente',                defaultMessage: 'Ambiente' },
  recomendacion: { id: 'kiosk.survey.concept.recomendacion_question',  defaultMessage: '¿Nos recomendarías?' },
  precio:        { id: 'kiosk.survey.concept.precio',                  defaultMessage: 'Precio' },
  regresaria:    { id: 'kiosk.survey.concept.regresaria_question',     defaultMessage: '¿Regresarías?' },
};

type ChannelKey = Exclude<Channel, null>;
const channelMsg: Record<ChannelKey, { id: string; defaultMessage: string }> = {
  recomendacion:   { id: 'kiosk.survey.channel.recomendacion',   defaultMessage: 'Recomendación' },
  walk_in:         { id: 'kiosk.survey.channel.walk_in',         defaultMessage: 'Walk-in / Paso' },
  social_media:    { id: 'kiosk.survey.channel.social_media',    defaultMessage: 'Redes sociales' },
  flyer:           { id: 'kiosk.survey.channel.flyer',           defaultMessage: 'Flyer' },
  medios_digitales:{ id: 'kiosk.survey.channel.medios_digitales',defaultMessage: 'Medios digitales' },
  otro:            { id: 'kiosk.survey.channel.otro',            defaultMessage: 'Otro' },
};

export default function SurveyPage() {
  const intl = useIntl();

  // Locale de la ruta y normalizado (es/en/fr)
  const params = useParams() as { locale?: string };
  const routeLocale = (params?.locale as string | undefined) || undefined;
  const activeLocale = useMemo(() => {
    const raw = routeLocale || intl.locale ||
      (typeof window !== 'undefined' && (localStorage.getItem('locale') || navigator.language)) || 'en';
    return String(raw).split('-')[0]; // "es-MX" -> "es"
  }, [routeLocale, intl.locale]);

  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [channel, setChannel] = useState<Channel>(null);
  const [sending, setSending] = useState(false);
  const [thanks, setThanks] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());

  // Comentario libre (ya estaba en tu código)
  const [comment, setComment] = useState<string>("");

  const somethingSelected = useMemo(
    () =>
      OPINION_KEYS.some(k => answers[k] !== null) ||
      channel !== null ||
      comment.trim().length > 0,
    [answers, channel, comment]
  );

  function touch() {
    lastInteractionRef.current = Date.now();
  }

  function setAnswer(key: ConceptKey, value: YesNo) {
    touch();
    setAnswers(prev => ({ ...prev, [key]: value }));
    const label = intl.formatMessage(conceptMsg[key]);
    pushDL('survey_answer', { question: key, label, value: value === true ? 'yes' : value === false ? 'no' : 'null' });
    try { navigator.vibrate?.(10); } catch {}
  }

  function selectChannel(v: Exclude<Channel, null>) {
    touch();
    setChannel(prev => (prev === v ? null : v));
    pushDL('survey_channel', { channel: v, label: intl.formatMessage(channelMsg[v]) });
    try { navigator.vibrate?.(5); } catch {}
  }

  useEffect(() => {
    const t = setInterval(async () => {
      const idleMs = Date.now() - lastInteractionRef.current;
      if (idleMs >= 30_000) {
        clearInterval(t);
        await autoSubmit({ reason: 'idle' });
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit() {
    await persist('manual');
    resetAll();
  }

  async function autoSubmit({ reason }: { reason: 'idle' }) {
    if (!somethingSelected) {
      resetAll();
      return;
    }
    await persist(reason);
    resetAll();
  }

  async function persist(reason: 'manual' | 'idle') {
    try {
      setSending(true);
      const locale = activeLocale;
      // const locale =
      //   (typeof window !== 'undefined' && localStorage.getItem('locale')) ||
      //   (typeof navigator !== 'undefined' ? navigator.language : 'es-CA');

      const allPositive = OPINION_KEYS.every(k => answers[k] === true);
      const hasComment = comment.trim().length > 0;
      const success = allPositive && hasComment;

      const payload = {
        ...answers,
        arrival_channel: channel ?? null,
        ...(hasComment ? { comment: comment.trim() } : {}), // ← no enviamos 'comment' si no hay texto
        success,
        ts: serverTimestamp(),
        fecha: serverTimestamp(),
        hora: serverTimestamp(),
        deviceId: DEVICE_ID,
        locale: activeLocale,
        reason,
      };

      await addDoc(collection(FbDB, 'surveys'), payload);

      pushDL('survey_submit', {
        ...answers,
        arrival_channel: channel ?? 'unknown',
        comment_len: comment.trim().length,
        success_state: success
          ? 'all_positive_with_comment'
          : allPositive
            ? 'all_positive_no_comment'
            : 'mixed_or_negative',
      });

      setThanks(true);
      setTimeout(() => setThanks(false), 1800);
    } catch (e) {
      console.error('survey persist error', e);
    } finally {
      setSending(false);
    }
  }

  function resetAll() {
    setAnswers(initialAnswers);
    setChannel(null);
    setComment("");
    setThanks(false);
    touch();
  }

  return (
    <div onClick={touch} className="wrap">
      <h1 className="title">
        <FM id="kiosk.survey.h1" defaultMessage="Encuesta rápida" />
      </h1>

      {/* GRID de tarjetas */}
      <div className="grid">
        {concepts.map(c => {
          const v = answers[c.key];
          const label = intl.formatMessage(conceptMsg[c.key]);
          return (
            <div className="tile" key={c.key}>
              <div className="label">{label}</div>
              <div className="spacer" />
              <div className="choices">
                <button
                  className={`thumb thumb-no ${v === false ? 'active' : ''}`}
                  onClick={() => setAnswer(c.key, v === false ? null : false)}
                  aria-label={intl.formatMessage({ id: 'kiosk.survey.thumb_aria.no', defaultMessage: 'No - {label}' }, { label })}
                  aria-pressed={v === false}
                >
                  👎
                </button>
                <button
                  className={`thumb thumb-yes ${v === true ? 'active' : ''}`}
                  onClick={() => setAnswer(c.key, v === true ? null : true)}
                  aria-label={intl.formatMessage({ id: 'kiosk.survey.thumb_aria.yes', defaultMessage: 'Sí - {label}' }, { label })}
                  aria-pressed={v === true}
                >
                  👍
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Canales */}
      <div className="channels">
        <h2>
          <FM id="kiosk.survey.how_heard" defaultMessage="¿Cómo supo de nosotros?" />
        </h2>
        <div className="chips">
          {(['recomendacion', 'walk_in', 'social_media', 'flyer', 'medios_digitales', 'otro'] as const).map(v => (
            <button
              key={v}
              className={`chip ${channel === v ? 'active' : ''}`}
              onClick={() => selectChannel(v)}
            >
              {intl.formatMessage(channelMsg[v])}
            </button>
          ))}
        </div>
      </div>

      {/* Comentarios */}
      <div className="commentsBox">
        <label className="commentsLabel" htmlFor="survey-comment">
          <FM id="kiosk.survey.comment.label" defaultMessage="¿Algo que quieras contarnos?" />
        </label>
        <textarea
          id="survey-comment"
          className="commentsText"
          placeholder={intl.formatMessage({ id: 'kiosk.survey.comment.placeholder', defaultMessage: 'Regálanos unas breves palabras…' })}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={600}
        />
        <div className="commentsHint">
          <FM id="kiosk.survey.comment.hint" defaultMessage="Opcional • Máx. 600 caracteres" />
        </div>
      </div>

      {/* Acciones */}
      <div className="actions">
        <button className="submit" onClick={handleSubmit} disabled={sending}>
          {sending
            ? intl.formatMessage({ id: 'kiosk.survey.submitting', defaultMessage: 'Enviando…' })
            : intl.formatMessage({ id: 'kiosk.survey.submit', defaultMessage: 'Enviar' })
          }
        </button>
        <button className="reset" onClick={resetAll} disabled={sending}>
          {intl.formatMessage({ id: 'kiosk.survey.reset', defaultMessage: 'Limpiar' })}
        </button>
      </div>

      {/* Overlay de Gracias */}
      {thanks && (
        <div className="thankyou">
          <div><FM id="kiosk.survey.thanks" defaultMessage="¡Gracias! 😊" /></div>
        </div>
      )}

      {/* Estilos (idénticos a los que ya tenías) */}
      <style jsx>{`
        .wrap { padding:7px; max-width:1200px; margin:0 auto; }
        .title { text-align:center; margin:6px 0 7px; }
        .grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; }
        @media (max-width:1100px){ .grid{ grid-template-columns:repeat(3,1fr);} }
        @media (max-width:820px){ .grid{ grid-template-columns:repeat(2,1fr);} }
        @media (max-width:560px){ .grid{ grid-template-columns:repeat(1,1fr);} }

        .tile{ display:grid; grid-template-rows:auto 1fr auto; border-radius:16px; padding:7px;
               background:#111; border:1px solid #333; color:#fff; box-shadow: 0 6px 16px rgba(0,0,0,.25) inset,0 1px 0 rgba(255,255,255,.04); }
        .label{ font-weight:700; text-align:center; line-height:1.2; min-height:28px; display:grid; place-items:center; padding:2px 4px;}
        .spacer{ min-height:4px; }
        .choices{ display:grid; grid-template-columns:1fr 1fr; gap:7px; align-items:end; }
        .thumb{ height:49px; font-size:28px; border-radius:12px; border:1px solid #333; background:#181818; color:#fff;
                transition: transform .05s ease, background .15s ease, border-color .15s ease; user-select:none; }
        .thumb:active{ transform:scale(0.96); }
        .thumb-yes.active{ background:#135b2d; border-color:#198754; }
        .thumb-no.active{ background:#6b0f15; border-color:#dc3545; }

        .channels{ margin-top:21px; }
        .channels h2{ text-align:center; margin-bottom:7px; }
        .chips{ display:flex; flex-wrap:wrap; gap:7px; justify-content:center; }
        .chip{ padding:10px 14px; border:1px solid #3a3a3a; border-radius:9999px; background:#1a1a1a; color:#fff; font-weight:600; }
        .chip.active{ background:#0d6efd; border-color:#0d6efd; }

        .commentsBox{ margin-top:18px; display:grid; gap:6px; }
        .commentsLabel{ color:#fff; font-weight:700; text-align:center; }
        .commentsText{ width:100%; min-height:100px; border-radius:12px; background:#141414; border:1px solid #333; color:#fff; padding:7px 12px; font-size:16px; resize:vertical; }
        .commentsHint{ color:#bbb; font-size:12px; text-align:right; }

        .actions{ display:flex; gap:7px; justify-content:center; margin-top:20px; }
        .submit,.reset{ padding:12px 14px; font-size:16px; border-radius:12px; border:none; color:#fff; }
        .submit{ background:#0d6efd; }
        .reset{ background:#343a40; }

        .thankyou{ position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,.5); display:grid; place-items:center; }
        .thankyou > div{ background:#111; padding:14px 21px; border-radius:16px; border:1px solid #333; font-size:42px; font-weight:800; }
      `}</style>
    </div>
  );
}

// GTM helper
function pushDL(event: string, data: Record<string, any>) {
  if (typeof window === 'undefined') return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ event, ...data });
}
// Nota: el dataLayer lo defines en el layout general del kiosk (app/[locale]/(kiosk)/layout.tsx)

/* ─────────────────────────────────────────────────────────
DOC: Page de encuesta (app/\[locale]/(kiosk)/encuesta/page.tsx)
QUÉ HACE:
Página principal de la encuesta en el segmento (kiosk). Renderiza el contenido
de la encuesta y queda envuelta por su layout local (encuesta/layout) y el
layout superior de (kiosk). Por defecto es Server Component salvo que el archivo
comience con "use client".

RUTA RESULTANTE:
/es/encuesta  /en/encuesta  /fr/encuesta   (anidada bajo (kiosk))

API / PROPS QUE NEXT INYECTA:
type Props = {
params?: { locale?: 'es' | 'en' | 'fr' }        // opcional | locale activo
searchParams?: Record\<string, string | string\[] | undefined> // opcional
}
export default function Page(props: Props): JSX.Element

USO (conceptual):

* Se navega a esta página con Link o router.push:
  import Link from 'next/link'

    <Link href="/es/encuesta">Abrir encuesta</Link>
* Si necesitas estado/efectos del navegador, añade al inicio del archivo: use client
  y mueve lógica de kiosko a un componente cliente (p. ej., <KioskClient /> en el layout).

INTERACCIÓN CON EL LAYOUT:

* Este page queda envuelto por app/\[locale]/(kiosk)/encuesta/layout.tsx
* Para aplicar modo kiosko en todo el segmento, monta KioskClient en app/\[locale]/(kiosk)/layout.tsx
  En cambio, si solo aplica a “encuesta”, puedes montarlo dentro de este page o en su layout local.

SEARCH PARAMS (si se usan):

* Puedes leerlos desde props.searchParams. Ejemplos de uso común:
  step=string            // opcional | por ejemplo "intro" | "form" | "thanks"
  debug=1                // opcional | string "1" para habilitar trazas
  Estos son solo ejemplos; ajusta a los parámetros reales del archivo.

NOTAS:

* Evita usar directamente APIs del navegador si el componente es de servidor.
* Para datos asíncronos, puedes usar fetch en el servidor y renderizar de forma SSR.
* Revalidación opcional: export const revalidate = 0 para desactivar cache, o un número en segundos.

DEPENDENCIAS:

* Next.js App Router (params, searchParams, layouts anidados).
  ────────────────────────────────────────────────────────── */
