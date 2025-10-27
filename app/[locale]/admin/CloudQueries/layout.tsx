'use client';

import React from 'react';
import AdminGuard from '@/complements/admin/AdminGuard';

/**
 * Layout de CloudQueries por locale.
 * - Mantiene el AdminGuard (misma ruta que ya usas en el repo).
 * - Renderiza siempre los children (el archivo anterior no los renderizaba).
 * - No introduce dependencias de estilos (solo estructura).
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard
      title="Cloud Queries"
      subtitle="Consulta y exporta colecciones de Firestore"
      showUserChip
    >
      {children}
    </AdminGuard>
  );
}
