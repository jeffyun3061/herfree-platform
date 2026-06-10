import type { PageData } from '@/domain/common/types';
import type { Video } from '@/domain/video/types';
import { request } from '@/lib/api/client';

export function fetchVideos(params: { page?: number; size?: number } = {}): Promise<PageData<Video>> {
  return request<PageData<Video>>('/api/videos', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: 'createdAt,desc',
    },
  });
}

export function fetchVideo(videoId: number): Promise<Video> {
  return request<Video>(`/api/videos/${videoId}`);
}
