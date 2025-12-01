'use client';

import styles from './FooterComp.module.css';
import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { FbAuth } from '@/app/lib/services/firebase';
import { useIntl } from 'react-intl';
import FM from '@/complements/i18n/FM';
import { useAppContext } from '@/context/AppContext';
import {
  BUTTON,
  LINK,
  NEXTIMAGE,
  IMAGE,
  DIV,
  INPUT,
  SELECT,
  LABEL,
  SPAN,
  SPAN1,
  SPAN2,
  A,
  B,
  P,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
} from '@/complements/components/ui/wrappers';

type LinkItem = {
  name?: string;
  title?: string;
  url?: string;
  href?: string;
  enabled?: boolean;
  icon?: string;
};

/** Normaliza cadena para matching por alias */
const norm = (s?: string) =>
  (s ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

/** Devuelve url string si el valor es string u objeto con url/href */
const toUrl = (v: any): string | undefined =>
  typeof v === 'string' ? v : v?.url ?? v?.href ?? undefined;

/** Busca un link por alias en un ARREGLO de links */
const pickFromArray = (arr: LinkItem[] | undefined, aliases: string[]) => {
  if (!Array.isArray(arr)) return null;
  const keys = aliases.map(norm);
  return arr.find((it) => keys.includes(norm(it.name) || norm(it.title)));
};

/** Lee un link del OBJETO legado (platforms/socials como objeto) */
const pickFromObject = (obj: any, keys: string[]) => {
  if (!obj || Array.isArray(obj) || typeof obj !== 'object') return null;
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
  }
  return null;
};

/** Unifica acceso (array u objeto) y devuelve {enabled,url,item} */
const resolveLink = (
  source: any,
  aliases: string[],
): { enabled: boolean; url?: string; item?: any } => {
  // 1) Objeto legado
  const legacy = pickFromObject(source, aliases);
  if (legacy) {
    const url = toUrl(legacy);
    const enabled =
      typeof legacy?.enabled === 'boolean' ? legacy.enabled : Boolean(url);
    return { enabled, url, item: legacy };
  }
  // 2) Array recomendado
  const arrItem = pickFromArray(source as LinkItem[], aliases);
  if (arrItem) {
    const url = toUrl(arrItem);
    const enabled =
      typeof arrItem?.enabled === 'boolean' ? arrItem.enabled : Boolean(url);
    return { enabled, url, item: arrItem };
  }
  // 3) Nada
  return { enabled: false };
};

/**
 * Defensivo para textos provenientes de Branding que puedan venir como:
 * - string / number
 * - ReactElement vivo (<FM />)
 * - ReactElement serializado { key,type,ref,props }
 */
const renderBrandingText = (value: any): ReactNode => {
  if (value == null) return null;

  const t = typeof value;

  // caso normal
  if (t === 'string' || t === 'number') return value;

  if (t === 'object') {
    const anyVal = value as any;

    // ReactElement vivo (tiene $$typeof)
    if (anyVal.$$typeof) {
      return anyVal as ReactNode;
    }

    // Objeto “muerto” tipo { key,type,ref,props }
    const props = anyVal.props ?? {};

    if (typeof props.defaultMessage === 'string') {
      return props.defaultMessage;
    }

    const children = props.children;
    if (typeof children === 'string' || typeof children === 'number') {
      return children;
    }

    if (Array.isArray(children)) {
      const firstText = children.find(
        (c: any) => typeof c === 'string' || typeof c === 'number',
      );
      if (firstText != null) return firstText;
    }
  }

  // último recurso
  try {
    return String(value);
  } catch {
    return '';
  }
};

/** Alias específico para las sucursales */
const renderBranchName = (name: any): ReactNode => renderBrandingText(name);

export default function FooterComp() {
  const { Branding } = useAppContext();
  const [authUser, setAuthUser] = useState<any>(null);
  const intl = useIntl();

  // --- Platforms (array u objeto) ---
  const platformsSrc = (Branding as any)?.platforms;
  const onlineOrder = resolveLink(platformsSrc, [
    'onlineorder',
    'online order',
    'order online',
  ]);
  const uberEats = resolveLink(platformsSrc, ['ubereats', 'uber eats', 'uber']);
  const skipTheDishes = resolveLink(platformsSrc, [
    'skipthedishes',
    'skip the dishes',
    'skip',
  ]);
  const doordash = resolveLink(platformsSrc, ['doordash', 'door dash']);

  // --- Socials (array u objeto) ---
  const socialsSrc = (Branding as any)?.socials;
  const instagram = resolveLink(socialsSrc, ['instagram', 'ig']);
  const facebook = resolveLink(socialsSrc, ['facebook', 'fb']);
  const tiktok = resolveLink(socialsSrc, ['tiktok', 'tik tok']);
  const youtube = resolveLink(socialsSrc, ['youtube', 'yt']);

  // --- Contacto ---
  const googleMapsUrl =
    toUrl((Branding as any)?.contact?.googleMaps) ||
    toUrl((Branding as any)?.contact?.maps);

  const branches = Array.isArray(Branding?.company?.branches)
    ? Branding.company.branches
    : [];

  useEffect(() => {
    const unsub = onAuthStateChanged(FbAuth, (u) => setAuthUser(u));
    return () => unsub();
  }, []);

  const handleGuest = async () => {
    if (!FbAuth.currentUser) await signInAnonymously(FbAuth);
  };

  type Address = {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  const address: Address = (Branding.contact?.address ?? {}) as Address;

  const fullAddress = [
    address.street,
    address.city,
    address.state,
    address.zip,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerRestaurants}>
          <H3 className={styles.footerTitle}>
            <FM
              defaultMessage="Nuestras Recomendaciones"
              id="Home.Recomendaciones"
            />
          </H3>

          {branches.length > 0 && (
            <ul className={styles.footerRestaurantsList}>
              {branches.map((b: any, i: number) => (
                <li key={i}>
                  <A
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                  >
                    {b.icon ? (
                      <NEXTIMAGE
                        src={b.icon!}
                        width={16}
                        height={16}
                        alt="Branch Icon"
                      />
                    ) : null}{' '}
                    <SPAN>{renderBranchName(b.name)}</SPAN>
                  </A>
                </li>
              ))}
            </ul>
          )}
        </div>

        <H2 className={styles.title}>
          <FM id="footer.title" defaultMessage="Gracias por visitarnos" />
        </H2>

        <P className={styles.text}>
          <FM
            id="footer.platforms"
            defaultMessage="Síguenos en nuestras redes sociales para mantenerte al día con nuestros eventos y promociones."
          />
        </P>

        <div className={styles.socials}>
          {onlineOrder.enabled && onlineOrder.url && (
            <LINK
              href={onlineOrder.url}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              <NEXTIMAGE
                src="/Icons/onlineOrder.png"
                width={40}
                height={40}
                alt={intl.formatMessage({
                  id: 'footer.alt.onlineorder',
                  defaultMessage: 'Online Order',
                })}
              />
            </LINK>
          )}

          {doordash.enabled && doordash.url && (
            <LINK
              href={doordash.url}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              <NEXTIMAGE
                src="/Icons/Doordash.png"
                width={40}
                height={40}
                alt={intl.formatMessage({
                  id: 'footer.alt.doordash',
                  defaultMessage: 'Doordash',
                })}
              />
            </LINK>
          )}

          {uberEats.enabled && uberEats.url && (
            <LINK
              href={uberEats.url}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              <NEXTIMAGE
                src="/Icons/Uber Eats.png"
                width={40}
                height={40}
                alt={intl.formatMessage({
                  id: 'footer.alt.ubereats',
                  defaultMessage: 'Uber Eats',
                })}
              />
            </LINK>
          )}

          {skipTheDishes.enabled && skipTheDishes.url && (
            <LINK
              href={skipTheDishes.url}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              <NEXTIMAGE
                src="/Icons/SkipTheDishes.jpg"
                width={40}
                height={40}
                alt={intl.formatMessage({
                  id: 'footer.alt.skipthedishes',
                  defaultMessage: 'Skip The Dishes',
                })}
              />
            </LINK>
          )}
        </div>

        <P className={styles.text}>
          <FM
            id="footer.description"
            defaultMessage="Síguenos en nuestras redes sociales para mantenerte al día con nuestros eventos y promociones."
          />
        </P>

        <div className={styles.socials}>
          {facebook.enabled && facebook.url && (
            <LINK
              href={facebook.url}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              <NEXTIMAGE
                src="/Icons/FacebookIcon.png"
                width={40}
                height={40}
                alt="Facebook"
              />
            </LINK>
          )}

          {instagram.enabled && instagram.url && (
            <LINK
              href={instagram.url}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              <NEXTIMAGE
                src="/Icons/InstaIcon.png"
                width={40}
                height={40}
                alt="Instagram"
              />
            </LINK>
          )}

          {tiktok.enabled && tiktok.url && (
            <LINK
              href={tiktok.url}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              <NEXTIMAGE
                src="/Icons/TikTok.webp"
                width={40}
                height={40}
                alt="TikTok"
              />
            </LINK>
          )}
        </div>

        <div
          className={`container mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between ${styles.containerPad} ${styles.rowGapY} ${styles.address}`}
        >
          <div>
            <strong>{renderBrandingText(Branding.company?.brandName)}</strong>
            <br />
            <address className="not-italic">{fullAddress}</address>

            {Branding.contact?.phone && (
              <A href={`tel:+${Branding.contact.phone}`} className="underline">
                <FM id="footer.phone" defaultMessage="Company Phone" />
              </A>
            )}
          </div>
        </div>

        {/* Accesos utilitarios */}
        <div className={styles.socials} style={{ marginTop: '0.75rem' }}>
          {/* Google Maps */}
          {googleMapsUrl && (
            <LINK
              href={googleMapsUrl}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              <FM id="footer.gmaps" defaultMessage="Google Maps" />
            </LINK>
          )}

          {/* WhatsApp (mismo número del teléfono de contacto) */}
          {Branding.contact?.phone ? (
            <LINK
              href={`https://wa.me/${Branding.contact.phone}?text=Hola%20El%20Patr%C3%B3n%2C%20quiero%20informaci%C3%B3n.`}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              WhatsApp
            </LINK>
          ) : null}

          {/* Email */}
          {Branding.contact?.email ? (
            <A
              href={`mailto:${Branding.contact.email}?subject=Consulta%20desde%20el%20sitio`}
              className={styles.icon}
            >
              {Branding.contact.email}
            </A>
          ) : null}

          {/* YouTube */}
          {youtube.enabled && youtube.url && (
            <LINK
              href={youtube.url}
              className={styles.icon}
              target="_blank"
              rel="noopener"
            >
              <FM id="footer.youtube" defaultMessage="YouTube" />
            </LINK>
          )}
        </div>
      </div>
    </footer>
  );
}
