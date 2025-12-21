'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import AdminGuard from '@/complements/admin/AdminGuard';
import AdminPanel from '@/complements/factory/AdminPanel';

/**
 * Admin dedicado para Servicios.
 * - PanelSchema: services (Providers/Services)
 * - Sin selectores para evitar que el usuario termine editando otro provider por error.
 */
export default function ServicesAdmin() {
  const { locale } = useParams<{ locale: string }>();

  return (
    <AdminGuard agentId="default" showUserChip>
      <AdminPanel
        locale={locale}
        lockedSchemaId="services"
        hideSelectors
      />
    </AdminGuard>
  );
}
