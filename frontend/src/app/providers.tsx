'use client';

import { Suspense } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
