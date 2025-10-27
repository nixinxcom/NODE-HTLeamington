// app/publicaciones/layout.tsx
'use client';
import { useParams } from 'next/navigation';
import AdminGuard from '@/complements/admin/AdminGuard';
import { useAuth } from '@/complements/components/AuthenticationComp/AuthContext'; // ajusta si tu hook es useAuthContext()
import FM from '@/complements/i18n/FM';
import SuperAdminOnly from '@/complements/admin/SuperAdminOnly';

export default function Layout({ children }: { children: React.ReactNode }) {
  // si quieres el locale para mostrarlo en títulos, lo tienes aquí
  const { locale } = useParams<{ locale: string }>();
  const { loading } = useAuth(); // <- evita redirigir mientras carga el rol/usuario

  if (loading) {
    // opcional: spinner/skeleton. Deja vacío para no parpadear ni redirigir.
    return null;
  }

  return (
    <AdminGuard
      agentId="default"
      showUserChip
      title={<FM id="settings.section.title" defaultMessage="Configuración"/>}
      subtitle={<FM id="settings.section.description" defaultMessage="Gestión de Configuraciones"/>}
    >
      <SuperAdminOnly>
        {children}
      </SuperAdminOnly>
    </AdminGuard>
  );
}