'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
