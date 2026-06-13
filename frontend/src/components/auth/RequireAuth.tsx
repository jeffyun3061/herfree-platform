'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const loginHref = useMemo(() => {
    const currentPath =
      pathname +
      (searchParams.toString() ? `?${searchParams.toString()}` : '');
    return `${redirectTo}?from=${encodeURIComponent(currentPath)}`;
  }, [pathname, redirectTo, searchParams]);

  useEffect(() => {
    if (isReady && !isLoggedIn) {
      router.replace(loginHref);
    }
  }, [isReady, isLoggedIn, router, loginHref]);

  if (!isReady) return <LoadingSpinner />;
  if (!isLoggedIn) return null;
  return <>{children}</>;
}
