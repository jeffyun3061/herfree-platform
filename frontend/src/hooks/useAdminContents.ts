'use client';

import { emptyPage } from '@/domain/common/types';
import type { Content } from '@/domain/content/types';
import type { AdminListQuery, AdminModerationStatus } from '@/lib/api/admin';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as adminApi from '@/lib/api/admin';

export type AdminContentsQuery = {
  page: number;
  keyword?: string;
  status?: AdminModerationStatus | '';
  category?: string;
  size?: number;
};

export function useAdminContents(query: AdminContentsQuery) {
  const params: AdminListQuery = {
    page: query.page,
    size: query.size ?? 20,
    keyword: query.keyword || undefined,
    status: query.status || undefined,
    category: query.category || undefined,
  };

  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminApi.fetchAdminContents(params),
    [params.page, params.size, params.keyword, params.status, params.category],
  );

  return { contentPage: data ?? emptyPage<Content>(), isLoading, error, refetch };
}
