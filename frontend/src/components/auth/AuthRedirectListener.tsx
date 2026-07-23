'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_REDIRECT_EVENT } from '@/lib/auth-redirect';

export function AuthRedirectListener() {
  const router = useRouter();

  useEffect(() => {
    const onRedirect = (event: Event) => {
      const path = (event as CustomEvent<string>).detail;
      if (typeof path === 'string' && path.startsWith('/')) {
        router.replace(path);
      }
    };

    window.addEventListener(AUTH_REDIRECT_EVENT, onRedirect);
    return () => window.removeEventListener(AUTH_REDIRECT_EVENT, onRedirect);
  }, [router]);

  return null;
}
