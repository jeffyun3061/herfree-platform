import type { PageData } from '@/domain/common/types';
import type { Video } from '@/domain/video/types';
import { request } from '@/lib/api/client';
import type { AdminListQuery, VideoCreateInput, VideoCurationInput, VideoUpdateInput } from './types';

export function createVideo(input: VideoCreateInput): Promise<Video> {
  return request<Video>('/api/admin/videos', { method: 'POST', body: input });
}

export function updateVideo(videoId: number, input: VideoUpdateInput): Promise<Video> {
  return request<Video>(`/api/admin/videos/${videoId}`, { method: 'PATCH', body: input });
}

export function setVideoVisibility(videoId: number, isVisible: boolean): Promise<Video> {
  return request<Video>(`/api/admin/videos/${videoId}/visibility`, {
    method: 'PATCH',
    body: { isVisible },
  });
}

export function fetchAdminVideos(params: AdminListQuery = {}): Promise<PageData<Video>> {
  return request<PageData<Video>>('/api/admin/videos', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: 'sortOrder,desc',
      ...(params.keyword ? { keyword: params.keyword } : {}),
      ...(params.visible !== undefined ? { visible: params.visible } : {}),
    },
  });
}

export function deleteVideo(videoId: number): Promise<void> {
  return request<void>(`/api/admin/videos/${videoId}`, { method: 'DELETE' });
}

export function updateVideoCuration(videoId: number, input: VideoCurationInput): Promise<Video> {
  return request<Video>(`/api/admin/videos/${videoId}/curation`, { method: 'PATCH', body: input });
}
