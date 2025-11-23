// app/[locale]/admin/factory/page.tsx

import AdminGuard from '@/complements/admin/AdminGuard';
import FuiPanel from '@/complements/factory/FuiPanel';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FactoryPage({ params }: PageProps) {
  const { locale } = await params; // ✅ esto está correcto

  return (
    <AdminGuard agentId="default" showUserChip>
      <FuiPanel locale={locale} />
    </AdminGuard>
  );
}
