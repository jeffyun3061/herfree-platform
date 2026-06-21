'use client';

import { useState } from 'react';
import { emptyPage } from '@/domain/common/types';
import type { AdminCommunityComment, AdminCommunityPost, AdminModerationStatus } from '@/lib/api/admin';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getErrorMessage } from '@/lib/api/client';
import * as adminApi from '@/lib/api/admin';

const PAGE_SIZE = 20;

type ModerationTarget = 'posts' | 'comments';

export function useAdminModeration(
  target: ModerationTarget,
  status: AdminModerationStatus | '',
  keyword: string,
) {
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const trimmedKeyword = keyword.trim();
  const statusParam = status || undefined;

  const listParams = {
    page,
    size: PAGE_SIZE,
    keyword: trimmedKeyword || undefined,
    status: statusParam,
  };

  const postQuery = useApiQuery(
    () => adminApi.fetchAdminCommunityPosts(listParams),
    [page, status, trimmedKeyword],
    { enabled: target === 'posts' },
  );

  const commentQuery = useApiQuery(
    () => adminApi.fetchAdminCommunityComments(listParams),
    [page, status, trimmedKeyword],
    { enabled: target === 'comments' },
  );

  const activeQuery = target === 'posts' ? postQuery : commentQuery;

  const runAction = async (action: () => Promise<void>): Promise<boolean> => {
    setIsProcessing(true);
    setActionError(null);
    try {
      await action();
      await activeQuery.refetch();
      return true;
    } catch (err) {
      setActionError(getErrorMessage(err));
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const hidePost = (postId: number) => runAction(() => adminApi.hidePost(postId));
  const restorePost = (postId: number) => runAction(() => adminApi.restorePost(postId));
  const hideComment = (commentId: number) => runAction(() => adminApi.hideComment(commentId));
  const restoreComment = (commentId: number) => runAction(() => adminApi.restoreComment(commentId));

  return {
    postPage: postQuery.data ?? emptyPage<AdminCommunityPost>(),
    commentPage: commentQuery.data ?? emptyPage<AdminCommunityComment>(),
    pageIndex: page,
    setPage,
    isLoading: activeQuery.isLoading,
    error: activeQuery.error,
    actionError,
    isProcessing,
    hidePost,
    restorePost,
    hideComment,
    restoreComment,
    refetch: activeQuery.refetch,
  };
}
