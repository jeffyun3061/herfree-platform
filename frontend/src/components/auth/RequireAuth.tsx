'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type RequireAuthProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

// 보호 라우트 — 세션 복원이 끝난 뒤에만 리다이렉트해 깜빡임을 줄인다
export function RequireAuth({ children, redirectTo = '/login' }: RequireAuthProps) {
  const { isReady, isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !isLoggedIn) {
      router.replace(redirectTo);
    }
  }, [isReady, isLoggedIn, router, redirectTo]);

  if (!isReady) return <LoadingSpinner />;
  if (!isLoggedIn) return null;
  return <>{children}</>;
}
