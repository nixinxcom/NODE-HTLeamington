// /complements/factory/FuiPanel

import FuiPanel from '@/complements/factory/FuiPanel';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FactoryPage({ params }: PageProps) {
  const { locale } = await params; // ✅ esto está correcto

  return (
    <FuiPanel locale={locale} />
  );
}
