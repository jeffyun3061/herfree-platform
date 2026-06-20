'use client';

import { emptyPage } from '@/domain/common/types';
import type { Content } from '@/domain/content/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as adminApi from '@/lib/api/admin';

export function useAdminContents(size = 50) {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminApi.fetchAdminContents({ size }),
    [size],
  );
  return { contentPage: data ?? emptyPage<Content>(), isLoading, error, refetch };
}
