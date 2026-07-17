'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as postsApi from '@/lib/api/posts';
import { getErrorMessage } from '@/lib/api/client';

export function usePostBookmark(postId: number, enabled: boolean) {
  const { data, isLoading, error: queryError, refetch } = useApiQuery(
    () => postsApi.fetchPostBookmarkStatus(postId),
    [postId],
    { enabled },
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const toggle = async () => {
    if (!data || isUpdating) return;
    setIsUpdating(true);
    setMutationError(null);
    try {
      if (data.bookmarked) {
        await postsApi.removePostBookmark(postId);
      } else {
        await postsApi.bookmarkPost(postId);
      }
      await refetch();
    } catch (error) {
      setMutationError(getErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    bookmarked: data?.bookmarked ?? false,
    isLoading,
    isUpdating,
    error: mutationError ?? queryError,
    toggle,
  };
}
