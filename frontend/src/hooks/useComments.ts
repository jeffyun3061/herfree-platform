'use client';

import { useState } from 'react';
import type { Comment, CommentCreateInput } from '@/domain/comment/types';
import { emptyPage } from '@/domain/common/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getErrorMessage } from '@/lib/api/client';
import * as commentsApi from '@/lib/api/comments';

export function useComments(postId: number) {
  const [page, setPage] = useState(0);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => commentsApi.fetchComments(postId, page),
    [postId, page],
  );

  const addComment = async (input: CommentCreateInput): Promise<boolean> => {
    setIsSubmitting(true);
    setMutationError(null);
    try {
      await commentsApi.createComment(postId, input);
      await refetch();
      return true;
    } catch (err) {
      setMutationError(getErrorMessage(err));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeComment = async (commentId: number): Promise<boolean> => {
    setMutationError(null);
    try {
      await commentsApi.deleteComment(commentId);
      await refetch();
      return true;
    } catch (err) {
      setMutationError(getErrorMessage(err));
      return false;
    }
  };

  return {
    commentPage: data ?? emptyPage<Comment>(),
    page,
    setPage,
    isLoading,
    error,
    mutationError,
    isSubmitting,
    addComment,
    removeComment,
    refetch,
  };
}
