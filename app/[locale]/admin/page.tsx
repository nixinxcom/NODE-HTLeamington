'use client';

import { BUTTON, LINK, BUTTON2, LINK2, NEXTIMAGE, IMAGE, DIV, DIV2, DIV3, INPUT, SELECT, LABEL, INPUT2, SPAN, SPAN1, SPAN2, A, B, P, H1, H2, H3, H4, H5, H6 } from "@/complements/components/ui/wrappers";
import { useParams } from 'next/navigation';
import AdminGuard from '@/complements/admin/AdminGuard'; 
import styles from './admin-home.module.css';
import FM from '@/complements/i18n/FM';

export default function AdminHome() {
  const { locale } = useParams<{ locale: string }>();
  const L = (p: string) => `/${locale}${p}`;

  const cards = [
    {
      key: 'NX Admin Core Panel Test',
      title: <FM id="NXAdminTest.title" defaultMessage="NX Admin Panel Test" />,
      desc: <FM id="NXAdminTest.description" defaultMessage="NX Admin Core Panel Test" />,
      href: L('/admin/test'),
    },
    {
      key: 'Pricing Plans',
      title: <FM id="pricing.title" defaultMessage="Pricing Plans" />,
      desc: <FM id="pricing.description" defaultMessage="Pricing Plans" />,
      href: L('/ClientControlPanel/PricingEmulator'),
    },
    {
      key: 'Capacitor Tokener',
      title: <FM id="Capacitor.title" defaultMessage="CoreCapsTkns" />,
      desc: <FM id="Capacitor.description" defaultMessage="Core Capacitor Tokener" />,
      href: L('/ClientControlPanel/CapacitorTokener'),
    },
    {
      key: 'Control de Accesos',
      title: <FM id="CAR.title" defaultMessage="Control de Accesos" />,
      desc: <FM id="CAR.description" defaultMessage="Control de Accesos" />,
      href: L('/admin/ControlAccessRoles'),
    },
    {
      key: 'settings',
      title: <FM id="settings.title" defaultMessage="Configuración" />,
      desc: <FM id="settings.description" defaultMessage="Ajuste de Configuraciones" />,
      href: L('/admin/settings'),
    },
    {
      key: 'Factory UI',
      title: <FM id="factory.title" defaultMessage="Factory UI" />,
      desc: <FM id="factory.description" defaultMessage="Generar esquemas" />,
      href: L('/admin/factory'),
    },
    {
      key: 'Panel UI',
      title: <FM id="panel.title" defaultMessage="Panels UI" />,
      desc: <FM id="panel.description" defaultMessage="Formularios de datos de UI" />,
      href: L('/admin/panel'),
    },
    {
      key: 'styling',
      title: <FM id="styling.title" defaultMessage="Estilo" />,
      desc: <FM id="styling.description" defaultMessage="Configuración de Estilos" />,
      href: L('/admin/styles'),
    },
    {
      key: 'Campaigns Center',
      title: <FM id="campaigns.title" defaultMessage="Administrador de Campañas" />,
      desc: <FM id="campaigns.description" defaultMessage="Administrador de Campañas de Notificaciones" />,
      href: L('/admin/campaigns-center'),
    },
    {
      key: 'Payments',
      title: <FM id="payments.title" defaultMessage="Administrador de Pagos" />,
      desc: <FM id="payments.description" defaultMessage="Administrador de Pagos PayPal" />,
      href: L('/admin/payments'),
    },
    {
      key: 'cloud',
      title: <FM id="cloud.title" defaultMessage="CloudQueries" />,
      desc: <FM id="cloud.description" defaultMessage="Consultas y herramientas de datos" />,
      href: L('/admin/CloudQueries'),
    },
    {
      key: 'FDV',
      title: <FM id="fdv.title" defaultMessage="Fuente de Verdad" />,
      desc: <FM id="fdv.description" defaultMessage="Data en contexto del AAI" />,
      href: L('/admin/fdv'),
    },
    {
      key: 'posts',
      title: <FM id="posts.title" defaultMessage="Publicaciones" />,
      desc: <FM id="posts.description" defaultMessage="Gestionar posts / noticias" />,
      href: L('/Publicaciones'),
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
