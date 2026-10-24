import { privatePageMetadata } from '@/lib/privatePageMetadata';

export const metadata = privatePageMetadata;

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
