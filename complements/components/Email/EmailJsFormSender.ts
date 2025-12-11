'use client';

import emailjs, { type EmailJSResponseStatus } from '@emailjs/browser';

export type EmailJsConfig = {
  serviceId: string;
  templateId: string;
  publicKey: string;
};

/**
 * Envia un formulario HTML usando EmailJS.
 * Reusable para cualquier formulario con ref.
 */
export function sendEmailJsForm(
  form: HTMLFormElement,
  config: EmailJsConfig
): Promise<EmailJSResponseStatus> {
  const { serviceId, templateId, publicKey } = config;

  if (!serviceId || !templateId || !publicKey) {
    return Promise.reject(
      new Error('EmailJS config incomplete: missing serviceId/templateId/publicKey')
    );
  }

  return emailjs.sendForm(serviceId, templateId, form, publicKey);
}
