// app/publicaciones/layout.tsx
'use client';
import { useParams } from 'next/navigation';
import AdminGuard from '@/complements/admin/AdminGuard';
import { useAuth } from '@/complements/components/AuthenticationComp/AuthContext'; // ajusta si tu hook es useAuthContext()

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
      title="Branding"
      subtitle="Contenido y apariencia del sitio"
    >
      {children}
    </AdminGuard>
  );
}