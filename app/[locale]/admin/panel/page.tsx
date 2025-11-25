// app/[locale]/admin/panel/page.tsx
import AdminGuard from '@/complements/admin/AdminGuard';
import { AdminPanel } from '@/complements/factory/AdminPanel';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PanelPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <AdminGuard agentId="default" showUserChip>
      <AdminPanel locale={locale} />
    </AdminGuard>
  );
}
