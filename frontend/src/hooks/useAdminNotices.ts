'use client';

import { emptyPage } from '@/domain/common/types';
import type { AdminNotice } from '@/domain/notice/types';
import type { AdminListQuery, AdminModerationStatus } from '@/lib/api/admin';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as adminApi from '@/lib/api/admin';

export type AdminNoticesQuery = {
  page: number;
  keyword?: string;
  status?: AdminModerationStatus | '';
  size?: number;
};

export function useAdminNotices(query: AdminNoticesQuery) {
  const params: AdminListQuery = {
    page: query.page,
    size: query.size ?? 20,
    keyword: query.keyword || undefined,
    status: query.status || undefined,
  };

  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminApi.fetchAdminNotices(params),
    [params.page, params.size, params.keyword, params.status],
  );

  return { noticePage: data ?? emptyPage<AdminNotice>(), isLoading, error, refetch };
}
