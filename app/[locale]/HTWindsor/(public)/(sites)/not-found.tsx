'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import styles from './NotFound.module.css';

import { BUTTON, LINK, NEXTIMAGE, IMAGE, DIV, INPUT, SELECT, LABEL, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";

import FM from '@/complements/i18n/FM';

type Locale = 'es' | 'en' | 'fr';

// Definimos las rutas “base” una sola vez; el label se traduce por id
const ROUTES: Array<{ slug: string; labelId: string; defaultLabel: string }> = [
  { slug: '',            labelId: 'nav.home',           defaultLabel: 'Home' },
  { slug: 'home',        labelId: 'nav.homeAlt',        defaultLabel: 'Home' },
  { slug: 'reservas',    labelId: 'nav.reservas',       defaultLabel: 'Reservations' },
  { slug: 'blog',        labelId: 'nav.blog',           defaultLabel: 'Blog' },
  { slug: 'menu',        labelId: 'nav.menu',           defaultLabel: 'Menu' },
  { slug: 'galeria',     labelId: 'nav.galeria',        defaultLabel: 'Gallery' },
  { slug: 'about-us',    labelId: 'nav.about',          defaultLabel: 'About us' },
];

export default function NotFound() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const intl = useIntl();

  const locale = useMemo<Locale>(() => {
    const seg = pathname.split('/')[1];
    return (['es', 'en', 'fr'].includes(seg) ? (seg as Locale) : 'es');
  }, [pathname]);

  const t = (id: string, values?: Record<string, any>, def?: string) =>
    intl.formatMessage({ id, defaultMessage: def }, values);

  // Construimos los links del locale actual
  const links = useMemo(
    () =>
      ROUTES.map(r => ({
        href: `/${locale}${r.slug ? '/' + r.slug : ''}`,
        labelId: r.labelId,
        defaultLabel: r.defaultLabel,
      })),
    [locale]
  );

  const [query, setQuery] = useState('');
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [seconds, setSeconds] = useState(10);

  // parar countdown al primer gesto
  useEffect(() => {
    if (!autoRedirect) return;
    const stop = () => setAutoRedirect(false);
    window.addEventListener('keydown', stop);
    window.addEventListener('pointerdown', stop, { passive: true } as any);
    return () => {
      window.removeEventListener('keydown', stop);
      window.removeEventListener('pointerdown', stop as any);
    };
  }, [autoRedirect]);

  // countdown
  useEffect(() => {
    if (!autoRedirect) return;
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [autoRedirect]);

  useEffect(() => {
    if (autoRedirect && seconds <= 0) router.replace(`/${locale}`);
  }, [seconds, autoRedirect, router, locale]);

  // filtro (usamos href y el defaultLabel como texto de búsqueda)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter(
      l =>
        l.href.toLowerCase().includes(q) ||
        l.defaultLabel.toLowerCase().includes(q)
    );
  }, [links, query]);

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <H1 className={styles.title}>
          404 — <FM id="404.title" defaultMessage="Page not found" />
        </H1>
        <P className={styles.subtitle}>
          <FM
            id="404.desc"
            defaultMessage="The page you were looking for does not exist or moved."
          />
        </P>

        <div className={styles.searchRow}>
          <INPUT
            className={styles.search}
            type="search"
            placeholder={t('404.searchPh', undefined, 'Search…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <LINK className={styles.homeBtn} href={`/${locale}`}>
            <FM id="404.backHome" defaultMessage="Back to home" />
          </LINK>
        </div>

        <div className={styles.autoRow}>
          {autoRedirect ? (
            <>
              <SPAN className={styles.muted}>
                <FM
                  id="404.auto"
                  defaultMessage="Redirecting in {seconds}s…"
                  values={{ seconds }}
                />
              </SPAN>
              <BUTTON className={styles.cancelBtn} onClick={() => setAutoRedirect(false)}>
                <FM id="404.cancel" defaultMessage="Cancel redirect" />
              </BUTTON>
            </>
          ) : (
            <SPAN className={styles.muted}>
              <FM id="404.disabled" defaultMessage="Auto-redirect disabled." />
            </SPAN>
          )}
        </div>

        <H2 className={styles.sectionTitle}>
          <FM id="404.popular" defaultMessage="Available pages" />
        </H2>

        <nav className={styles.grid}>
          {filtered.map((l) => (
            <LINK key={l.href} href={l.href} className={styles.linkItem}>
              <SPAN className={styles.linkLabel}>
                <FM id={l.labelId} defaultMessage={l.defaultLabel} />
              </SPAN>
              <SPAN className={styles.linkPath}>{l.href}</SPAN>
            </LINK>
          ))}
        </nav>
      </div>
    </main>
  );
}
