'use client';

import { emptyPage } from '@/domain/common/types';
import type { Video } from '@/domain/video/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as adminApi from '@/lib/api/admin';

export function useAdminVideos(size = 50) {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminApi.fetchAdminVideos({ size }),
    [size],
  );
  return { videoPage: data ?? emptyPage<Video>(), isLoading, error, refetch };
}
