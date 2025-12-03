"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import styles from "./BlogCardComp.module.css";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FbDB } from "@/app/lib/services/firebase";
import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";
/* ===== Tipos ===== */
export type CtaType = "none" | "url" | "pdf" | "phone" | "mailto";
export type CtaRender = "button" | "link";
export type Cta = { type: CtaType; label: string; url: string | null; as?: CtaRender };
export type MediaVariant = { size: string; path: string; url: string };
export type MediaItem = {
  name: string;
  path: string;
  url: string;
  contentType: string;
  resized?: MediaVariant[];
};
export type EventDoc = {
  id?: string;
  title: string;
  slug: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  timezone?: string | null;
  location?: string | null;
  description?: string | null;
  artist?: string | null;
  externalVideoUrl?: string | null;
  mediaStorageBase?: string;
  coverUrl?: string | null;
  media?: MediaItem[];
  ctas?: Cta[];
  status?: "draft" | "published" | "archived";
};

const mediaBase = (ev: EventDoc) => ev.mediaStorageBase?.replace(/\/$/, "") || "";
const isVideoCT = (ct: string) => ct?.startsWith("video/");
const isImageCT = (ct: string) => ct?.startsWith("image/");

function bestVariant(v: MediaItem, ev: EventDoc): { kind: "video" | "image"; url: string; name: string } | null {
  function urlOf(m: MediaItem | MediaVariant | null | undefined) {
    if (!m) return null;
    if ("url" in m && m.url) return m.url;
    if ("path" in m && m.path) {
      if (/^https?:\/\//i.test(m.path)) return m.path;
      const base = mediaBase(ev);
      return base ? `${base}/${m.path.replace(/^\/+/, "")}` : m.path;
    }
    return null;
  }
  const url = urlOf(v) ?? v.url;
  return { kind: isVideoCT(v.contentType) ? ("video" as const) : ("image" as const), url, name: v.name || ev.title };
}
function getFirstVisual(ev: EventDoc): { kind: "video" | "image"; url: string; name: string } | null {
  if (ev.coverUrl) {
    return { kind: isVideoCT(ev.coverUrl) ? ("video" as const) : ("image" as const), url: ev.coverUrl, name: ev.title } as any;
  }
  if (Array.isArray(ev.media) && ev.media.length) {
    const v = ev.media.find((m) => isVideoCT(m.contentType)) || ev.media[0];
    const url = bestVariant(v, ev)?.url ?? v.url;
    return { kind: isVideoCT(v.contentType) ? ("video" as const) : ("image" as const), url, name: v.name || ev.title } as any;
  }
  return ev.coverUrl ? { kind: "image", url: ev.coverUrl, name: ev.title } : null;
}
function ctaHref(cta?: Cta): string | null {
  if (!cta?.url) return null;
  if (cta.type === "phone") {
    const cleaned = cta.url.replace(/[^\d+]/g, "");
    return cleaned.startsWith("tel:") ? cleaned : `tel:${cleaned}`;
  }
  if (cta.type === "mailto") return cta.url.startsWith("mailto:") ? cta.url : `mailto:${cta.url}`;
  return cta.url;
}

/* ===== Props ===== */
type Props = { event: EventDoc; locale: string; variant: "upcoming" | "past" };

export default function BlogCardComp({ event, locale, variant }: Props) {
  const intl = useIntl();

  const [orient, setOrient] = useState<"portrait" | "landscape" | "square">("portrait");
  const visual = useMemo(() => getFirstVisual(event), [event]);

  // --- auto-ajuste cuando el contenido es corto ---
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isShort, setIsShort] = useState(false);
  // reemplaza tu useEffect que usa bodyRef.current!.offsetHeight por éste:
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const update = () => {
      const h = el.offsetHeight || 0;
      setIsShort(h < 120);
    };

    // medida inicial
    update();

    let ro: ResizeObserver | null = null;
    let raf = 0;

    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => update());
      ro.observe(el);
    } else {
      const loop = () => { update(); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      try {
        if (ro) { ro.unobserve(el); ro.disconnect(); }
        if (raf) cancelAnimationFrame(raf);
      } catch { /* no-op */ }
    };
  }, [visual]);  // o añade dependencias si cambian el contenido

  const [descOpen, setDescOpen] = useState(false);

  // === Feedback (past) ===
  const [fbOpen, setFbOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    // orientar según media natural cuando sea posible
    if (!visual || visual.kind !== "image") return;
    const img = new Image();
    img.src = visual.url;
    img.onload = () => {
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (!w || !h) return;
      const r = w / h;
      if (Math.abs(r - 1) < 0.08) setOrient("square");
      else setOrient(r > 1 ? "landscape" : "portrait");
    };
  }, [visual]);

  const cardClass = `${styles.card} ${isShort ? styles.isShort : ""} ${styles[orient] ?? ""}`;

  function toHumanDate(dateStr: string, start?: string | null, end?: string | null) {
    const d = new Date(`${dateStr}T00:00:00`);
    const fmt = d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
    return `${fmt}${start ? ` • ${start}${end ? ` – ${end}` : ""}` : ""}`;
  }

  async function submitFeedback() {
    setOkMsg(""); setErrMsg("");
    if (!name.trim()) return setErrMsg(intl.formatMessage({ id: "blogcard.err.noname", defaultMessage: "Por favor, indica tu nombre." }));
    if (!email.trim() && !phone.trim()) return setErrMsg(intl.formatMessage({ id: "blogcard.err.nocontact", defaultMessage: "Indica tu correo o teléfono." }));
    if (!consent) return setErrMsg(intl.formatMessage({ id: "blogcard.err.noconsent", defaultMessage: "Debes aceptar los términos para continuar." }));
    if (!rating) return setErrMsg(intl.formatMessage({ id: "blogcard.err.norating", defaultMessage: "Selecciona una calificación." }));

    try {
      setSaving(true);
      await addDoc(collection(FbDB, "eventFeedback"), {
        eventId: event.id ?? null,
        eventSlug: event.slug ?? null,
        eventTitle: event.title ?? null,
        rating,
        comment,
        name,
        email,
        phone,
        consent: true,
        locale,
        createdAt: serverTimestamp(),
      });
      setOkMsg(intl.formatMessage({ id: "blogcard.ok", defaultMessage: "¡Gracias por tu opinión!" }));
      setFbOpen(false); setRating(null); setComment(""); setName(""); setEmail(""); setPhone(""); setConsent(false);
    } catch (e) {
      console.error("[feedback] addDoc error:", e);
      setErrMsg(intl.formatMessage({ id: "blogcard.err.failed", defaultMessage: "No se pudo enviar. Inténtalo de nuevo." }));
    } finally { setSaving(false); }
  }

  return (
    <article className={cardClass}>
      {/* Media */}
      {visual ? (
        visual.kind === "image" ? (
          <img
            src={visual.url}
            alt={event.title || "event image"}
            className={styles.media}
            loading="lazy"
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              const w = el.naturalWidth || 0;
              const h = el.naturalHeight || 0;
              const d = Math.abs((w / h) - 1);
              if (d < 0.08) setOrient("square");
              else setOrient(w > h ? "landscape" : "portrait");
            }}
          />
        ) : (
          <video
            className={styles.media}
            src={visual.url}
            muted
            autoPlay
            loop
            playsInline
            controls
            preload="metadata"
          />
        )
      ) : null}

      {/* Body */}
      <div ref={bodyRef} className={styles.body}>
        <H3 className={styles.title}>{event.title}</H3>
        <P className={styles.meta}>
          {toHumanDate(event.date, event.startTime ?? undefined, event.endTime ?? undefined)}
          {event.location ? ` • ${event.location}` : ""}
        </P>

        {variant === "upcoming" ? (
          <>
            {event.ctas?.length ? (
              <div className={styles.ctaList}>
                {event.ctas
                  .filter((c) => c.type !== "none" && ctaHref(c))
                  .slice(0, 2)
                  .map((c, i) => {
                    const href = ctaHref(c)!;
                    const asBtn = (c.as ?? "button") === "button";
                    return (
                      <a
                        key={`cta-${i}`}
                        href={href}
                        target={c.type === "url" || c.type === "pdf" ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className={asBtn ? styles.ctaBtn : styles.ctaLink}
                      >
                        {c.label}
                      </a>
                    );
                  })}
              </div>
            ) : null}

            {event.description ? (
              <div className={styles.descWrap}>
                <BUTTON className={styles.descToggle} onClick={() => setDescOpen(v => !v)}>
                  {descOpen
                    ? intl.formatMessage({ id: "blogcard.desc.hide", defaultMessage: "Ocultar descripción" })
                    : intl.formatMessage({ id: "blogcard.desc.show", defaultMessage: "Mostrar descripción" })
                  }
                </BUTTON>
                {descOpen ? <P className={styles.descText}>{event.description}</P> : null}
              </div>
            ) : null}
          </>
        ) : (
          <>
            {event.description ? <P className={styles.descClamp}>{event.description}</P> : null}
            <BUTTON className={styles.reviewBtn} onClick={() => setFbOpen(v => !v)}>
              {fbOpen
                ? intl.formatMessage({ id: "blogcard.review.close", defaultMessage: "Cerrar reseña" })
                : intl.formatMessage({ id: "blogcard.review.open", defaultMessage: "Dejar reseña del evento" })
              }
            </BUTTON>

            {fbOpen && (
              <div className={styles.form}>
                <div className={styles.ratingRow}>
                  {[1,2,3,4,5].map((n) => (
                    <BUTTON
                      key={n}
                      className={`${styles.star} ${rating && rating >= n ? styles.active : ""}`}
                      type="button"
                      onClick={() => setRating(n)}
                    >★</BUTTON>
                  ))}
                </div>

                <LABEL className={styles.label}>
                  {/*i18n*/}<FM id="blogcard.label.name" defaultMessage="Nombre*" />
                  <INPUT
                    className={styles.input}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={intl.formatMessage({ id: "blogcard.ph.name", defaultMessage: "Tu nombre" })}
                  />
                </LABEL>

                <div className={styles.row}>
                  <LABEL className={styles.label}>
                    {/*i18n*/}<FM id="blogcard.label.email" defaultMessage="Correo" />
                    <INPUT
                      className={styles.input}
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={intl.formatMessage({ id: "blogcard.ph.email", defaultMessage: "tu@email.com" })}
                    />
                  </LABEL>
                  <LABEL className={styles.label}>
                    {/*i18n*/}<FM id="blogcard.label.phone" defaultMessage="Teléfono" />
                    <INPUT
                      className={styles.input}
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder={intl.formatMessage({ id: "blogcard.ph.phone", defaultMessage: "+52 55…" })}
                    />
                  </LABEL>
                </div>

                <LABEL className={styles.label}>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder={intl.formatMessage({ id: "blogcard.ph.comment", defaultMessage: "¿Qué te pareció el evento?" })}
                  />
                </LABEL>

                <LABEL className={styles.consent}>
                  <INPUT type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                  <FM
                    id="blogcard.form.consent"
                    defaultMessage={"Acepto los </LINK>términos</link> para ser contactado con fines de marketing."}
                    values={{
                      link: (chunks) => (
                        <a key="consent-link" href="/terminos" target="_blank" rel="noopener noreferrer">
                          {chunks}
                        </a>
                      ),
                    }}
                  />
                </LABEL>

                {errMsg ? <P className={styles.error}>{errMsg}</P> : null}
                {okMsg ? <P className={styles.success}>{okMsg}</P> : null}

                <div className={styles.formActions}>
                  <BUTTON className={styles.submit} onClick={submitFeedback} disabled={saving}>
                    {saving
                      ? intl.formatMessage({ id: "blogcard.submit.sending", defaultMessage: "Enviando…" })
                      : intl.formatMessage({ id: "blogcard.submit", defaultMessage: "Enviar reseña" })
                    }
                  </BUTTON>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}