import AdminPanel from '@/complements/factory/AdminPanel';

export default function ProductsAdmin({ locale }: { locale: string }) {
  return (
    <AdminPanel locale={locale} lockedSchemaId="products" hideSelectors />
  );
}
