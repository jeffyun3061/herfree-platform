'use client';

import { useState } from 'react';
import { emptyPage } from '@/domain/common/types';
import type { Post } from '@/domain/post/types';
import type { PostCreateInput, PostUpdateInput } from '@/domain/post/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getErrorMessage } from '@/lib/api/client';
import * as postsApi from '@/lib/api/posts';

// 게시판별 게시글 목록 — 페이지 상태까지 훅이 관리한다
export function usePostList(
  boardId: number | null | undefined,
  size = 15,
  keyword = '',
) {
  const [page, setPage] = useState(0);
  const normalizedBoardId = boardId ?? undefined;
  const { data, isLoading, error, refetch } = useApiQuery(
    () => postsApi.fetchPosts(normalizedBoardId, page, size, keyword),
    [normalizedBoardId, page, size, keyword],
  );
  return { postPage: data ?? emptyPage<Post>(), page, setPage, isLoading, error, refetch };
}

export function usePostDetail(postId: number) {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => postsApi.fetchPost(postId),
    [postId],
    { enabled: postId > 0 },
  );
  return { post: data, isLoading, error, refetch };
}

// 작성·수정·삭제 — 페이지 컴포넌트에서 fetch를 직접 다루지 않도록 mutation을 훅으로 분리
export function usePostMutation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async <T,>(action: () => Promise<T>): Promise<T | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    createPost: (input: PostCreateInput) => run(() => postsApi.createPost(input)),
    updatePost: (postId: number, input: PostUpdateInput) =>
      run(() => postsApi.updatePost(postId, input)),
    deletePost: (postId: number) => run(async () => {
      await postsApi.deletePost(postId);
      return true;
    }),
  };
}
