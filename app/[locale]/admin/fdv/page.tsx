// complements/admin/fdv

import FDVTest from '@/complements/admin/fdv';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FactoryPage({ params }: PageProps) {
  const { locale } = await params; // ✅ esto está correcto

  return (
    <FDVTest/>
  );
}
