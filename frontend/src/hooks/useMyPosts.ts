'use client';

import { useState } from 'react';
import { emptyPage } from '@/domain/common/types';
import type { Post } from '@/domain/post/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as usersApi from '@/lib/api/users';
import * as postsApi from '@/lib/api/posts';

export type MyPostCollection = 'written' | 'received' | 'bookmarked';

export function useMyPosts(
  enabled: boolean,
  collection: MyPostCollection,
  size = 10,
  boardId?: number,
) {
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useApiQuery(
    () => {
      if (collection === 'received') {
        return usersApi.fetchMyPostsWithReceivedReactions(page, size);
      }
      if (collection === 'bookmarked') {
        return postsApi.fetchBookmarkedPosts(page, size);
      }
      return usersApi.fetchMyPosts(page, size, boardId);
    },
    [page, size, boardId, collection],
    { enabled },
  );
  return { postPage: data ?? emptyPage<Post>(), page, setPage, isLoading, error };
}
