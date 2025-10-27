'use client';

import Link from 'next/link';
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
      enabled: Settings?.faculties?.settings ?? false,
    },
    {
      key: 'branding',
      title: <FM id="branding.title" defaultMessage="Branding" />,
      desc: <FM id="branding.description" defaultMessage="Configuración de la Marca" />,
      href: L('/admin/branding'),
      enabled: Settings?.faculties?.branding ?? true,
    },
    {
      key: 'styling',
      title: <FM id="styling.title" defaultMessage="Estilo" />,
      desc: <FM id="styling.description" defaultMessage="Configuración de Estilos" />,
      href: L('/admin/styles'),
      enabled: Settings?.faculties?.styles ?? true,
    },
    {
      key: 'agent',
      title: <FM id="agent.title" defaultMessage="Agentes" />,
      desc: <FM id="agent.description" defaultMessage="Configurar el agente de IA" />,
      href: L('/admin/agent'),
      enabled: Settings?.faculties?.agentAI ?? true,
    },
    {
      key: 'cloud',
      title: <FM id="cloud.title" defaultMessage="CloudQueries" />,
      desc: <FM id="cloud.description" defaultMessage="Consultas y herramientas de datos" />,
      href: L('/admin/CloudQueries'),
      enabled: true,
    },
    // {
    //   key: 'posts',
    //   title: <FM id="posts.title" defaultMessage="Publicaciones" />,
    //   desc: <FM id="posts.description" defaultMessage="Gestionar posts / noticias" />,
    //   href: L('/admin/Publicaciones'),
    //   enabled: true,
    // },
  ];

  return (
    <AdminGuard agentId="default" showUserChip>
      <div className={styles.wrap}>
        <h1 className={styles.title}><FM id="nav.panel" defaultMessage="Panel de Control" /></h1>
        <div className={styles.grid}>
          {cards.map((c) => (
            c.enabled && (
              <Link key={c.key} href={c.href} className={styles.card}>
                <div className={styles.cardTitle}>{c.title}</div>
                <div className={styles.cardDesc}>{c.desc}</div>
              </Link>
            )
          ))}
        </div>
      </div>
    </AdminGuard>
  );
}
