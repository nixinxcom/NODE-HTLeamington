import AdminCorePanel from '@/complements/admin/AdminCorePanel';
import AdminGuard from '@/complements/admin/AdminGuard';

export default function testPage() {
  return (
    <AdminGuard>
        <AdminCorePanel locale='es'/>
    </AdminGuard>
  );
}