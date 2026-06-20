'use client';

import { emptyPage } from '@/domain/common/types';
import type { AdminNotice } from '@/domain/notice/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as adminApi from '@/lib/api/admin';

export function useAdminNotices(size = 50) {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminApi.fetchAdminNotices({ size }),
    [size],
  );
  return { noticePage: data ?? emptyPage<AdminNotice>(), isLoading, error, refetch };
}
