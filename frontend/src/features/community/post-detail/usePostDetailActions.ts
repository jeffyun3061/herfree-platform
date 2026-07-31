'use client';

import { useCallback } from 'react';
import { useAsyncMutation } from '@/hooks/useAsyncMutation';
import { usePostMutation } from '@/hooks/usePosts';
import * as adminApi from '@/lib/api/admin';

/**
 * Owns post-detail mutation transport so the page/container only coordinates UI
 * state and navigation. It intentionally keeps post and moderation APIs separate:
 * the two operations have distinct authorization and failure semantics.
 */
export function usePostDetailActions(postId: number) {
  const {
    deletePost,
    isSubmitting: isDeletingPost,
    error: deletePostError,
  } = usePostMutation();
  const {
    run: runModeration,
    isPending: isModerating,
    error: moderationError,
  } = useAsyncMutation();

  const deleteCurrentPost = useCallback(
    () => deletePost(postId),
    [deletePost, postId],
  );

  const hideCurrentPost = useCallback(async (): Promise<boolean> => {
    const result = await runModeration(async () => {
      await adminApi.hidePost(postId);
      return true;
    });
    return result === true;
  }, [postId, runModeration]);

  const hideComment = useCallback(async (commentId: number): Promise<boolean> => {
    const result = await runModeration(async () => {
      await adminApi.hideComment(commentId);
      return true;
    });
    return result === true;
  }, [runModeration]);

  return {
    deleteCurrentPost,
    hideCurrentPost,
    hideComment,
    isPending: isDeletingPost || isModerating,
    error: deletePostError ?? moderationError,
  };
}
