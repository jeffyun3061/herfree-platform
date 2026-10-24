import { AdminMfaBoundary } from '@/components/admin/AdminMfaBoundary';
import { privatePageMetadata } from '@/lib/privatePageMetadata';

export const metadata = privatePageMetadata;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminMfaBoundary>{children}</AdminMfaBoundary>;
}
