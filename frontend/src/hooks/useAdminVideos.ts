'use client';

import { emptyPage } from '@/domain/common/types';
import type { Video } from '@/domain/video/types';
import type { AdminListQuery, AdminModerationStatus } from '@/lib/api/admin';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as adminApi from '@/lib/api/admin';

export type AdminVideosQuery = {
  page: number;
  keyword?: string;
  status?: AdminModerationStatus | '';
  size?: number;
};

function toVisibleFilter(status: AdminModerationStatus | '' | undefined): boolean | undefined {
  if (status === 'ACTIVE') return true;
  if (status === 'HIDDEN') return false;
  return undefined;
}

export function useAdminVideos(query: AdminVideosQuery) {
  const params: AdminListQuery = {
    page: query.page,
    size: query.size ?? 10,
    keyword: query.keyword || undefined,
    visible: toVisibleFilter(query.status),
  };

  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminApi.fetchAdminVideos(params),
    [params.page, params.size, params.keyword, params.visible],
  );

  return { videoPage: data ?? emptyPage<Video>(), isLoading, error, refetch };
}
