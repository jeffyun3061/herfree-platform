import type { PageData } from '@/domain/common/types';
import type {
  Post,
  PostCreateInput,
  PostDetail,
  PostImageUploadUrlInput,
  PostImageUploadUrlResponse,
  PostUpdateInput,
} from '@/domain/post/types';
import { request } from '@/lib/api/client';

// 백엔드 @PageableDefault 정렬이 오름차순이므로 항상 최신순 정렬을 명시한다
export function fetchPosts(
  boardId: number | undefined,
  page: number,
  size = 15,
  keyword = '',
  sort = 'createdAt,desc',
): Promise<PageData<Post>> {
  return request<PageData<Post>>('/api/posts', {
    query: {
      boardId,
      page,
      size,
      keyword: keyword.trim() || undefined,
      sort,
    },
  });
}

export function fetchPost(postId: number): Promise<PostDetail> {
  return request<PostDetail>(`/api/posts/${postId}`);
}

export function createPost(input: PostCreateInput): Promise<PostDetail> {
  return request<PostDetail>('/api/posts', { method: 'POST', body: input });
}

export function updatePost(postId: number, input: PostUpdateInput): Promise<PostDetail> {
  return request<PostDetail>(`/api/posts/${postId}`, { method: 'PATCH', body: input });
}

export function deletePost(postId: number): Promise<void> {
  return request<void>(`/api/posts/${postId}`, { method: 'DELETE' });
}

export function requestPostImageUploadUrl(
  input: PostImageUploadUrlInput,
): Promise<PostImageUploadUrlResponse> {
  return request<PostImageUploadUrlResponse>('/api/posts/images/upload-url', {
    method: 'POST',
    body: input,
  });
}

export async function uploadPostImage(file: File): Promise<string> {
  const { uploadUrl, imageUrl } = await requestPostImageUploadUrl({
    contentType: file.type,
    contentLength: file.size,
  });

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error('이미지 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  }

  return imageUrl;
}
