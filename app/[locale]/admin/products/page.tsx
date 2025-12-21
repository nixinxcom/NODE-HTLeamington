import AdminGuard from '@/complements/admin/AdminGuard';
import AdminPanel from '@/complements/factory/AdminPanel';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProductsAdminPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <AdminGuard agentId="default" showUserChip>
      <AdminPanel locale={locale} lockedSchemaId="products" hideSelectors />
    </AdminGuard>
  );
}
