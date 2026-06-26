'use client';

import { useState } from 'react';
import { emptyPage } from '@/domain/common/types';
import type { Video } from '@/domain/video/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as videosApi from '@/lib/api/videos';

export function useVideos(size = 10) {
  const [page, setPage] = useState(0);
  const { data, isLoading, error, refetch } = useApiQuery(
    () => videosApi.fetchVideos({ page, size }),
    [page, size],
  );
  return { videoPage: data ?? emptyPage<Video>(), page, setPage, isLoading, error, refetch };
}
