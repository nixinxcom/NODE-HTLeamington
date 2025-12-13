'use client';

import AdminGuard from '@/complements/admin/AdminGuard';
import StylesTab from '@/complements/admin/StylesTab';

export default function AdminStylesPage() {
  return (
    <AdminGuard>
      <StylesTab />
    </AdminGuard>
  );
}
