'use client';

import { emptyPage } from '@/domain/common/types';
import type { Video } from '@/domain/video/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as videosApi from '@/lib/api/videos';

export function useVideos(size = 10) {
  const { data, isLoading, error } = useApiQuery(() => videosApi.fetchVideos({ size }), [size]);
  return { videoPage: data ?? emptyPage<Video>(), isLoading, error };
}
