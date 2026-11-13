import { AdminMfaBoundary } from '@/components/admin/AdminMfaBoundary';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminMfaBoundary>{children}</AdminMfaBoundary>;
}
