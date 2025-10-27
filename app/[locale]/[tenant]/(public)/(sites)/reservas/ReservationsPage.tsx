'use client';

import React, { useRef, useState } from "react";
import styles from './reservations.module.css';
import emailjs from '@emailjs/browser';
import { FormattedMessage, useIntl } from 'react-intl';
import FM from "@/complements/i18n/FM";
import { JsonLd } from "@/complements/components/Seo/JsonLd";
import { buildVenueSchema, buildWebSiteSchema } from "@/app/lib/seo/schema";

type Props = { locale: string };

interface IContactForm {
  name: string;
  email: string;
  reason: string;
  message: string;
  date: Date;
  phone: string;
  asistentes: string; // mantenemos string para patrón/longitud como en tu versión
}

// "mañana" 00:00
const tomorrowAtMidnight = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateTimeLocal = (date: Date) => date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

export default function ReservationsPage({ locale }: Props) {
  const intl = useIntl();
  const form = useRef<HTMLFormElement | null>(null);

  const tomorrow = tomorrowAtMidnight();

  const [contactForm, setContactForm] = useState<IContactForm>({
    name: '',
    email: '',
    reason: '',
    message: '',
    date: tomorrow,
    phone: '',
    asistentes: '',
  });

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();

    emailjs.sendForm(
      'service_0ectyef',
      'reservations_El_Patron',
      form.current!,
      'o7g5WOnlU57u5KjeT'
    ).then(
      (result) => {
        alert(
          intl.formatMessage({ id: 'reservation.sent', defaultMessage: 'Reserva enviada' }) +
          (result?.text ? `: ${result.text}` : '')
        );
        setContactForm({
          name: '',
          email: '',
          reason: '',
          message: '',
          date: tomorrowAtMidnight(),
          phone: '',
          asistentes: '',
        });
      },
      (error) => {
        console.error('Reservation error: ', error?.text || error);
        alert(intl.formatMessage({ id: 'reservation.error', defaultMessage: 'Error al enviar la reserva.' }));
      }
    );
  };

  const phoneInvalid =
    contactForm.phone.length >= 7 &&
    (contactForm.phone.length !== 10 || contactForm.phone.startsWith('0'));

  const asistentesInvalid =
    contactForm.asistentes.length >= 1 &&
    (contactForm.asistentes.startsWith('0') ||
     Number(contactForm.asistentes) < 1 ||
     Number(contactForm.asistentes) > 199);

  return (
    <>
      <JsonLd data={buildVenueSchema()} />
      <JsonLd data={buildWebSiteSchema()} />

      <main className={styles.main}>
        <div className={styles.container}>
          <form method="post" ref={form} onSubmit={sendEmail} className={styles.form}>
            {/* Nombre */}
            <label htmlFor="name">
              <FM id="reservation.name" defaultMessage="Nombre:" />
            </label>
            <input
              name="name"
              id="name"
              type="text"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              placeholder={intl.formatMessage({ id: 'reservation.name.ph', defaultMessage: 'Tu nombre' })}
              aria-label={intl.formatMessage({ id: 'reservation.name', defaultMessage: 'Nombre:' })}
              required
            />

            {/* Email */}
            <label htmlFor="email">
              <FM id="reservation.email" defaultMessage="Correo:" />
            </label>
            <input
              name="email"
              id="email"
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              placeholder={intl.formatMessage({ id: 'reservation.email.ph', defaultMessage: 'tucorreo@ejemplo.com' })}
              aria-label={intl.formatMessage({ id: 'reservation.email', defaultMessage: 'Correo:' })}
              required
            />

            {/* Teléfono */}
            <label htmlFor="phone">
              <FM id="reservation.phone" defaultMessage="Teléfono:" />
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={contactForm.phone}
              maxLength={10}
              pattern="[1-9][0-9]{9}"
              placeholder={intl.formatMessage({ id: 'reservation.phone.ph', defaultMessage: 'Ej. 5199999999' })}
              aria-label={intl.formatMessage({ id: 'reservation.phone', defaultMessage: 'Teléfono:' })}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setContactForm({ ...contactForm, phone: value });
              }}
              required
            />
            {phoneInvalid && (
              <p className={styles.errorText} role="alert">
                <FM id="reservation.phoneWarning" defaultMessage="Debe tener 10 dígitos y no iniciar en 0" />
              </p>
            )}

            {/* Fecha y hora */}
            <label htmlFor="date">
              <FM id="reservation.date" defaultMessage="Fecha y hora:" />
            </label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={formatDateTimeLocal(contactForm.date)}
              min={formatDateTimeLocal(tomorrow)}
              onChange={(e) => setContactForm({ ...contactForm, date: new Date(e.target.value) })}
              aria-label={intl.formatMessage({ id: 'reservation.date', defaultMessage: 'Fecha y hora:' })}
              required
            />

            {/* Motivo / Razón */}
            <label htmlFor="reason">
              <FM id="reservation.reason" defaultMessage="Motivo:" />
            </label>
            <input
              name="reason"
              id="reason"
              type="text"
              value={contactForm.reason}
              onChange={(e) => setContactForm({ ...contactForm, reason: e.target.value })}
              placeholder={intl.formatMessage({ id: 'reservation.reason.ph', defaultMessage: 'Cumpleaños, aniversario, etc.' })}
              aria-label={intl.formatMessage({ id: 'reservation.reason', defaultMessage: 'Motivo:' })}
            />

            {/* Asistentes */}
            <label htmlFor="asistentes">
              <FM id="reservation.asistants" defaultMessage="Número de asistentes:" />
            </label>
            <input
              type="number"
              id="asistentes"
              name="asistentes"
              value={contactForm.asistentes}
              inputMode="numeric"
              min={1}
              max={199}
              placeholder={intl.formatMessage({ id: 'reservation.asistants.ph', defaultMessage: 'Ej. 2' })}
              aria-label={intl.formatMessage({ id: 'reservation.asistants', defaultMessage: 'Número de asistentes:' })}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, '');
                setContactForm({ ...contactForm, asistentes: onlyDigits });
              }}
              required
            />
            {asistentesInvalid && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                <FM id="reservation.asistantsWarning" defaultMessage="Entre 1 y 199" />
              </p>
            )}

            {/* Mensaje */}
            <label htmlFor="message">
              <FM id="reservation.message" defaultMessage="Mensaje:" />
            </label>
            <textarea
              name="message"
              id="message"
              rows={4}
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              placeholder={intl.formatMessage({ id: 'reservation.message.ph', defaultMessage: 'Detalles adicionales (opcional)' })}
              aria-label={intl.formatMessage({ id: 'reservation.message', defaultMessage: 'Mensaje:' })}
            />

            <button type="submit">
              <FM id="reservation.submit" defaultMessage="Enviar" />
            </button>
          </form>
        </div>
      </main>
    </>
  );
}