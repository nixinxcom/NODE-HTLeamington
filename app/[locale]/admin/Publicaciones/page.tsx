"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ensureAnon } from "@/app/lib/services/firebase";
import { FbAuth } from "@/app/lib/services/firebase";
import { signInAnonymously } from "firebase/auth";
import { FormattedMessage, useIntl } from "react-intl";
import FM from "@/complements/i18n/FM";
import styles from "./publicaciones.module.css";

// Storage (misma instancia SIEMPRE)
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FbStorage, FbDB } from "@/app/lib/services/firebase"; // <- usa FbDB de tu app

// Firestore
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";

// Tu uploader
import FilesUploaderComp, {
  IFile as UploaderFile,
} from "@/complements/CloudComponents/FilesUploaderComp/FilesUploaderComp";
import Link from "next/link";
import ThemeToggle from "@/complements/components/ThemeToggle/ThemeToggle";

/* ========= Config ========= */
const APP_NAME = "ElPatronWebApp";

// ✅ Ahora SÍ esperamos al .webp para guardar su URL en Firestore
const WAIT_FOR_WEBP = true;
const RESIZED_SIZES = ["700x700"];
const RESIZED_MAX_WAIT = 45_000;
const RESIZED_POLL_EVERY = 1_500;

type CtaType = "none" | "url" | "pdf" | "phone" | "mailto";
type CtaRender = "button" | "link";

interface CtaState {
  type: CtaType;
  label: string;
  url: string;
  as: CtaRender;
  pendingFile: File | null;
  pendingName: string;
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function sanitizeName(name: string) {
  return name.replace(/[\\?#%{}^~[\]|<>`"]/g, "").trim();
}
function baseWithoutExt(name: string) {
  return name.replace(/\.[^.]+$/, "");
}
function isImageType(t?: string) {
  return !!t && /^image\//.test(t);
}
// A partir del path del ORIGINAL subido, construye el path del webp en la MISMA carpeta
function webpVariantPathFromOriginalPath(originalFullPath: string, size = "700x700") {
  // ej: ".../1756 - Foto.jpg" -> ".../1756 - Foto_700x700.webp"
  return originalFullPath.replace(/\.[^./]+$/, `_${size}.webp`);
}
async function waitDownloadURL(path: string, max = RESIZED_MAX_WAIT, poll = RESIZED_POLL_EVERY) {
  const r = ref(FbStorage, path);
  const deadline = Date.now() + max;
  while (Date.now() < deadline) {
    try {
      return await getDownloadURL(r);
    } catch (e: any) {
      if (e?.code === "storage/unauthorized") throw e;
      await new Promise((res) => setTimeout(res, poll));
    }
  }
  throw new Error(`Timeout esperando ${path}`);
}

export default function NewPublicationPage() {
  const intl = useIntl();
  const router = useRouter();
  const params = useParams();
  const locale =
    typeof params?.locale === "string"
      ? params.locale
      : Array.isArray(params?.locale)
      ? params.locale[0]
      : "es";

  // Datos básicos
  const [title, setTitle] = useState("");
  const slug = useMemo(() => toSlug(title || "evento"), [title]);
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  // Duplicar imágenes a /PWAStorage/Imagenes (para Galería)
  const [galleryAlsoUploadImages, setGalleryAlsoUploadImages] = useState(true);


  // Video externo
  const [externalVideoUrl, setExternalVideoUrl] = useState("");

  // CTAs
  const [cta1, setCta1] = useState<CtaState>({
    type: "none",
    label: "Reservar",
    url: "",
    as: "button",
    pendingFile: null,
    pendingName: "",
  });
  const [cta2, setCta2] = useState<CtaState>({
    type: "none",
    label: "Ver menú",
    url: "",
    as: "link",
    pendingFile: null,
    pendingName: "",
  });

  // Uploader (defer)
  const [selectedMedia, setSelectedMedia] = useState<UploaderFile[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0); // para resetear

  // UI
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Rutas base
  const mediaBasePath = useMemo(() => `${APP_NAME}/Any/events/${slug}/media/`, [slug]);
  const ctaBasePath = useMemo(() => `${APP_NAME}/Documents/events/${slug}/cta/`, [slug]);

  const fieldBase =
    "mt-1 w-full rounded border border-neutral-300 bg-white text-black placeholder-neutral-500 shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 " +
    "dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-400 dark:border-neutral-700 dark:focus:ring-neutral-50/10";

  function handlePickPdf(
    e: React.ChangeEvent<HTMLInputElement>,
    setCta: React.Dispatch<React.SetStateAction<CtaState>>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Selecciona un PDF válido.");
      e.target.value = "";
      return;
    }
    setCta((p) => ({ ...p, pendingFile: file, pendingName: file.name, url: "" }));
    e.target.value = "";
  }

  async function resolveCta(c: CtaState, basePath: string) {
    if (c.type === "none") return { type: c.type, label: c.label, url: null, as: c.as };

    if (c.type === "pdf") {
      if (!c.pendingFile && !c.url) throw new Error(`CTA "${c.label}": falta PDF o URL.`);
      let finalUrl = c.url;
      if (c.pendingFile) {
        const safe = sanitizeName(c.pendingFile.name);
        const stamped = `${Date.now()} - ${safe}`;
        const pdfRef = ref(FbStorage, `${basePath}${stamped}`);
        await uploadBytes(pdfRef, c.pendingFile, {
          contentType: "application/pdf",
          cacheControl: "public,max-age=31536000,immutable",
        });
        finalUrl = await getDownloadURL(pdfRef);
      }
      return { type: "pdf", label: c.label, url: finalUrl, as: c.as };
    }

    if (c.type === "url") return { type: "url", label: c.label, url: c.url.trim(), as: c.as };
    if (c.type === "phone")
      return { type: "phone", label: c.label, url: `tel:${c.url.replace(/\s+/g, "")}`, as: c.as };
    if (c.type === "mailto")
      return { type: "mailto", label: c.label, url: `mailto:${c.url}`, as: c.as };

    return { type: "none", label: c.label, url: null, as: c.as };
  }

  function resetForm() {
    setTitle("");
    setDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setArtist("");
    setDescription("");
    setExternalVideoUrl("");
    setCta1({ type: "none", label: "Reservar", url: "", as: "button", pendingFile: null, pendingName: "" });
    setCta2({ type: "none", label: "Ver menú", url: "", as: "link", pendingFile: null, pendingName: "" });
    setSelectedMedia([]);
    setUploaderKey((k) => k + 1);
  }

  async function onSave() {
    if (!title) return alert(intl.formatMessage({ id: "pub.err.missingTitle", defaultMessage: "Falta el título" }));
    if (!date) return alert(intl.formatMessage({ id: "pub.err.missingDate", defaultMessage: "Falta la fecha" }));

    // NUEVO: validar fin ≥ inicio (usa fallback si faltan horas)
    {
      const startISO = new Date(`${date}T${(startTime || "00:00")}:00`);
      const endDateEff = endDate || date;
      // Si se indicó fecha final pero no hora final, asumimos fin del día:
      const endTimeEff = endTime || (endDate ? "23:59" : (startTime || "23:59"));
      const endISO = new Date(`${endDateEff}T${endTimeEff}:00`);

      if (endISO < startISO) {
        return alert("La fecha/hora final debe ser igual o posterior a la inicial.");
      }
    }

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      if (!FbAuth.currentUser) {
        await signInAnonymously(FbAuth);
      }
      await ensureAnon();

      // 1) Resolver CTAs
      const ctas = [await resolveCta(cta1, ctaBasePath), await resolveCta(cta2, ctaBasePath)];

      // 2) Subir media seleccionada
      type UploadedMedia = {
        name: string;
        path: string;
        url: string;
        contentType: string;
        resized?: Array<{ size: string; path: string; url: string }>;
      };
      const uploaded: UploadedMedia[] = [];

      for (const item of selectedMedia) {
        const f = item.file;

        // Nombres
        const safeFileName = sanitizeName(f.name);            // "Foto Patron (5).jpg"
        const displayName  = baseWithoutExt(safeFileName);    // "Foto Patron (5)"
        // const stampedName  = `${Date.now()} - ${safeFileName}`;
        const stampedName  = safeFileName;
        const objPath      = `${mediaBasePath}${stampedName}`; // destino del ORIGINAL

        // Subir ORIGINAL
        const r = ref(FbStorage, objPath);
        await uploadBytes(r, f, {
          contentType: f.type || "application/octet-stream",
          cacheControl: "public,max-age=31536000,immutable",
        });
        const originalUrl = await getDownloadURL(r);

        // ──────────────────────────────────────────────────────────────
        // Duplicado opcional a Galería: SOLO si es imagen (no altera flujo)
        // ──────────────────────────────────────────────────────────────
        if (galleryAlsoUploadImages) {
          const isImg =
            typeof isImageType === "function"
              ? isImageType(f.type)
              : (f.type || "").startsWith("image/");

          if (isImg) {
            try {
              const galleryPath = `PWAStorage/Imagenes/${stampedName}`;
              const gr = ref(FbStorage, galleryPath);
              await uploadBytes(gr, f, {
                contentType: f.type || "image/*",
                cacheControl: "public,max-age=31536000,immutable",
              });
              // Nota: NO cambiamos mediaItem ni Firestore; solo duplicamos en Storage.
            } catch (err) {
              console.warn("[Galería] Duplicado opcional falló:", err);
              // No interrumpimos el flujo principal.
            }
          }
        }


        // Registro base (si no hay .webp aún, usaremos el original)
        const mediaItem: UploadedMedia = {
          name: displayName,                       // nombre “humano” (sin timestamp ni extensión)
          path: objPath,                           // path original subido
          url: originalUrl,                        // URL original (se reemplaza si aparece webp)
          contentType: f.type || "application/octet-stream",
        };

        // Si es imagen y debemos esperar al webp en la MISMA carpeta
        if (WAIT_FOR_WEBP && isImageType(f.type)) {
          const size = RESIZED_SIZES[0]; // "700x700"
          const webpPath = webpVariantPathFromOriginalPath(objPath, size);

          try {
            const webpUrl = await waitDownloadURL(webpPath);
            mediaItem.resized = [{ size, path: webpPath, url: webpUrl }];
            // Usa el webp como principal
            mediaItem.path = webpPath;
            mediaItem.url = webpUrl;
            mediaItem.contentType = "image/webp";
          } catch (err) {
            console.warn("[WEBP] no encontrado aún; se usará el original:", webpPath, err);
          }
        }

        uploaded.push(mediaItem);
      }

      const coverUrl =
        uploaded.find((m) => Array.isArray(m.resized) && m.resized.length)?.resized?.[0]?.url ??
        uploaded.find((m) => isImageType(m.contentType))?.url ??
        null;

      // 4) Armar payload
      const startISO = new Date(`${date}T${(startTime || "00:00")}:00`);
      const endDateEff = endDate || date;
      const endTimeEff = endTime || (endDate ? "23:59" : (startTime || "23:59"));
      const endISO = new Date(`${endDateEff}T${endTimeEff}:00`);

      const payload = {
        title,
        slug,
        artist: artist || null,

        // Conserva 'date' y añade 'dateEnd'
        date,                         // YYYY-MM-DD
        dateEnd: endDate || date,     // YYYY-MM-DD

        startTime: startTime || null, // "HH:mm"
        endTime: endTime || null,     // "HH:mm"

        startAt: startISO.toISOString(),
        endAt: endISO.toISOString(),

        timezone: "America/Toronto",
        location: location || null,
        description: description || null,

        externalVideoUrl: externalVideoUrl || null,

        mediaStorageBase: mediaBasePath,
        coverUrl,
        media: uploaded,
        ctas,

        createdAt: serverTimestamp(),
        status: "published",
      };

      // 5) Escribir en Firestore
      await addDoc(collection(FbDB, "events"), payload);

      setSuccessMsg(
        intl.formatMessage({ id: "pub.save.ok", defaultMessage: 'Publicación guardada: "{title}"' }, { title })
      );
      resetForm();
      // router.push(`/eventos/${slug}`);
    } catch (e: any) {
      console.error("[SAVE][ERROR]", e?.code, e?.message, e);
      const msg =
        e?.code === "permission-denied"
          ? intl.formatMessage({
              id: "pub.err.perm",
              defaultMessage:
                "Firestore bloqueó la escritura (permission-denied). Revisa reglas para /events.",
            })
          : e?.code === "storage/unauthorized"
          ? intl.formatMessage({
              id: "pub.err.storage",
              defaultMessage: "Storage bloqueó una subida (unauthorized). Revisa reglas de Storage.",
            })
          : intl.formatMessage({
              id: "pub.err.unknown",
              defaultMessage: "Ocurrió un error guardando. Revisa la consola.",
            });
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={`mx-auto max-w-5xl ${styles.pagePad}`}>
      <h1 className={styles.title}>
        <ThemeToggle />
        <FM id="pub.new.h1" defaultMessage="Nueva publicación" />
      </h1>

      {successMsg && (
        <div className={styles.alertOk}>
          <p className="font-medium">{successMsg}</p>
          <p className="text-sm">
            <FM id="pub.save.view" defaultMessage="Ver en " />
            <a className="underline font-semibold" href={`/${locale}/blog`} target="_blank" rel="noreferrer">
              /blog
            </a>
            .
          </p>
        </div>
      )}
      {errorMsg && (
        <div className={styles.alertError}>
          {errorMsg}
        </div>
      )}

      <section className={`grid md:grid-cols-2 ${styles.gridGapLg}`}>
        {/* Formulario */}
        <div className={styles.stackY}>
          <div>
            <label className={styles.label}>
              <FM id="pub.title" defaultMessage="Título" />
            </label>
            <input
              className={`${fieldBase} force-readable`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={intl.formatMessage({ id: "pub.title.ph", defaultMessage: "Noche Mexicana" })}
              required
            />
            <p className={styles.help}><FM id="pub.slug.label" defaultMessage="Slug: " />{slug}</p>
          </div>

          <div className={`grid grid-cols-2 ${styles.gapSm}`}>
            <div>
              <label className={styles.label}>
                <FM id="pub.date" defaultMessage="Fecha" />
              </label>
              <input
                type="date"
                className={`${fieldBase} force-readable`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={styles.label}>
                <FM id="pub.enddate" defaultMessage="Fecha Final" />
              </label>
              <input
                type="date"
                className={`${fieldBase} force-readable`}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={date || undefined}
              />
              <p className={styles.help}><FM id="pub.date.help" defaultMessage="Debe ser igual o posterior a la fecha inicial." /></p>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className={styles.label}>
                  <FM id="pub.time.start" defaultMessage="Hora inicio" />
                </label>
                <input
                  type="time"
                  className={`${fieldBase} force-readable`}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className={styles.label}>
                  <FM id="pub.time.end" defaultMessage="Hora fin" />
                </label>
                <input
                  type="time"
                  className={`${fieldBase} force-readable`}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={styles.label}>
              <FM id="pub.place" defaultMessage="Lugar" />
            </label>
            <input
              className={`${fieldBase} force-readable`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={intl.formatMessage({ id: "pub.place.ph", defaultMessage: "Patrón Bar & Grill" })}
            />
          </div>

          <div>
            <label className={styles.label}>
              <FM id="pub.artist" defaultMessage="Artista (opcional)" />
            </label>
            <input
              className={`${fieldBase} force-readable`}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder={intl.formatMessage({ id: "pub.artist.ph", defaultMessage: "DJ Invitado" })}
            />
          </div>

          <div>
            <label className={styles.label}>
              <FM id="pub.description" defaultMessage="Descripción" />
            </label>
            <textarea
              className={`${fieldBase} force-readable min-h-[120px]`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={intl.formatMessage({
                id: "pub.desc.ph",
                defaultMessage: "Detalles del evento, promociones, dress code, etc.",
              })}
            />
          </div>

          <div>
            <label className={styles.label}>
              <FM id="pub.extvideo" defaultMessage="URL de video externo" />
            </label>
            <input
              className={`${fieldBase} force-readable`}
              value={externalVideoUrl}
              onChange={(e) => setExternalVideoUrl(e.target.value)}
              placeholder={intl.formatMessage({
                id: "pub.extvideo.ph",
                defaultMessage: "https://youtu.be/… o https://vimeo.com/…",
              })}
            />
          </div>

          {/* CTA 1 */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="font-medium">
              <FM id="pub.cta1.title" defaultMessage="CTA 1" />
            </h3>
            <div className={`grid grid-cols-2 ${styles.inlineSm}`}>
              <select
                className={`${fieldBase} force-readable`}
                value={cta1.type}
                onChange={(e) => setCta1((p) => ({ ...p, type: e.target.value as CtaType }))}
              >
                <option value="none">
                  <FM id="pub.cta.none" defaultMessage="Sin CTA" />
                </option>
                <option value="url">
                  <FM id="pub.cta.url" defaultMessage="URL" />
                </option>
                <option value="pdf">
                  <FM id="pub.cta.pdf" defaultMessage="PDF" />
                </option>
                <option value="phone">
                  <FM id="pub.cta.phone" defaultMessage="Teléfono" />
                </option>
                <option value="mailto">
                  <FM id="pub.cta.mail" defaultMessage="Correo" />
                </option>
              </select>
              <input
                className={`${fieldBase} force-readable`}
                value={cta1.label}
                onChange={(e) => setCta1((p) => ({ ...p, label: e.target.value }))}
                placeholder={intl.formatMessage({
                  id: "pub.cta.label.ph.reserve",
                  defaultMessage: "Texto (p.ej. Reservar)",
                })}
              />
            </div>

            <label className={`inline-flex items-center ${styles.inlineSm}`}>
              <input
                type="checkbox"
                checked={cta1.as === "button"}
                onChange={(e) => setCta1((p) => ({ ...p, as: e.target.checked ? "button" : "link" }))}
              />
              <FM id="pub.cta.asButton" defaultMessage="Mostrar como botón (desmarca para enlace)" />
            </label>

            {cta1.type === "url" && (
              <input
                className={`${fieldBase} force-readable`}
                value={cta1.url}
                onChange={(e) => setCta1((p) => ({ ...p, url: e.target.value }))}
                placeholder={intl.formatMessage({ id: "pub.cta1.url.ph", defaultMessage: "https://tu-destino.com" })}
              />
            )}
            {cta1.type === "phone" && (
              <input
                className={`${fieldBase} force-readable`}
                value={cta1.url}
                onChange={(e) => setCta1((p) => ({ ...p, url: e.target.value }))}
                placeholder="+1 555 123 4567"
              />
            )}
            {cta1.type === "mailto" && (
              <input
                className={`${fieldBase} force-readable`}
                value={cta1.url}
                onChange={(e) => setCta1((p) => ({ ...p, url: e.target.value }))}
                placeholder={intl.formatMessage({
                  id: "pub.cta.mail.placeholder",
                  defaultMessage: "reservas@patron.com",
                })}
              />
            )}
            {cta1.type === "pdf" && (
              <>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handlePickPdf(e, setCta1)}
                  className={`${fieldBase} force-readable`}
                />
                {cta1.pendingFile && (
                  <p className={styles.muted}>
                    <FM id="pub.cta.pdf.pending" defaultMessage="PDF pendiente:" />{" "}
                    {cta1.pendingName}
                  </p>
                )}
              </>
            )}
          </div>

          {/* CTA 2 */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="font-medium">
              <FM id="pub.cta2.title" defaultMessage="CTA 2" />
            </h3>
            <div className={`grid grid-cols-2 ${styles.inlineSm}`}>
              <select
                className={`${fieldBase} force-readable`}
                value={cta2.type}
                onChange={(e) => setCta2((p) => ({ ...p, type: e.target.value as CtaType }))}
              >
                <option value="none">
                  <FM id="pub.cta.none" defaultMessage="Sin CTA" />
                </option>
                <option value="url">
                  <FM id="pub.cta.url" defaultMessage="URL" />
                </option>
                <option value="pdf">
                  <FM id="pub.cta.pdf" defaultMessage="PDF" />
                </option>
                <option value="phone">
                  <FM id="pub.cta.phone" defaultMessage="Teléfono" />
                </option>
                <option value="mailto">
                  <FM id="pub.cta.mail" defaultMessage="Correo" />
                </option>
              </select>
              <input
                className={`${fieldBase} force-readable`}
                value={cta2.label}
                onChange={(e) => setCta2((p) => ({ ...p, label: e.target.value }))}
                placeholder={intl.formatMessage({ id: "pub.cta.label.ph.menu", defaultMessage: "Texto (p.ej. Ver menú)" })}
              />
            </div>

            <label className={`inline-flex items-center ${styles.inlineSm}`}>
              <input
                type="checkbox"
                checked={cta2.as === "button"}
                onChange={(e) => setCta2((p) => ({ ...p, as: e.target.checked ? "button" : "link" }))}
              />
              <FM id="pub.cta.asButton" defaultMessage="Mostrar como botón (desmarca para enlace)" />
            </label>

            {cta2.type === "url" && (
              <input
                className={`${fieldBase} force-readable`}
                value={cta2.url}
                onChange={(e) => setCta2((p) => ({ ...p, url: e.target.value }))}
                placeholder={intl.formatMessage({ id: "pub.cta2.url.ph", defaultMessage: "https://otro-destino.com" })}
              />
            )}
            {cta2.type === "phone" && (
              <input
                className={`${fieldBase} force-readable`}
                value={cta2.url}
                onChange={(e) => setCta2((p) => ({ ...p, url: e.target.value }))}
                placeholder="+1 555 987 6543"
              />
            )}
            {cta2.type === "mailto" && (
              <input
                className={`${fieldBase} force-readable`}
                value={cta2.url}
                onChange={(e) => setCta2((p) => ({ ...p, url: e.target.value }))}
                placeholder={intl.formatMessage({
                  id: "pub.contact.email.ph",
                  defaultMessage: "contacto@patron.com",
                })}
              />
            )}
            {cta2.type === "pdf" && (
              <>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handlePickPdf(e, setCta2)}
                  className={`${fieldBase} force-readable`}
                />
                {cta2.pendingFile && (
                  <p className={styles.muted}>
                    <FM id="pub.cta.pdf.pending" defaultMessage="PDF pendiente:" />{" "}
                    {cta2.pendingName}
                  </p>
                )}
              </>
            )}
          </div>

          {/* BOTÓN con tu estilo */}
          <button
            onClick={onSave}
            disabled={saving}
            className={`mt-3 inline-flex items-center justify-center ${styles.primaryBtn}
              ${saving ? "opacity-60 cursor-not-allowed" : "hover:scale-[.99] active:scale-[.97]"}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black
            `}
            title="Guardar publicación"
          >
            {saving
              ? intl.formatMessage({ id: "pub.save.saving", defaultMessage: "Guardando…" })
              : intl.formatMessage({ id: "pub.save.cta", defaultMessage: "Guardar publicación" })}
          </button>
        </div>

        {/* Uploader (sube al guardar) */}
        <div>
          <h2 className={styles.secTitle}>
            <FM id="pub.media.h2" defaultMessage="Medios" />
          </h2>
          <p className={styles.secSubtitle}>
            <FM
              id="pub.media.help"
              defaultMessage={'Previsualiza, elimina/restaura y selecciona. Se sube todo al guardar. Las imágenes tendrán <code>*.webp</code> redimensionadas (p. ej. {sizes}).'}
              values={{
                sizes: RESIZED_SIZES.join(", "),
                code: (chunks) => <code key="msg-code">{chunks}</code>,
              }}
            />
          </p>

          <label className="inline-flex items-center gap-2 text-sm mb-2">
            <input
              type="checkbox"
              checked={galleryAlsoUploadImages}
              onChange={(e) => setGalleryAlsoUploadImages(e.target.checked)}
            />
            <span>
              <strong><FM id="pub.gallery.upload" defaultMessage="Subir a Galería" /></strong>
            </span>
          </label>

          <FilesUploaderComp
            key={uploaderKey}
            deferUpload
            onChange={(files) => setSelectedMedia(files)}
            resizedSuffixSize="700x700"
            cloud={{
              store: true,
              path: `events/${slug}/media/`,
              storageFiles: { appName: APP_NAME, fileTypes: "Any" },
              TypeSize: "Mb",
              maxSizeImg: 8,
              maxSizeFile: 100,
            }}
            selection={{ multiple: true, DocumentCap: 12, display: { visible: true, maxRowsDisplay: 2 } }}
            compTitles={{
              select: intl.formatMessage({ id: "uploader.select", defaultMessage: "Seleccionar archivos" }),
              restore: intl.formatMessage({ id: "uploader.restore", defaultMessage: "Restaurar" }),
              submit: intl.formatMessage({ id: "uploader.submit", defaultMessage: "Subir" }),
            }}
            blockWidth={180}
            blockHeight={120}
          />

          <div className={`mt-4 ${styles.notesBox}`}>
            <p className={styles.noteHead}>
              <FM id="pub.cta.pdf.folder" defaultMessage="Carpeta final:" />
            </p>
            <code className="break-all">{mediaBasePath}</code>
          </div>
        </div>
      </section>
    </main>
  );
}