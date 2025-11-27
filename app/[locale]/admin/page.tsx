'use client';

import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SELECT2, LABEL2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import { useParams } from 'next/navigation';
import AdminGuard from '@/complements/admin/AdminGuard'; 
import styles from './admin-home.module.css';
import FM from '@/complements/i18n/FM';
import { useAppContext } from "@/context/AppContext";

export default function AdminHome() {
  const { locale } = useParams<{ locale: string }>();
  const L = (p: string) => `/${locale}${p}`;

  const { Settings } = useAppContext();

  const cards = [
    {
      key: 'settings',
      title: <FM id="settings.title" defaultMessage="Configuración" />,
      desc: <FM id="settings.description" defaultMessage="Ajuste de Configuraciones" />,
      href: L('/admin/settings'),
    },
    {
      key: 'branding',
      title: <FM id="branding.title" defaultMessage="Branding" />,
      desc: <FM id="branding.description" defaultMessage="Configuración de la Marca" />,
      href: L('/admin/branding'),
    },
    {
      key: 'styling',
      title: <FM id="styling.title" defaultMessage="Estilo" />,
      desc: <FM id="styling.description" defaultMessage="Configuración de Estilos" />,
      href: L('/admin/styles'),
    },
    {
      key: 'cloud',
      title: <FM id="cloud.title" defaultMessage="CloudQueries" />,
      desc: <FM id="cloud.description" defaultMessage="Consultas y herramientas de datos" />,
      href: L('/admin/CloudQueries'),
    },
    {
      key: 'posts',
      title: <FM id="posts.title" defaultMessage="Publicaciones" />,
      desc: <FM id="posts.description" defaultMessage="Gestionar posts / noticias" />,
      href: L('/admin/Publicaciones'),
    },
  ];

  return (
    <AdminGuard agentId="default" showUserChip>
      <div className={styles.wrap}>
        <H1 className={styles.title}><FM id="nav.panel" defaultMessage="Panel de Control" /></H1>
        <div className={styles.grid}>
          {cards.map((c) => (
            <LINK key={c.key} href={c.href} className={styles.card}>
              <div className={styles.cardTitle}>{c.title}</div>
              <div className={styles.cardDesc}>{c.desc}</div>
            </LINK>
          ))}
        </div>
      </div>
    </AdminGuard>
  );
}
