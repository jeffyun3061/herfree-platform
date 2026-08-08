import type { PageData } from '@/domain/common/types';
import type {
  Post,
  PostCreateInput,
  PostDetail,
  PostImageUploadResponse,
  PostUpdateInput,
} from '@/domain/post/types';
import {
  POST_IMAGE_MAX_BYTES,
  resolvePostImageContentType,
  pickPostImageUrlForCreate,
} from '@/domain/post/types';
import { request, requestMultipart } from '@/lib/api/client';
import { preparePostImageForUpload } from '@/lib/postImageCompress';

// 백엔드 @PageableDefault 정렬이 오름차순이므로 항상 최신순 정렬을 명시한다
export function fetchPosts(
  boardId: number | undefined,
  page: number,
  size = 15,
  keyword = '',
  sort = 'createdAt,desc',
  period?: 'week' | 'all',
): Promise<PageData<Post>> {
  return request<PageData<Post>>('/api/posts', {
    query: {
      boardId,
      page,
      size,
      keyword: keyword.trim() || undefined,
      sort,
      period: period ?? undefined,
    },
  });
}

export function fetchPost(postId: number): Promise<PostDetail> {
  return request<PostDetail>(`/api/posts/${postId}`);
}

export type PostBookmarkStatus = {
  bookmarked: boolean;
};

export function fetchBookmarkedPosts(page: number, size = 10): Promise<PageData<Post>> {
  return request<PageData<Post>>('/api/posts/bookmarks', {
    query: { page, size, sort: 'createdAt,desc' },
  });
}

export function fetchPostBookmarkStatus(postId: number): Promise<PostBookmarkStatus> {
  return request<PostBookmarkStatus>(`/api/posts/${postId}/bookmark`);
}

export function bookmarkPost(postId: number): Promise<PostBookmarkStatus> {
  return request<PostBookmarkStatus>(`/api/posts/${postId}/bookmark`, { method: 'PUT' });
}

export function removePostBookmark(postId: number): Promise<PostBookmarkStatus> {
  return request<PostBookmarkStatus>(`/api/posts/${postId}/bookmark`, { method: 'DELETE' });
}

export function createPost(input: PostCreateInput): Promise<PostDetail> {
  const imageUrl = pickPostImageUrlForCreate(input.imageUrl);
  const body = {
    boardId: input.boardId,
    title: input.title,
    content: input.content,
    isAnonymous: input.isAnonymous,
    ...(input.visibility ? { visibility: input.visibility } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  };
  return request<PostDetail>('/api/posts', { method: 'POST', body });
}

export function updatePost(postId: number, input: PostUpdateInput): Promise<PostDetail> {
  return request<PostDetail>(`/api/posts/${postId}`, { method: 'PATCH', body: input });
}

export function deletePost(postId: number): Promise<void> {
  return request<void>(`/api/posts/${postId}`, { method: 'DELETE' });
}

/** API 서버 경유 업로드 — 브라우저→S3 직접 PUT(CORS) 대신 사용 */
export async function uploadPostImage(file: File): Promise<string> {
  const contentType = resolvePostImageContentType(file);
  if (!contentType) {
    throw new Error('JPEG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.');
  }

  const prepared = await preparePostImageForUpload(file, contentType);
  if (prepared.size > POST_IMAGE_MAX_BYTES) {
    throw new Error('이미지는 10MB 이하만 업로드할 수 있습니다.');
  }

  const formData = new FormData();
  formData.append('file', prepared, prepared.name);

  const { imageUrl } = await requestMultipart<PostImageUploadResponse>(
    '/api/posts/images/upload',
    formData,
  );

  return imageUrl;
}
