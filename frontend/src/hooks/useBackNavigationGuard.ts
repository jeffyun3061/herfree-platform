'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { installBackNavigationGuard } from '@/lib/navigateBack';

export function useBackNavigationGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => installBackNavigationGuard(pathname, router), [pathname, router]);
}
